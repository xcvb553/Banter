using Banter.Models.Dtos;
using Banter.Services;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    public class ChannelController : BaseController
    {
        private readonly ChannelService _channelService;

        public ChannelController(ChannelService channelService)
        {
            _channelService = channelService;
        }

        [HttpGet("server/{serverId:guid}")]
        public async Task<IActionResult> GetChannels(Guid serverId)
        {
            return HandleResult(await _channelService.GetChannelsByServerIdAsync(serverId, CurrentUserId));
        }

        [HttpPost("server/{serverId:guid}")]
        public async Task<IActionResult> CreateChannel(Guid serverId, [FromBody] ChannelCreateDto dto)
        {
            return HandleResult(await _channelService.CreateChannelAsync(serverId, dto, CurrentUserId));
        }

        [HttpDelete("{channelId:guid}")]
        public async Task<IActionResult> DeleteChannel(Guid channelId)
        {
            return HandleResult(await _channelService.DeleteChannelAsync(channelId, CurrentUserId));
        }
    }
}
