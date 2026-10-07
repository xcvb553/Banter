using Banter.Hubs;
using Banter.Utils;
using Microsoft.AspNetCore.SignalR;

namespace Banter.Services
{
    public class NotificationService
    {
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ConnectionTracker _connections;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(IHubContext<ChatHub> hubContext, ConnectionTracker connections, ILogger<NotificationService> logger)
        {
            _hubContext = hubContext;
            _connections = connections;
            _logger = logger;
        }

        public async Task NotifyUsersAsync(IEnumerable<Guid> userIds, string type, object payload)
        {
            var ids = userIds.Distinct().Select(id => id.ToString()).ToList();
            if (ids.Count == 0) return;

            try
            {
                await _hubContext.Clients.Users(ids).SendAsync("ReceiveNotification", new { type, payload });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not send notification {Type}", type);
            }
        }

        public Task SendToUsersAsync(IEnumerable<Guid> userIds, string method, object payload)
        {
            var ids = userIds.Distinct().Select(id => id.ToString()).ToList();
            return _hubContext.Clients.Users(ids).SendAsync(method, payload);
        }

        public Task SendToGroupAsync(string groupName, string method, object payload)
        {
            return _hubContext.Clients.Group(groupName).SendAsync(method, payload);
        }

        public async Task AddUserToGroupAsync(Guid userId, string groupName)
        {
            foreach (var connectionId in _connections.GetConnections(userId))
            {
                await _hubContext.Groups.AddToGroupAsync(connectionId, groupName);
            }
        }

        public async Task RemoveUserFromGroupAsync(Guid userId, string groupName)
        {
            foreach (var connectionId in _connections.GetConnections(userId))
            {
                await _hubContext.Groups.RemoveFromGroupAsync(connectionId, groupName);
            }
        }
    }
}
