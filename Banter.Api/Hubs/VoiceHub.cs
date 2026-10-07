using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Services;
using Banter.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace Banter.Hubs
{
    [Authorize]
    public class VoiceHub : Hub
    {
        private static readonly ConcurrentDictionary<string, string> _userConnections = new();
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, VoiceUserDto>> _channelUsers = new();
        private static readonly ConcurrentDictionary<string, string> _userCurrentChannel = new();
        private static readonly ConcurrentDictionary<string, Guid> _channelServer = new();
        private static readonly ConcurrentDictionary<string, string> _callPartners = new();

        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _chatHub;
        private readonly FriendshipService _friendshipService;
        private readonly ILogger<VoiceHub> _logger;

        public VoiceHub(AppDbContext context, IHubContext<ChatHub> chatHub, FriendshipService friendshipService, ILogger<VoiceHub> logger)
        {
            _context = context;
            _chatHub = chatHub;
            _friendshipService = friendshipService;
            _logger = logger;
        }

        private string UserId => Context.UserIdentifier!;

        public override async Task OnConnectedAsync()
        {
            _userConnections[UserId] = Context.ConnectionId;
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userConnections.TryGetValue(UserId, out var connectionId) && connectionId == Context.ConnectionId)
            {
                _userConnections.TryRemove(UserId, out _);
                await LeaveVoiceChannelInternal(UserId, Context.ConnectionId, "disconnect");

                if (_callPartners.TryRemove(UserId, out var partnerId))
                {
                    _callPartners.TryRemove(partnerId, out _);
                    await SendToUser(partnerId, "CallEnded", UserId);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task CallUser(string targetId)
        {
            if (string.IsNullOrEmpty(targetId) || targetId == UserId) return;

            if (!Guid.TryParse(targetId, out var targetGuid) ||
                !await _friendshipService.AreFriendsAsync(Guid.Parse(UserId), targetGuid))
            {
                await Clients.Caller.SendAsync("CallUserFailed", targetId, "You can only call your friends.");
                return;
            }

            if (!_userConnections.ContainsKey(targetId))
            {
                await Clients.Caller.SendAsync("CallUserFailed", targetId, "User is offline.");
                return;
            }

            await SendToUser(targetId, "ReceiveCall", new CallUserDto { CallerId = UserId, TargetId = targetId });
        }

        public async Task AcceptCall(string callerId)
        {
            if (string.IsNullOrEmpty(callerId)) return;

            _callPartners[UserId] = callerId;
            _callPartners[callerId] = UserId;
            await SendToUser(callerId, "CallAccepted", UserId);
        }

        public async Task DeclineCall(string callerId)
        {
            if (string.IsNullOrEmpty(callerId)) return;
            await SendToUser(callerId, "CallDeclined", UserId);
        }

        public async Task EndCall(string targetId)
        {
            if (string.IsNullOrEmpty(targetId)) return;

            _callPartners.TryRemove(UserId, out _);
            _callPartners.TryRemove(targetId, out _);
            await SendToUser(targetId, "CallEnded", UserId);
        }

        public async Task SendSDP(string targetId, string sdp)
        {
            if (string.IsNullOrEmpty(targetId) || string.IsNullOrEmpty(sdp)) return;
            await SendToUser(targetId, "ReceiveSDP", UserId, sdp);
        }

        public async Task SendIceCandidate(string targetId, string candidate)
        {
            if (string.IsNullOrEmpty(targetId) || string.IsNullOrEmpty(candidate)) return;
            await SendToUser(targetId, "ReceiveIceCandidate", UserId, candidate);
        }

        public async Task JoinVoiceChannel(string channelId)
        {
            if (!Guid.TryParse(channelId, out var channelGuid)) return;

            var channel = await _context.Channels.FindAsync(channelGuid);
            if (channel == null || channel.ChannelType != ChannelType.Voice)
            {
                await Clients.Caller.SendAsync("VoiceError", "Voice channel not found.");
                return;
            }

            var userGuid = Guid.Parse(UserId);
            var isMember = await _context.ServerMembers.AnyAsync(sm => sm.ServerId == channel.ServerId && sm.UserId == userGuid);
            if (!isMember)
            {
                await Clients.Caller.SendAsync("VoiceError", "You are not a member of this server.");
                return;
            }

            var user = await _context.Users.FindAsync(userGuid);
            if (user == null) return;

            if (_userCurrentChannel.TryGetValue(UserId, out var oldChannelId) && oldChannelId != channelId)
            {
                await LeaveVoiceChannelInternal(UserId, Context.ConnectionId, "switched_channel");
            }

            var userDto = new VoiceUserDto
            {
                Id = UserId,
                Username = user.UserName ?? "User",
                Image = user.AvatarUrl
            };

            var usersInChannel = _channelUsers.GetOrAdd(channelId, _ => new ConcurrentDictionary<string, VoiceUserDto>());
            usersInChannel[UserId] = userDto;
            _userCurrentChannel[UserId] = channelId;
            _channelServer[channelId] = channel.ServerId;

            await Groups.AddToGroupAsync(Context.ConnectionId, GetChannelGroupName(channelId));

            await Clients.Caller.SendAsync("ChannelState", new ChannelStateDto
            {
                ChannelId = channelId,
                Users = usersInChannel.Values.Where(u => u.Id != UserId).ToList()
            });
            await Clients.OthersInGroup(GetChannelGroupName(channelId)).SendAsync("UserJoinedChannel", channelId, userDto);

            await BroadcastChannelUsers(channelId);
        }

        public async Task LeaveVoiceChannel()
        {
            await LeaveVoiceChannelInternal(UserId, Context.ConnectionId, "manual_leave");
        }

        public async Task<Dictionary<string, List<VoiceUserDto>>> GetVoiceChannelUsers(string serverId)
        {
            var result = new Dictionary<string, List<VoiceUserDto>>();
            if (!Guid.TryParse(serverId, out var serverGuid)) return result;

            var userGuid = Guid.Parse(UserId);
            var isMember = await _context.ServerMembers.AnyAsync(sm => sm.ServerId == serverGuid && sm.UserId == userGuid);
            if (!isMember) return result;

            foreach (var (channelId, channelServerId) in _channelServer)
            {
                if (channelServerId == serverGuid && _channelUsers.TryGetValue(channelId, out var users))
                {
                    result[channelId] = users.Values.ToList();
                }
            }
            return result;
        }

        public async Task SendChannelOffer(string targetUserId, string offerSdp)
        {
            if (!_userCurrentChannel.TryGetValue(UserId, out var channelId)) return;
            await SendToUser(targetUserId, "ReceiveChannelOffer", UserId, channelId, offerSdp);
        }

        public async Task SendChannelAnswer(string targetUserId, string answerSdp)
        {
            if (!_userCurrentChannel.TryGetValue(UserId, out var channelId)) return;
            await SendToUser(targetUserId, "ReceiveChannelAnswer", UserId, channelId, answerSdp);
        }

        public async Task SendChannelIceCandidate(string targetUserId, string candidate)
        {
            if (!_userCurrentChannel.TryGetValue(UserId, out var channelId)) return;
            await SendToUser(targetUserId, "ReceiveChannelIceCandidate", UserId, channelId, candidate);
        }

        public async Task UpdateVoiceState(bool isMuted, bool isDeafened)
        {
            if (_userCurrentChannel.TryGetValue(UserId, out var channelId) &&
                _channelUsers.TryGetValue(channelId, out var usersInChannel) &&
                usersInChannel.TryGetValue(UserId, out var state))
            {
                state.IsMuted = isMuted;
                state.IsDeafened = isDeafened;

                await Clients.OthersInGroup(GetChannelGroupName(channelId)).SendAsync("UserVoiceStateChanged", channelId, state);
                await BroadcastChannelUsers(channelId);
            }
        }

        private async Task LeaveVoiceChannelInternal(string userId, string connectionId, string reason)
        {
            if (!_userCurrentChannel.TryRemove(userId, out var channelId)) return;

            try
            {
                await Groups.RemoveFromGroupAsync(connectionId, GetChannelGroupName(channelId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not remove {UserId} from voice group", userId);
            }

            if (_channelUsers.TryGetValue(channelId, out var usersInChannel))
            {
                usersInChannel.TryRemove(userId, out _);
                await Clients.Group(GetChannelGroupName(channelId)).SendAsync("UserLeftChannel", channelId, userId, reason);
            }

            await BroadcastChannelUsers(channelId);

            if (usersInChannel != null && usersInChannel.IsEmpty)
            {
                _channelUsers.TryRemove(channelId, out _);
                _channelServer.TryRemove(channelId, out _);
            }
        }

        private async Task BroadcastChannelUsers(string channelId)
        {
            if (!_channelServer.TryGetValue(channelId, out var serverId)) return;

            var users = _channelUsers.TryGetValue(channelId, out var dict) ? dict.Values.ToList() : new List<VoiceUserDto>();
            await _chatHub.Clients.Group(HubGroups.Server(serverId)).SendAsync("VoiceChannelUsersChanged", channelId, users);
        }

        private async Task SendToUser(string userId, string method, params object[] args)
        {
            if (_userConnections.TryGetValue(userId, out var connectionId))
            {
                await Clients.Client(connectionId).SendCoreAsync(method, args);
            }
        }

        private static string GetChannelGroupName(string channelId) => $"voice:{channelId}";
    }
}
