using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Utils;
using Microsoft.EntityFrameworkCore;

namespace Banter.Services
{
    public class MessageService
    {
        public const int MaxFiles = 5;
        public const long MaxFileSize = 10 * 1024 * 1024;

        private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private static readonly string[] VideoExtensions = { ".mp4", ".webm" };
        private static readonly string[] DocumentExtensions = { ".pdf", ".txt", ".csv", ".json", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip" };

        private readonly AppDbContext _context;
        private readonly ServerService _serverService;
        private readonly NotificationService _notificationService;
        private readonly FileStorageService _fileStorage;

        public MessageService(AppDbContext context, ServerService serverService,
                              NotificationService notificationService, FileStorageService fileStorage)
        {
            _context = context;
            _serverService = serverService;
            _notificationService = notificationService;
            _fileStorage = fileStorage;
        }

        public async Task<Result<List<MessageDto>>> GetMessagesAsync(Guid channelId, Guid userId, DateTime? before, int take)
        {
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                return Result<List<MessageDto>>.NotFound("Channel not found");

            if (!await _serverService.IsMemberAsync(channel.ServerId, userId))
                return Result<List<MessageDto>>.Forbidden("You are not a member of this server");

            take = Math.Clamp(take, 1, 100);

            var query = _context.Messages
                .Include(m => m.User)
                .Include(m => m.Channel)
                .Include(m => m.Reactions)
                .Include(m => m.Attachments)
                .Where(m => m.ChannelId == channelId);

            if (before != null)
            {
                var beforeUtc = before.Value.ToUniversalTime();
                query = query.Where(m => m.CreatedAt < beforeUtc);
            }

            var messages = await query
                .OrderByDescending(m => m.CreatedAt)
                .Take(take)
                .AsSplitQuery()
                .ToListAsync();

            messages.Reverse();

            return Result<List<MessageDto>>.Success(messages.Select(m => m.ToDto()).ToList());
        }

        public async Task<Result<MessageDto>> SendMessageAsync(Guid channelId, Guid userId, string? content, List<IFormFile>? files)
        {
            content = content?.Trim() ?? "";
            files ??= new List<IFormFile>();

            if (content.Length == 0 && files.Count == 0)
                return Result<MessageDto>.Failure("Message can't be empty");

            if (content.Length > 2000)
                return Result<MessageDto>.Failure("Message is too long (max 2000 characters)");

            if (files.Count > MaxFiles)
                return Result<MessageDto>.Failure($"You can send max {MaxFiles} files at once");

            foreach (var file in files)
            {
                if (file.Length > MaxFileSize)
                    return Result<MessageDto>.Failure($"File {file.FileName} is too big (max 10 MB)");

                if (GetAttachmentType(file.FileName) == null)
                    return Result<MessageDto>.Failure($"File type of {file.FileName} is not allowed");
            }

            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                return Result<MessageDto>.NotFound("Channel not found");

            if (channel.ChannelType != ChannelType.Text)
                return Result<MessageDto>.Failure("You can't send messages to a voice channel");

            if (!await _serverService.IsMemberAsync(channel.ServerId, userId))
                return Result<MessageDto>.Forbidden("You are not a member of this server");

            var message = new Message
            {
                ChannelId = channelId,
                UserId = userId,
                Content = content
            };

            foreach (var file in files)
            {
                var url = await _fileStorage.SaveAsync(file, "uploads");
                message.Attachments.Add(new Attachment
                {
                    Url = url,
                    FileName = Path.GetFileName(file.FileName),
                    Size = file.Length,
                    Type = GetAttachmentType(file.FileName)!.Value
                });
            }

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            await _context.Entry(message).Reference(m => m.User).LoadAsync();

            var dto = message.ToDto();
            await _notificationService.SendToGroupAsync(HubGroups.Server(channel.ServerId), "MessageReceived", dto);

            return Result<MessageDto>.Success(dto);
        }

        public async Task<Result<MessageDto>> EditMessageAsync(Guid messageId, Guid userId, string newContent)
        {
            var message = await LoadMessageAsync(messageId);
            if (message == null)
                return Result<MessageDto>.NotFound("Message not found");

            if (message.UserId != userId)
                return Result<MessageDto>.Forbidden("You can only edit your own messages");

            newContent = newContent.Trim();
            if (newContent == message.Content)
                return Result<MessageDto>.Success(message.ToDto());

            _context.MessageEditHistories.Add(new MessageEditHistory
            {
                MessageId = message.MessageId,
                OldContent = message.Content
            });

            message.Content = newContent;
            message.IsEdited = true;
            message.EditedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = message.ToDto();
            await _notificationService.SendToGroupAsync(HubGroups.Server(message.Channel.ServerId), "MessageUpdated", dto);

            return Result<MessageDto>.Success(dto);
        }

        public async Task<Result> DeleteMessageAsync(Guid messageId, Guid userId)
        {
            var message = await LoadMessageAsync(messageId);
            if (message == null)
                return Result.NotFound("Message not found");

            var server = await _context.Servers.FindAsync(message.Channel.ServerId);
            if (message.UserId != userId && server?.OwnerId != userId)
                return Result.Forbidden("You can't delete this message");

            foreach (var attachment in message.Attachments)
            {
                _fileStorage.Delete(attachment.Url);
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            await _notificationService.SendToGroupAsync(HubGroups.Server(message.Channel.ServerId), "MessageDeleted",
                new { messageId, channelId = message.ChannelId });

            return Result.Success();
        }

        public async Task<Result<List<ReactionDto>>> ToggleReactionAsync(Guid messageId, Guid userId, string reactionType)
        {
            var message = await _context.Messages
                .Include(m => m.Channel)
                .Include(m => m.Reactions)
                .FirstOrDefaultAsync(m => m.MessageId == messageId);
            if (message == null)
                return Result<List<ReactionDto>>.NotFound("Message not found");

            if (!await _serverService.IsMemberAsync(message.Channel.ServerId, userId))
                return Result<List<ReactionDto>>.Forbidden("You are not a member of this server");

            var existing = message.Reactions.FirstOrDefault(r => r.UserId == userId && r.ReactionType == reactionType);
            if (existing != null)
            {
                message.Reactions.Remove(existing);
            }
            else
            {
                message.Reactions.Add(new Reaction { UserId = userId, ReactionType = reactionType });
            }
            await _context.SaveChangesAsync();

            var reactions = message.Reactions.Select(r => r.ToDto()).ToList();
            await _notificationService.SendToGroupAsync(HubGroups.Server(message.Channel.ServerId), "ReactionsUpdated",
                new { messageId, channelId = message.ChannelId, reactions });

            return Result<List<ReactionDto>>.Success(reactions);
        }

        private async Task<Message?> LoadMessageAsync(Guid messageId)
        {
            return await _context.Messages
                .Include(m => m.User)
                .Include(m => m.Channel)
                .Include(m => m.Reactions)
                .Include(m => m.Attachments)
                .AsSplitQuery()
                .FirstOrDefaultAsync(m => m.MessageId == messageId);
        }

        private static AttachmentType? GetAttachmentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            if (ImageExtensions.Contains(extension)) return AttachmentType.Image;
            if (VideoExtensions.Contains(extension)) return AttachmentType.Video;
            if (DocumentExtensions.Contains(extension)) return AttachmentType.Document;

            return null;
        }
    }
}
