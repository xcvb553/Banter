using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Utils;
using Microsoft.EntityFrameworkCore;

namespace Banter.Services
{
    public class GroupService
    {
        private readonly AppDbContext _context;
        private readonly FriendshipService _friendshipService;
        private readonly NotificationService _notificationService;
        private readonly ConnectionTracker _connections;
        private readonly ILogger<GroupService> _logger;

        public GroupService(AppDbContext context, FriendshipService friendshipService,
                            NotificationService notificationService, ConnectionTracker connections,
                            ILogger<GroupService> logger)
        {
            _context = context;
            _friendshipService = friendshipService;
            _notificationService = notificationService;
            _connections = connections;
            _logger = logger;
        }

        public async Task<Result<List<FriendGroupDto>>> GetGroupsAsync(Guid userId)
        {
            var groups = await _context.FriendGroups
                .Include(g => g.Members)
                .Where(g => g.Members.Any(m => m.Id == userId))
                .OrderBy(g => g.CreatedAt)
                .ToListAsync();

            return Result<List<FriendGroupDto>>.Success(groups.Select(ToDto).ToList());
        }

        public async Task<Result<FriendGroupDto>> CreateGroupAsync(Guid creatorId, CreateGroupDto dto)
        {
            var creator = await _context.Users.FindAsync(creatorId);
            if (creator == null)
                return Result<FriendGroupDto>.NotFound("User not found");

            var friendIds = await _friendshipService.GetFriendIdsAsync(creatorId);
            var memberIds = dto.MemberIds.Distinct().Where(id => id != creatorId).ToList();
            if (memberIds.Any(id => !friendIds.Contains(id)))
                return Result<FriendGroupDto>.Failure("You can only add your friends to a group");

            var members = await _context.Users.Where(u => memberIds.Contains(u.Id)).ToListAsync();

            var group = new FriendGroup
            {
                Name = dto.Name.Trim(),
                CreatorId = creatorId
            };
            group.Members.Add(creator);
            foreach (var member in members)
            {
                group.Members.Add(member);
            }

            _context.FriendGroups.Add(group);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Group {GroupId} created by {UserId}", group.Id, creatorId);

            foreach (var member in group.Members)
            {
                await _notificationService.AddUserToGroupAsync(member.Id, HubGroups.FriendGroup(group.Id));
            }
            await _notificationService.NotifyUsersAsync(memberIds, "GroupUpdated", new { groupId = group.Id });

            return Result<FriendGroupDto>.Success(ToDto(group));
        }

        public async Task<Result> RenameGroupAsync(Guid groupId, Guid userId, string name)
        {
            var group = await _context.FriendGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
                return Result.NotFound("Group not found");

            if (group.CreatorId != userId)
                return Result.Forbidden("Only the creator can rename the group");

            group.Name = name.Trim();
            await _context.SaveChangesAsync();

            await _notificationService.NotifyUsersAsync(group.Members.Select(m => m.Id), "GroupUpdated", new { groupId });
            return Result.Success();
        }

        public async Task<Result> DeleteGroupAsync(Guid groupId, Guid userId)
        {
            var group = await _context.FriendGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
                return Result.NotFound("Group not found");

            if (group.CreatorId != userId)
                return Result.Forbidden("Only the creator can delete the group");

            var memberIds = group.Members.Select(m => m.Id).ToList();

            _context.FriendGroups.Remove(group);
            await _context.SaveChangesAsync();

            await _notificationService.NotifyUsersAsync(memberIds, "GroupRemoved", new { groupId, groupName = group.Name });
            foreach (var memberId in memberIds)
            {
                await _notificationService.RemoveUserFromGroupAsync(memberId, HubGroups.FriendGroup(groupId));
            }

            return Result.Success();
        }

        public async Task<Result<List<UserDto>>> GetMembersAsync(Guid groupId, Guid userId)
        {
            var group = await _context.FriendGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
                return Result<List<UserDto>>.NotFound("Group not found");

            if (!group.Members.Any(m => m.Id == userId))
                return Result<List<UserDto>>.Forbidden("You are not a member of this group");

            return Result<List<UserDto>>.Success(group.Members.Select(m => m.ToDto(_connections.IsOnline(m.Id))).ToList());
        }

