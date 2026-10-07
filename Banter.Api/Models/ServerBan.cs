using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class ServerBan
    {
        [Key]
        public Guid BanId { get; set; }

        public DateTime BannedAt { get; set; } = DateTime.UtcNow;

        [StringLength(300)]
        public string? Reason { get; set; }

        [ForeignKey(nameof(Server))]
        public Guid ServerId { get; set; }
        public Server Server { get; set; } = null!;

        public Guid BanningUserId { get; set; }
        public User BanningUser { get; set; } = null!;

        public Guid BannedUserId { get; set; }
        public User BannedUser { get; set; } = null!;
    }
}
