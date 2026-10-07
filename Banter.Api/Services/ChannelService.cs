using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Utils;
using Microsoft.EntityFrameworkCore;

namespace Banter.Services
{
    public class ChannelService
    {
        private readonly AppDbContext _context;
        private readonly ServerService _serverService;
        private readonly NotificationService _notificationService;

        public ChannelService(AppDbContext context, ServerService serverService, NotificationService notificationService)
        {
            _context = context;
            _serverService = serverService;
            _notificationService = notificationService;
        }

        public async Task<Result<List<ChannelDto>>> GetChannelsByServerIdAsync(Guid serverId, Guid userId)
        {
            if (!await _serverService.IsMemberAsync(serverId, userId))
                return Result<List<ChannelDto>>.Forbidden("You are not a member of this server");

            var channels = await _context.Channels
                .Where(c => c.ServerId == serverId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return Result<List<ChannelDto>>.Success(channels.Select(c => c.ToDto()).ToList());
        }

        public async Task<Result<ChannelDto>> CreateChannelAsync(Guid serverId, ChannelCreateDto dto, Guid userId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result<ChannelDto>.NotFound("Server not found");

            if (server.OwnerId != userId)
                return Result<ChannelDto>.Forbidden("Only the owner can create channels");

            var name = dto.Name.Trim();
            if (dto.ChannelType == ChannelType.Text)
            {
                name = name.ToLowerInvariant().Replace(' ', '-');
            }

            var channel = new Channel
            {
                ServerId = serverId,
                Name = name,
                ChannelType = dto.ChannelType,
                Topic = dto.ChannelType == ChannelType.Text ? dto.Topic?.Trim() : null
            };

            _context.Channels.Add(channel);
            await _context.SaveChangesAsync();

            var channelDto = channel.ToDto();
            await _notificationService.SendToGroupAsync(HubGroups.Server(serverId), "ChannelCreated", channelDto);

            return Result<ChannelDto>.Success(channelDto);
        }

        public async Task<Result> DeleteChannelAsync(Guid channelId, Guid userId)
        {
            var channel = await _context.Channels
                .Include(c => c.Server)
                .FirstOrDefaultAsync(c => c.ChannelId == channelId);
            if (channel == null)
                return Result.NotFound("Channel not found");

            if (channel.Server.OwnerId != userId)
                return Result.Forbidden("Only the owner can delete channels");

            var textChannelsLeft = await _context.Channels
                .CountAsync(c => c.ServerId == channel.ServerId && c.ChannelType == ChannelType.Text);
            if (channel.ChannelType == ChannelType.Text && textChannelsLeft <= 1)
                return Result.Failure("A server needs at least one text channel");

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            await _notificationService.SendToGroupAsync(HubGroups.Server(channel.ServerId), "ChannelDeleted",
                new { channelId, serverId = channel.ServerId });

            return Result.Success();
        }
    }
}
