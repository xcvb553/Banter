using System.ComponentModel.DataAnnotations;

namespace Banter.Models.Dtos
{
    public class ServerDto
    {
        public Guid ServerId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
        public Guid OwnerId { get; set; }
    }

    public class ServerCreateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        public bool IsPublic { get; set; } = true;
    }

    public class ServerBanDto
    {
        public Guid BannedUserId { get; set; }
        public string Username { get; set; } = null!;
        public string? Image { get; set; }
        public string? Reason { get; set; }
        public DateTime BannedAt { get; set; }
    }

    public class BanUserDto
    {
        [StringLength(300)]
        public string? Reason { get; set; }
    }

    public class InviteDto
    {
        public string Code { get; set; } = null!;
        public DateTime? ExpiresAt { get; set; }
    }
}
