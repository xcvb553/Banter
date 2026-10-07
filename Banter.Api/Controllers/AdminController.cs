using Banter.Data;
using Banter.Models;
using Banter.Models.Dtos;
using Banter.Services;
using Banter.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Banter.Controllers
{
    [Authorize(Roles = Roles.Admin)]
    public class AdminController : BaseController
    {
        private readonly AppDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ServerService _serverService;
        private readonly ConnectionTracker _connections;

        public AdminController(AppDbContext context, UserManager<User> userManager,
                               ServerService serverService, ConnectionTracker connections)
        {
            _context = context;
            _userManager = userManager;
            _serverService = serverService;
            _connections = connections;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            return Ok(new AdminStatsDto
            {
                Users = await _context.Users.CountAsync(),
                OnlineUsers = _connections.OnlineCount(),
                Servers = await _context.Servers.CountAsync(),
                Messages = await _context.Messages.CountAsync()
                           + await _context.PrivateMessages.CountAsync()
                           + await _context.GroupMessages.CountAsync()
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var admins = await _userManager.GetUsersInRoleAsync(Roles.Admin);
            var adminIds = admins.Select(a => a.Id).ToHashSet();

            var users = await _context.Users.OrderBy(u => u.CreatedAt).ToListAsync();

            return Ok(users.Select(u => new AdminUserDto
            {
                Id = u.Id,
                Username = u.UserName!,
                Email = u.Email!,
                Image = u.AvatarUrl,
                CreatedAt = u.CreatedAt,
                IsOnline = _connections.IsOnline(u.Id),
                IsAdmin = adminIds.Contains(u.Id)
            }));
        }

        [HttpDelete("users/{userId:guid}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            if (userId == CurrentUserId)
                return BadRequest(new { message = "You can't delete yourself from here" });

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (await _userManager.IsInRoleAsync(user, Roles.Admin))
                return BadRequest(new { message = "Admins can't be deleted" });

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = "Could not delete the user" });

            return NoContent();
        }

        [HttpGet("servers")]
        public async Task<IActionResult> GetServers()
        {
            var servers = await _context.Servers
                .OrderBy(s => s.CreatedAt)
                .Select(s => new AdminServerDto
                {
                    ServerId = s.ServerId,
                    Name = s.Name,
                    OwnerName = s.Owner.UserName!,
                    MemberCount = s.ServerMembers.Count,
                    ChannelCount = s.Channels.Count,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(servers);
        }

        [HttpDelete("servers/{serverId:guid}")]
        public async Task<IActionResult> DeleteServer(Guid serverId)
        {
            return HandleResult(await _serverService.DeleteServerAsync(serverId, CurrentUserId, isAdmin: true));
        }
    }
}
