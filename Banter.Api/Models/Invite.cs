using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class Invite
    {
        [Key]
        public Guid InviteId { get; set; }

        [StringLength(16)]
        public string Code { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ExpiresAt { get; set; }

        [ForeignKey(nameof(Server))]
        public Guid ServerId { get; set; }
        public Server Server { get; set; } = null!;

        [ForeignKey(nameof(Inviter))]
        public Guid InviterId { get; set; }
        public User Inviter { get; set; } = null!;
    }
}
