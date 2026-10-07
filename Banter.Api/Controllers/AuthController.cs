using Banter.Models;
using Banter.Models.Dtos;
using Banter.Services;
using Banter.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Banter.Controllers
{
    [AllowAnonymous]
    public class AuthController : BaseController
    {
        private readonly UserManager<User> _userManager;
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(UserManager<User> userManager, AuthService authService, ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.Username.Trim());
            if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                _logger.LogWarning("Failed login for {Username}", loginDto.Username);
                return Unauthorized(new { message = "Invalid username or password" });
            }

            return Ok(await CreateAuthResponse(user));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var user = new User
            {
                UserName = registerDto.Username.Trim(),
                Email = registerDto.Email.Trim()
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
            }

            await _userManager.AddToRoleAsync(user, Roles.User);

            _logger.LogInformation("New user registered: {Username}", user.UserName);
            return Ok(await CreateAuthResponse(user));
        }

        private async Task<AuthResponseDto> CreateAuthResponse(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return new AuthResponseDto
            {
                Token = await _authService.GenerateJwtTokenAsync(user),
                User = new CurrentUserDto
                {
                    Id = user.Id,
                    Username = user.UserName!,
                    Email = user.Email!,
                    Image = user.AvatarUrl,
                    Bio = user.Bio,
                    Role = roles.Contains(Roles.Admin) ? Roles.Admin : Roles.User
                }
            };
        }
    }
}
