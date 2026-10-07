using Banter.Data;
using Banter.Services;
using Banter.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Banter.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ConnectionTracker _connections;
        private readonly FriendshipService _friendshipService;

        public ChatHub(AppDbContext context, ConnectionTracker connections, FriendshipService friendshipService)
        {
            _context = context;
            _connections = connections;
            _friendshipService = friendshipService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();

            var serverIds = await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .Select(sm => sm.ServerId)
                .ToListAsync();

            var groupIds = await _context.FriendGroups
                .Where(g => g.Members.Any(m => m.Id == userId))
                .Select(g => g.Id)
                .ToListAsync();

            foreach (var serverId in serverIds)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, HubGroups.Server(serverId));
            }
            foreach (var groupId in groupIds)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, HubGroups.FriendGroup(groupId));
            }

            var cameOnline = _connections.Add(userId, Context.ConnectionId);
            if (cameOnline)
            {
                await NotifyFriendsAboutPresence(userId, true);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();

            var wentOffline = _connections.Remove(userId, Context.ConnectionId);
            if (wentOffline)
            {
                await NotifyFriendsAboutPresence(userId, false);
            }

            await base.OnDisconnectedAsync(exception);
        }

        private async Task NotifyFriendsAboutPresence(Guid userId, bool isOnline)
        {
            var payload = new { userId, isOnline };

            var friendIds = await _friendshipService.GetFriendIdsAsync(userId);
            if (friendIds.Count > 0)
            {
                await Clients.Users(friendIds.Select(id => id.ToString())).SendAsync("PresenceChanged", payload);
            }

            var serverGroups = await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .Select(sm => sm.ServerId)
                .ToListAsync();
            if (serverGroups.Count > 0)
            {
                await Clients.Groups(serverGroups.Select(HubGroups.Server)).SendAsync("PresenceChanged", payload);
            }
        }

        private Guid GetUserId() => Guid.Parse(Context.UserIdentifier!);
    }
}
