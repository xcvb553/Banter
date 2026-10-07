using Banter.Models.Dtos;
using Banter.Services;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    public class MessageController : BaseController
    {
        private readonly MessageService _messageService;

        public MessageController(MessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet("channel/{channelId:guid}")]
        public async Task<IActionResult> GetMessages(Guid channelId, [FromQuery] DateTime? before, [FromQuery] int take = 50)
        {
            return HandleResult(await _messageService.GetMessagesAsync(channelId, CurrentUserId, before, take));
        }

        [HttpPost("channel/{channelId:guid}")]
        [RequestSizeLimit(MessageService.MaxFiles * MessageService.MaxFileSize + 1024 * 1024)]
        public async Task<IActionResult> SendMessage(Guid channelId, [FromForm] string? content, [FromForm] List<IFormFile>? files)
        {
            return HandleResult(await _messageService.SendMessageAsync(channelId, CurrentUserId, content, files));
        }

        [HttpPut("{messageId:guid}")]
        public async Task<IActionResult> EditMessage(Guid messageId, [FromBody] EditMessageDto dto)
        {
            return HandleResult(await _messageService.EditMessageAsync(messageId, CurrentUserId, dto.Content));
        }

        [HttpDelete("{messageId:guid}")]
        public async Task<IActionResult> DeleteMessage(Guid messageId)
        {
            return HandleResult(await _messageService.DeleteMessageAsync(messageId, CurrentUserId));
        }

        [HttpPost("{messageId:guid}/reactions")]
        public async Task<IActionResult> ToggleReaction(Guid messageId, [FromBody] ToggleReactionDto dto)
        {
            return HandleResult(await _messageService.ToggleReactionAsync(messageId, CurrentUserId, dto.ReactionType));
        }
    }
}
