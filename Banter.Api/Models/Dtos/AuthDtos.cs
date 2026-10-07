using System.ComponentModel.DataAnnotations;

namespace Banter.Models.Dtos
{
    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }

    public class RegisterDto
    {
        [Required]
        [StringLength(32, MinimumLength = 3)]
        [RegularExpression(@"^[a-zA-Z0-9_.\-]+$", ErrorMessage = "Username can contain only letters, numbers and _ . -")]
        public string Username { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = null!;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = null!;
        public CurrentUserDto User { get; set; } = null!;
    }
}
