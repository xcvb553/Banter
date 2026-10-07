using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class FriendGroup
    {
        [Key]
        public Guid Id { get; set; }

        [StringLength(100)]
        public string Name { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(Creator))]
        public Guid CreatorId { get; set; }
        public User Creator { get; set; } = null!;

        public ICollection<User> Members { get; set; } = new List<User>();
        public ICollection<GroupMessage> Messages { get; set; } = new List<GroupMessage>();
    }
}
