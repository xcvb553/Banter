using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class ServerMember
    {
        [Key]
        public Guid ServerMemberId { get; set; }

        [ForeignKey(nameof(Server))]
        public Guid ServerId { get; set; }
        public Server Server { get; set; } = null!;

        [ForeignKey(nameof(User))]
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
