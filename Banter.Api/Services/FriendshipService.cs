using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Utils;
using Microsoft.EntityFrameworkCore;

namespace Banter.Services
{
    public class FriendshipService
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly ConnectionTracker _connections;

        public FriendshipService(AppDbContext context, NotificationService notificationService, ConnectionTracker connections)
        {
            _context = context;
            _notificationService = notificationService;
            _connections = connections;
        }

        public async Task<bool> AreFriendsAsync(Guid userId, Guid otherUserId)
        {
            return await _context.Friendships.AnyAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.SenderId == userId && f.ReceiverId == otherUserId) ||
                 (f.SenderId == otherUserId && f.ReceiverId == userId)));
        }

        public async Task<List<Guid>> GetFriendIdsAsync(Guid userId)
        {
            return await _context.Friendships
                .Where(f => f.Status == FriendshipStatus.Accepted && (f.SenderId == userId || f.ReceiverId == userId))
                .Select(f => f.SenderId == userId ? f.ReceiverId : f.SenderId)
                .ToListAsync();
        }

        public async Task<Result> SendFriendRequestAsync(Guid senderId, string receiverUserName)
        {
            var receiver = await _context.Users.FirstOrDefaultAsync(u => u.UserName == receiverUserName.Trim());
            if (receiver == null)
                return Result.NotFound("User not found");

            if (receiver.Id == senderId)
                return Result.Failure("You can't add yourself as a friend");

            var existing = await _context.Friendships.FirstOrDefaultAsync(f =>
                (f.SenderId == senderId && f.ReceiverId == receiver.Id) ||
                (f.SenderId == receiver.Id && f.ReceiverId == senderId));

            if (existing != null)
            {
                if (existing.Status == FriendshipStatus.Accepted)
                    return Result.Failure("You are already friends");

                if (existing.SenderId == receiver.Id)
                    return await AcceptFriendRequestAsync(existing.Id, senderId);

                return Result.Failure("Friend request was already sent");
            }

            _context.Friendships.Add(new Friendship
            {
                SenderId = senderId,
                ReceiverId = receiver.Id,
                Status = FriendshipStatus.Pending
            });
            await _context.SaveChangesAsync();

            await _notificationService.NotifyUsersAsync(new[] { receiver.Id }, "FriendRequestReceived", new { senderId });

            return Result.Success();
        }

        public async Task<Result> AcceptFriendRequestAsync(Guid requestId, Guid currentUserId)
        {
            var friendship = await _context.Friendships.FindAsync(requestId);

            if (friendship == null || friendship.ReceiverId != currentUserId || friendship.Status != FriendshipStatus.Pending)
                return Result.NotFound("Friend request not found");

            friendship.Status = FriendshipStatus.Accepted;
            friendship.AcceptedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _notificationService.NotifyUsersAsync(new[] { friendship.SenderId, friendship.ReceiverId },
                "FriendRequestAccepted", new { friendshipId = friendship.Id });

            return Result.Success();
        }

        public async Task<Result> RejectFriendRequestAsync(Guid requestId, Guid currentUserId)
        {
            var friendship = await _context.Friendships.FindAsync(requestId);

            if (friendship == null || friendship.ReceiverId != currentUserId || friendship.Status != FriendshipStatus.Pending)
                return Result.NotFound("Friend request not found");

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<List<FriendRequestDto>>> GetFriendRequestsAsync(Guid userId)
        {
            var requests = await _context.Friendships
                .Where(f => f.ReceiverId == userId && f.Status == FriendshipStatus.Pending)
                .OrderByDescending(f => f.SentAt)
                .Select(f => new FriendRequestDto
                {
                    RequestId = f.Id,
                    SenderId = f.SenderId,
                    ReceiverId = f.ReceiverId,
                    UserName = f.Sender.UserName!,
                    Image = f.Sender.AvatarUrl
                })
                .ToListAsync();

            return Result<List<FriendRequestDto>>.Success(requests);
        }

        public async Task<Result<List<UserDto>>> GetFriendsAsync(Guid userId)
        {
            var friendIds = await GetFriendIdsAsync(userId);

            var friends = await _context.Users
                .Where(u => friendIds.Contains(u.Id))
                .OrderBy(u => u.UserName)
                .ToListAsync();

            return Result<List<UserDto>>.Success(friends.Select(f => f.ToDto(_connections.IsOnline(f.Id))).ToList());
        }

        public async Task<Result> RemoveFriendAsync(Guid userId, Guid friendId)
        {
            var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.SenderId == userId && f.ReceiverId == friendId) ||
                 (f.SenderId == friendId && f.ReceiverId == userId)));

            if (friendship == null)
                return Result.NotFound("Friendship not found");

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            await _notificationService.NotifyUsersAsync(new[] { userId, friendId }, "FriendRemoved",
                new { userId, friendId });

            return Result.Success();
        }
    }
}
