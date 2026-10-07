using Banter.Models.Dtos;
using Banter.Services;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    public class GroupController : BaseController
    {
        private readonly GroupService _groupService;

        public GroupController(GroupService groupService)
        {
            _groupService = groupService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyGroups()
        {
            return HandleResult(await _groupService.GetGroupsAsync(CurrentUserId));
        }

        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
        {
            return HandleResult(await _groupService.CreateGroupAsync(CurrentUserId, dto));
        }

        [HttpPut("{groupId:guid}")]
        public async Task<IActionResult> RenameGroup(Guid groupId, [FromBody] RenameGroupDto dto)
        {
            return HandleResult(await _groupService.RenameGroupAsync(groupId, CurrentUserId, dto.Name));
        }

        [HttpDelete("{groupId:guid}")]
        public async Task<IActionResult> DeleteGroup(Guid groupId)
        {
            return HandleResult(await _groupService.DeleteGroupAsync(groupId, CurrentUserId));
        }

        [HttpGet("{groupId:guid}/members")]
        public async Task<IActionResult> GetMembers(Guid groupId)
        {
            return HandleResult(await _groupService.GetMembersAsync(groupId, CurrentUserId));
        }

        [HttpPost("{groupId:guid}/members/{userId:guid}")]
        public async Task<IActionResult> AddMember(Guid groupId, Guid userId)
        {
            return HandleResult(await _groupService.AddMemberAsync(groupId, userId, CurrentUserId));
        }

        [HttpDelete("{groupId:guid}/members/{userId:guid}")]
        public async Task<IActionResult> RemoveMember(Guid groupId, Guid userId)
        {
            return HandleResult(await _groupService.RemoveMemberAsync(groupId, userId, CurrentUserId));
        }

        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadCounts()
        {
            return HandleResult(await _groupService.GetUnreadCountsAsync(CurrentUserId));
        }

        [HttpGet("{groupId:guid}/messages")]
        public async Task<IActionResult> GetMessages(Guid groupId, [FromQuery] DateTime? before, [FromQuery] int take = 50)
        {
            return HandleResult(await _groupService.GetMessagesAsync(groupId, CurrentUserId, before, take));
        }

        [HttpPost("{groupId:guid}/messages")]
        public async Task<IActionResult> SendMessage(Guid groupId, [FromBody] SendTextMessageDto dto)
        {
            return HandleResult(await _groupService.SendMessageAsync(groupId, CurrentUserId, dto.Content));
        }

        [HttpPost("{groupId:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid groupId)
        {
            return HandleResult(await _groupService.MarkAsReadAsync(groupId, CurrentUserId));
        }
    }
}
