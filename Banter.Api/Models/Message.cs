using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class Message
    {
        [Key]
        public Guid MessageId { get; set; }

        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsEdited { get; set; }
        public DateTime? EditedAt { get; set; }

        [ForeignKey(nameof(User))]
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        [ForeignKey(nameof(Channel))]
        public Guid ChannelId { get; set; }
        public Channel Channel { get; set; } = null!;

        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
        public ICollection<MessageEditHistory> EditHistory { get; set; } = new List<MessageEditHistory>();
    }
}
