using Banter.Models.Dtos;
using Banter.Services;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    public class ServerController : BaseController
    {
        private readonly ServerService _serverService;

        public ServerController(ServerService serverService)
        {
            _serverService = serverService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyServers()
        {
            return HandleResult(await _serverService.GetServersByUserIdAsync(CurrentUserId));
        }

        [HttpGet("{serverId:guid}")]
        public async Task<IActionResult> GetServer(Guid serverId)
        {
            return HandleResult(await _serverService.GetServerByIdAsync(serverId, CurrentUserId));
        }

        [HttpPost]
        public async Task<IActionResult> CreateServer([FromBody] ServerCreateDto dto)
        {
            return HandleResult(await _serverService.CreateServerAsync(dto, CurrentUserId));
        }

        [HttpDelete("{serverId:guid}")]
        public async Task<IActionResult> DeleteServer(Guid serverId)
        {
            return HandleResult(await _serverService.DeleteServerAsync(serverId, CurrentUserId));
        }

        [HttpPost("join/{idOrCode}")]
        public async Task<IActionResult> JoinServer(string idOrCode)
        {
            return HandleResult(await _serverService.JoinServerAsync(idOrCode, CurrentUserId));
        }

        [HttpPost("{serverId:guid}/leave")]
        public async Task<IActionResult> LeaveServer(Guid serverId)
        {
            return HandleResult(await _serverService.LeaveServerAsync(serverId, CurrentUserId));
        }

        [HttpGet("{serverId:guid}/members")]
        public async Task<IActionResult> GetMembers(Guid serverId)
        {
            return HandleResult(await _serverService.GetServerMembersAsync(serverId, CurrentUserId));
        }

        [HttpPost("{serverId:guid}/kick/{userId:guid}")]
        public async Task<IActionResult> KickUser(Guid serverId, Guid userId)
        {
            return HandleResult(await _serverService.KickUserAsync(serverId, userId, CurrentUserId));
        }

        [HttpPost("{serverId:guid}/ban/{userId:guid}")]
        public async Task<IActionResult> BanUser(Guid serverId, Guid userId, [FromBody] BanUserDto dto)
        {
            return HandleResult(await _serverService.BanUserAsync(serverId, userId, CurrentUserId, dto.Reason));
        }

        [HttpGet("{serverId:guid}/bans")]
        public async Task<IActionResult> GetBans(Guid serverId)
        {
            return HandleResult(await _serverService.GetBansAsync(serverId, CurrentUserId));
        }

        [HttpDelete("{serverId:guid}/bans/{userId:guid}")]
        public async Task<IActionResult> Unban(Guid serverId, Guid userId)
        {
            return HandleResult(await _serverService.RemoveBanAsync(serverId, userId, CurrentUserId));
        }

        [HttpPost("{serverId:guid}/invite")]
        public async Task<IActionResult> CreateInvite(Guid serverId)
        {
            return HandleResult(await _serverService.CreateInviteAsync(serverId, CurrentUserId));
        }
    }
}
