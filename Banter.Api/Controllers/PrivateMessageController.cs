using Banter.Models.Dtos;
using Banter.Services;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    [Route("api/private-messages")]
    public class PrivateMessageController : BaseController
    {
        private readonly PrivateMessageService _privateMessageService;

        public PrivateMessageController(PrivateMessageService privateMessageService)
        {
            _privateMessageService = privateMessageService;
        }

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadCounts()
        {
            return HandleResult(await _privateMessageService.GetUnreadCountsAsync(CurrentUserId));
        }

        [HttpGet("{friendId:guid}")]
        public async Task<IActionResult> GetMessages(Guid friendId, [FromQuery] DateTime? before, [FromQuery] int take = 50)
        {
            return HandleResult(await _privateMessageService.GetMessagesAsync(CurrentUserId, friendId, before, take));
        }

        [HttpPost("{friendId:guid}")]
        public async Task<IActionResult> SendMessage(Guid friendId, [FromBody] SendTextMessageDto dto)
        {
            return HandleResult(await _privateMessageService.SendMessageAsync(CurrentUserId, friendId, dto.Content));
        }

        [HttpPost("{friendId:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid friendId)
        {
            return HandleResult(await _privateMessageService.MarkAsReadAsync(CurrentUserId, friendId));
        }
    }
}
