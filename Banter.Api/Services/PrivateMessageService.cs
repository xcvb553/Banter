using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Utils;
using Microsoft.EntityFrameworkCore;

namespace Banter.Services
{
    public class PrivateMessageService
    {
        private readonly AppDbContext _context;
        private readonly FriendshipService _friendshipService;
        private readonly NotificationService _notificationService;

        public PrivateMessageService(AppDbContext context, FriendshipService friendshipService, NotificationService notificationService)
        {
            _context = context;
            _friendshipService = friendshipService;
            _notificationService = notificationService;
        }

        public async Task<Result<List<PrivateMessageDto>>> GetMessagesAsync(Guid userId, Guid friendId, DateTime? before, int take)
        {
            take = Math.Clamp(take, 1, 100);

            var query = _context.PrivateMessages.Where(m =>
                (m.SenderId == userId && m.ReceiverId == friendId) ||
                (m.SenderId == friendId && m.ReceiverId == userId));

            if (before != null)
            {
                var beforeUtc = before.Value.ToUniversalTime();
                query = query.Where(m => m.SentAt < beforeUtc);
            }

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Take(take)
                .ToListAsync();

            messages.Reverse();
            return Result<List<PrivateMessageDto>>.Success(messages.Select(m => m.ToDto()).ToList());
        }

        public async Task<Result<PrivateMessageDto>> SendMessageAsync(Guid senderId, Guid receiverId, string content)
        {
            if (!await _friendshipService.AreFriendsAsync(senderId, receiverId))
                return Result<PrivateMessageDto>.Forbidden("You can only send messages to your friends");

            var message = new PrivateMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content.Trim()
            };

            _context.PrivateMessages.Add(message);
            await _context.SaveChangesAsync();

            var dto = message.ToDto();
            await _notificationService.SendToUsersAsync(new[] { senderId, receiverId }, "PrivateMessageReceived", dto);

            return Result<PrivateMessageDto>.Success(dto);
        }

        public async Task<Result> MarkAsReadAsync(Guid userId, Guid friendId)
        {
            var unread = await _context.PrivateMessages
                .Where(m => m.ReceiverId == userId && m.SenderId == friendId && !m.IsRead)
                .ToListAsync();

            foreach (var message in unread)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<List<UnreadCountDto>>> GetUnreadCountsAsync(Guid userId)
        {
            var counts = await _context.PrivateMessages
                .Where(m => m.ReceiverId == userId && !m.IsRead)
                .GroupBy(m => m.SenderId)
                .Select(g => new UnreadCountDto { Id = g.Key, Count = g.Count() })
                .ToListAsync();

            return Result<List<UnreadCountDto>>.Success(counts);
        }
    }
}
