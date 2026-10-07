using Banter.Models;
using Banter.Models.Dtos;
using Banter.Services;
using Banter.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    public class UserController : BaseController
    {
        private static readonly string[] AllowedAvatarExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long MaxAvatarSize = 2 * 1024 * 1024;

        private readonly UserManager<User> _userManager;
        private readonly FileStorageService _fileStorage;
        private readonly ConnectionTracker _connections;
        private readonly ILogger<UserController> _logger;

        public UserController(UserManager<User> userManager, FileStorageService fileStorage,
                              ConnectionTracker connections, ILogger<UserController> logger)
        {
            _userManager = userManager;
            _fileStorage = fileStorage;
            _connections = connections;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(await ToCurrentUserDto(user));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user.ToDto(_connections.IsOnline(user.Id)));
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username != user.UserName)
            {
                var result = await _userManager.SetUserNameAsync(user, dto.Username.Trim());
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
            }

            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
            {
                var result = await _userManager.SetEmailAsync(user, dto.Email.Trim());
                if (!result.Succeeded)
                    return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
            }

            if (dto.Bio != null)
            {
                user.Bio = dto.Bio.Trim();
                await _userManager.UpdateAsync(user);
            }

            return Ok(await ToCurrentUserDto(user));
        }

        [HttpPost("me/avatar")]
        public async Task<IActionResult> UpdateAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file selected" });

            if (file.Length > MaxAvatarSize)
                return BadRequest(new { message = "Avatar can have max 2 MB" });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedAvatarExtensions.Contains(extension))
                return BadRequest(new { message = "Only images (jpg, png, gif, webp) are allowed" });

            var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            var oldAvatar = user.AvatarUrl;
            user.AvatarUrl = await _fileStorage.SaveAsync(file, "avatars");

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                _fileStorage.Delete(user.AvatarUrl);
                return BadRequest(new { message = "Could not update avatar" });
            }

            _fileStorage.Delete(oldAvatar);
            return Ok(await ToCurrentUserDto(user));
        }

        [HttpPost("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });

            return NoContent();
        }

        [HttpDelete("me")]
        public async Task<IActionResult> DeleteMe([FromBody] DeleteAccountDto dto)
        {
            var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
                return BadRequest(new { message = "Wrong password" });

            var avatar = user.AvatarUrl;
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = "Could not delete the account" });

            _fileStorage.Delete(avatar);
            _logger.LogInformation("User {UserId} deleted their account", user.Id);
            return NoContent();
        }

        private async Task<CurrentUserDto> ToCurrentUserDto(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return new CurrentUserDto
            {
                Id = user.Id,
                Username = user.UserName!,
                Email = user.Email!,
                Image = user.AvatarUrl,
                Bio = user.Bio,
                Role = roles.Contains(Roles.Admin) ? Roles.Admin : Roles.User
            };
        }
    }
}