        public async Task<Result<UserDto>> AddMemberAsync(Guid groupId, Guid newMemberId, Guid currentUserId)
        {
            var group = await _context.FriendGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
                return Result<UserDto>.NotFound("Group not found");

            if (group.CreatorId != currentUserId)
                return Result<UserDto>.Forbidden("Only the creator can add members");

            if (group.Members.Any(m => m.Id == newMemberId))
                return Result<UserDto>.Failure("User is already a member of this group");

            if (!await _friendshipService.AreFriendsAsync(currentUserId, newMemberId))
                return Result<UserDto>.Failure("You can only add your friends");

            var user = await _context.Users.FindAsync(newMemberId);
            if (user == null)
                return Result<UserDto>.NotFound("User not found");

            group.Members.Add(user);
            await _context.SaveChangesAsync();

            await _notificationService.AddUserToGroupAsync(newMemberId, HubGroups.FriendGroup(groupId));
            await _notificationService.NotifyUsersAsync(group.Members.Select(m => m.Id), "GroupUpdated", new { groupId });

            return Result<UserDto>.Success(user.ToDto(_connections.IsOnline(user.Id)));
        }

        public async Task<Result> RemoveMemberAsync(Guid groupId, Guid memberId, Guid currentUserId)
        {
            var group = await _context.FriendGroups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
                return Result.NotFound("Group not found");

            if (memberId != currentUserId && group.CreatorId != currentUserId)
                return Result.Forbidden("Only the creator can remove other members");

            if (memberId == group.CreatorId)
                return Result.Failure("The creator can't leave the group, delete it instead");

            var member = group.Members.FirstOrDefault(m => m.Id == memberId);
            if (member == null)
                return Result.NotFound("User is not a member of this group");

            group.Members.Remove(member);
            await _context.SaveChangesAsync();

            await _notificationService.RemoveUserFromGroupAsync(memberId, HubGroups.FriendGroup(groupId));
            await _notificationService.NotifyUsersAsync(new[] { memberId }, "GroupRemoved", new { groupId, groupName = group.Name });
            await _notificationService.NotifyUsersAsync(group.Members.Select(m => m.Id), "GroupUpdated", new { groupId });

            return Result.Success();
        }

        public async Task<Result<List<GroupMessageDto>>> GetMessagesAsync(Guid groupId, Guid userId, DateTime? before, int take)
        {
            if (!await IsMemberAsync(groupId, userId))
                return Result<List<GroupMessageDto>>.Forbidden("You are not a member of this group");

            take = Math.Clamp(take, 1, 100);

            var query = _context.GroupMessages
                .Include(m => m.Sender)
                .Where(m => m.GroupId == groupId);

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
            return Result<List<GroupMessageDto>>.Success(messages.Select(m => m.ToDto()).ToList());
        }

        public async Task<Result<GroupMessageDto>> SendMessageAsync(Guid groupId, Guid senderId, string content)
        {
            if (!await IsMemberAsync(groupId, senderId))
                return Result<GroupMessageDto>.Forbidden("You are not a member of this group");

            var sender = await _context.Users.FindAsync(senderId);

            var message = new GroupMessage
            {
                GroupId = groupId,
                SenderId = senderId,
                Content = content.Trim()
            };
            message.ReadBy.Add(sender!);

            _context.GroupMessages.Add(message);
            await _context.SaveChangesAsync();

            var dto = message.ToDto();
            await _notificationService.SendToGroupAsync(HubGroups.FriendGroup(groupId), "GroupMessageReceived", dto);

            return Result<GroupMessageDto>.Success(dto);
        }

        public async Task<Result> MarkAsReadAsync(Guid groupId, Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Result.NotFound("User not found");

            var unread = await _context.GroupMessages
                .Include(m => m.ReadBy)
                .Where(m => m.GroupId == groupId && !m.ReadBy.Any(u => u.Id == userId))
                .ToListAsync();

            foreach (var message in unread)
            {
                message.ReadBy.Add(user);
            }

            await _context.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<List<UnreadCountDto>>> GetUnreadCountsAsync(Guid userId)
        {
            var counts = await _context.GroupMessages
                .Where(m => m.Group.Members.Any(u => u.Id == userId))
                .Where(m => !m.ReadBy.Any(u => u.Id == userId))
                .GroupBy(m => m.GroupId)
                .Select(g => new UnreadCountDto { Id = g.Key, Count = g.Count() })
                .ToListAsync();

            return Result<List<UnreadCountDto>>.Success(counts);
        }

        private async Task<bool> IsMemberAsync(Guid groupId, Guid userId)
        {
            return await _context.FriendGroups
                .AnyAsync(g => g.Id == groupId && g.Members.Any(m => m.Id == userId));
        }

        private FriendGroupDto ToDto(FriendGroup group) => new()
        {
            Id = group.Id,
            Name = group.Name,
            CreatorId = group.CreatorId,
            Members = group.Members.Select(m => m.ToDto(_connections.IsOnline(m.Id))).ToList()
        };
    }
}
