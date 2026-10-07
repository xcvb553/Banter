using System.ComponentModel.DataAnnotations;

namespace Banter.Models
{
    public class PrivateMessage
    {
        [Key]
        public Guid MessageId { get; set; }

        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;

        public Guid ReceiverId { get; set; }
        public User Receiver { get; set; } = null!;

        [StringLength(2000)]
        public string Content { get; set; } = null!;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
    }
}
