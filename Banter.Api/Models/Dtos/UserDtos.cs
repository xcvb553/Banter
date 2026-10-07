using System.ComponentModel.DataAnnotations;

namespace Banter.Models.Dtos
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = null!;
        public string? Image { get; set; }
        public bool IsOnline { get; set; }
    }

    public class CurrentUserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Image { get; set; }
        public string? Bio { get; set; }
        public string Role { get; set; } = "User";
    }

    public class UpdateUserDto
    {
        [StringLength(32, MinimumLength = 3)]
        [RegularExpression(@"^[a-zA-Z0-9_.\-]+$", ErrorMessage = "Username can contain only letters, numbers and _ . -")]
        public string? Username { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(190)]
        public string? Bio { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = null!;
    }

    public class DeleteAccountDto
    {
        [Required]
        public string Password { get; set; } = null!;
    }
}
