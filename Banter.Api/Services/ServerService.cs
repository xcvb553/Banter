using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Utils;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Banter.Services
{
    public class ServerService
    {
        private const int InviteValidDays = 7;

        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly ConnectionTracker _connections;

        public ServerService(AppDbContext context, NotificationService notificationService, ConnectionTracker connections)
        {
            _context = context;
            _notificationService = notificationService;
            _connections = connections;
        }

        public async Task<bool> IsMemberAsync(Guid serverId, Guid userId)
        {
            return await _context.ServerMembers.AnyAsync(sm => sm.ServerId == serverId && sm.UserId == userId);
        }

        public async Task<Result<List<ServerDto>>> GetServersByUserIdAsync(Guid userId)
        {
            var servers = await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .OrderBy(sm => sm.JoinedAt)
                .Select(sm => sm.Server)
                .ToListAsync();

            return Result<List<ServerDto>>.Success(servers.Select(s => s.ToDto()).ToList());
        }

        public async Task<Result<ServerDto>> GetServerByIdAsync(Guid serverId, Guid userId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result<ServerDto>.NotFound("Server not found");

            if (!await IsMemberAsync(serverId, userId))
                return Result<ServerDto>.Forbidden("You are not a member of this server");

            return Result<ServerDto>.Success(server.ToDto());
        }

        public async Task<Result<ServerDto>> CreateServerAsync(ServerCreateDto dto, Guid ownerId)
        {
            var server = new Server
            {
                OwnerId = ownerId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                IsPublic = dto.IsPublic
            };

            server.ServerMembers.Add(new ServerMember { UserId = ownerId });

            server.Channels.Add(new Channel { Name = "general", ChannelType = ChannelType.Text, Topic = "Say hi!" });
            server.Channels.Add(new Channel { Name = "Lounge", ChannelType = ChannelType.Voice });

            _context.Servers.Add(server);
            await _context.SaveChangesAsync();

            await _notificationService.AddUserToGroupAsync(ownerId, HubGroups.Server(server.ServerId));

            return Result<ServerDto>.Success(server.ToDto());
        }

        public async Task<Result<ServerDto>> JoinServerAsync(string idOrCode, Guid userId)
        {
            idOrCode = idOrCode.Trim();
            Server? server = null;

            if (Guid.TryParse(idOrCode, out var serverId))
            {
                server = await _context.Servers.FindAsync(serverId);
                if (server != null && !server.IsPublic)
                    return Result<ServerDto>.Forbidden("This server is private, you need an invite code");
            }
            else
            {
                var invite = await _context.Invites
                    .Include(i => i.Server)
                    .FirstOrDefaultAsync(i => i.Code == idOrCode);

                if (invite != null && invite.ExpiresAt != null && invite.ExpiresAt < DateTime.UtcNow)
                    return Result<ServerDto>.Failure("This invite has expired");

                server = invite?.Server;
            }

            if (server == null)
                return Result<ServerDto>.NotFound("Server not found");

            var isBanned = await _context.ServerBans.AnyAsync(sb => sb.ServerId == server.ServerId && sb.BannedUserId == userId);
            if (isBanned)
                return Result<ServerDto>.Forbidden("You are banned from this server");

            if (await IsMemberAsync(server.ServerId, userId))
                return Result<ServerDto>.Failure("You are already a member of this server");

            _context.ServerMembers.Add(new ServerMember { ServerId = server.ServerId, UserId = userId });
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);

            await _notificationService.AddUserToGroupAsync(userId, HubGroups.Server(server.ServerId));
            await _notificationService.SendToGroupAsync(HubGroups.Server(server.ServerId), "MemberJoined",
                new { serverId = server.ServerId, user = user!.ToDto(_connections.IsOnline(userId)) });

            return Result<ServerDto>.Success(server.ToDto());
        }

        public async Task<Result> LeaveServerAsync(Guid serverId, Guid userId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result.NotFound("Server not found");

            if (server.OwnerId == userId)
                return Result.Failure("The owner can't leave the server, delete it instead");

            var member = await _context.ServerMembers
                .FirstOrDefaultAsync(sm => sm.UserId == userId && sm.ServerId == serverId);
            if (member == null)
                return Result.Failure("You are not a member of this server");

            _context.ServerMembers.Remove(member);
            await _context.SaveChangesAsync();

            await RemoveFromServerGroupAsync(serverId, userId);
            return Result.Success();
        }

        public async Task<Result> DeleteServerAsync(Guid serverId, Guid userId, bool isAdmin = false)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result.NotFound("Server not found");

            if (server.OwnerId != userId && !isAdmin)
                return Result.Forbidden("Only the owner can delete the server");

            await _notificationService.SendToGroupAsync(HubGroups.Server(serverId), "ServerDeleted", new { serverId });

            _context.Servers.Remove(server);
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<List<UserDto>>> GetServerMembersAsync(Guid serverId, Guid userId)
        {
            if (!await IsMemberAsync(serverId, userId))
                return Result<List<UserDto>>.Forbidden("You are not a member of this server");

            var users = await _context.ServerMembers
                .Where(sm => sm.ServerId == serverId)
                .OrderBy(sm => sm.JoinedAt)
                .Select(sm => sm.User)
                .ToListAsync();

            return Result<List<UserDto>>.Success(users.Select(u => u.ToDto(_connections.IsOnline(u.Id))).ToList());
        }

        public async Task<Result> KickUserAsync(Guid serverId, Guid targetUserId, Guid currentUserId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result.NotFound("Server not found");

            if (server.OwnerId != currentUserId)
                return Result.Forbidden("Only the owner can kick members");

            if (targetUserId == currentUserId)
                return Result.Failure("You can't kick yourself");

            var member = await _context.ServerMembers
                .FirstOrDefaultAsync(sm => sm.ServerId == serverId && sm.UserId == targetUserId);
            if (member == null)
                return Result.NotFound("User is not a member of this server");

            _context.ServerMembers.Remove(member);
            await _context.SaveChangesAsync();

            await RemoveFromServerGroupAsync(serverId, targetUserId, "You were kicked from the server");
            return Result.Success();
        }

        public async Task<Result> BanUserAsync(Guid serverId, Guid targetUserId, Guid currentUserId, string? reason)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result.NotFound("Server not found");

            if (server.OwnerId != currentUserId)
                return Result.Forbidden("Only the owner can ban members");

            if (targetUserId == currentUserId)
                return Result.Failure("You can't ban yourself");

            if (!await _context.Users.AnyAsync(u => u.Id == targetUserId))
                return Result.NotFound("User not found");

            var alreadyBanned = await _context.ServerBans
                .AnyAsync(sb => sb.ServerId == serverId && sb.BannedUserId == targetUserId);
            if (alreadyBanned)
                return Result.Failure("User is already banned");

            _context.ServerBans.Add(new ServerBan
            {
                ServerId = serverId,
                BannedUserId = targetUserId,
                BanningUserId = currentUserId,
                Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim()
            });

            var member = await _context.ServerMembers
                .FirstOrDefaultAsync(sm => sm.ServerId == serverId && sm.UserId == targetUserId);
            if (member != null)
            {
                _context.ServerMembers.Remove(member);
            }

            await _context.SaveChangesAsync();

            if (member != null)
            {
                await RemoveFromServerGroupAsync(serverId, targetUserId, "You were banned from the server");
            }
            return Result.Success();
        }

        public async Task<Result<List<ServerBanDto>>> GetBansAsync(Guid serverId, Guid currentUserId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result<List<ServerBanDto>>.NotFound("Server not found");

            if (server.OwnerId != currentUserId)
                return Result<List<ServerBanDto>>.Forbidden("Only the owner can see bans");

            var bans = await _context.ServerBans
                .Where(sb => sb.ServerId == serverId)
                .OrderByDescending(sb => sb.BannedAt)
                .Select(sb => new ServerBanDto
                {
                    BannedUserId = sb.BannedUserId,
                    Username = sb.BannedUser.UserName!,
                    Image = sb.BannedUser.AvatarUrl,
                    Reason = sb.Reason,
                    BannedAt = sb.BannedAt
                })
                .ToListAsync();

            return Result<List<ServerBanDto>>.Success(bans);
        }

        public async Task<Result> RemoveBanAsync(Guid serverId, Guid bannedUserId, Guid currentUserId)
        {
            var server = await _context.Servers.FindAsync(serverId);
            if (server == null)
                return Result.NotFound("Server not found");

            if (server.OwnerId != currentUserId)
                return Result.Forbidden("Only the owner can remove bans");

            var ban = await _context.ServerBans
                .FirstOrDefaultAsync(sb => sb.ServerId == serverId && sb.BannedUserId == bannedUserId);
            if (ban == null)
                return Result.NotFound("Ban not found");

            _context.ServerBans.Remove(ban);
            await _context.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<InviteDto>> CreateInviteAsync(Guid serverId, Guid currentUserId)
        {
            if (!await IsMemberAsync(serverId, currentUserId))
                return Result<InviteDto>.Forbidden("You are not a member of this server");

            var invite = new Invite
            {
                ServerId = serverId,
                InviterId = currentUserId,
                Code = GenerateInviteCode(),
                ExpiresAt = DateTime.UtcNow.AddDays(InviteValidDays)
            };

            _context.Invites.Add(invite);
            await _context.SaveChangesAsync();

            return Result<InviteDto>.Success(new InviteDto { Code = invite.Code, ExpiresAt = invite.ExpiresAt });
        }

        private async Task RemoveFromServerGroupAsync(Guid serverId, Guid userId, string? reason = null)
        {
            await _notificationService.RemoveUserFromGroupAsync(userId, HubGroups.Server(serverId));
            await _notificationService.SendToGroupAsync(HubGroups.Server(serverId), "MemberLeft", new { serverId, userId });

            if (reason != null)
            {
                await _notificationService.SendToUsersAsync(new[] { userId }, "RemovedFromServer", new { serverId, reason });
            }
        }

        private static string GenerateInviteCode()
        {
            const string chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            return RandomNumberGenerator.GetString(chars, 8);
        }
    }
}
