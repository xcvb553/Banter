using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class MessageEditHistory
    {
        [Key]
        public Guid EditHistoryId { get; set; }

        public string OldContent { get; set; } = null!;

        public DateTime EditedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(Message))]
        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;
    }
}
