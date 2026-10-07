using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class Server
    {
        [Key]
        public Guid ServerId { get; set; }

        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsPublic { get; set; } = true;

        [ForeignKey(nameof(Owner))]
        public Guid OwnerId { get; set; }
        public User Owner { get; set; } = null!;

        public ICollection<Channel> Channels { get; set; } = new List<Channel>();
        public ICollection<ServerMember> ServerMembers { get; set; } = new List<ServerMember>();
        public ICollection<Invite> Invites { get; set; } = new List<Invite>();
        public ICollection<ServerBan> Bans { get; set; } = new List<ServerBan>();
    }
}
