using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class GroupMessage
    {
        [Key]
        public Guid MessageId { get; set; }

        [ForeignKey(nameof(Sender))]
        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;

        [ForeignKey(nameof(Group))]
        public Guid GroupId { get; set; }
        public FriendGroup Group { get; set; } = null!;

        [StringLength(2000)]
        public string Content { get; set; } = null!;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public ICollection<User> ReadBy { get; set; } = new List<User>();
    }
}
