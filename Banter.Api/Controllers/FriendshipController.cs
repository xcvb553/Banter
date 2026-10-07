using Banter.Models.Dtos;
using Banter.Services;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    public class FriendshipController : BaseController
    {
        private readonly FriendshipService _friendshipService;

        public FriendshipController(FriendshipService friendshipService)
        {
            _friendshipService = friendshipService;
        }

        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            return HandleResult(await _friendshipService.GetFriendsAsync(CurrentUserId));
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetFriendRequests()
        {
            return HandleResult(await _friendshipService.GetFriendRequestsAsync(CurrentUserId));
        }

        [HttpPost("requests")]
        public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestDto dto)
        {
            return HandleResult(await _friendshipService.SendFriendRequestAsync(CurrentUserId, dto.UserName));
        }

        [HttpPost("requests/{requestId:guid}/accept")]
        public async Task<IActionResult> AcceptFriendRequest(Guid requestId)
        {
            return HandleResult(await _friendshipService.AcceptFriendRequestAsync(requestId, CurrentUserId));
        }

        [HttpPost("requests/{requestId:guid}/reject")]
        public async Task<IActionResult> RejectFriendRequest(Guid requestId)
        {
            return HandleResult(await _friendshipService.RejectFriendRequestAsync(requestId, CurrentUserId));
        }

        [HttpDelete("{friendId:guid}")]
        public async Task<IActionResult> RemoveFriend(Guid friendId)
        {
            return HandleResult(await _friendshipService.RemoveFriendAsync(CurrentUserId, friendId));
        }
    }
}
