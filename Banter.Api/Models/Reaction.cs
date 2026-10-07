using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public class Reaction
    {
        [Key]
        public Guid ReactionId { get; set; }

        [Required]
        [StringLength(16)]
        public string ReactionType { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(Message))]
        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;

        [ForeignKey(nameof(User))]
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
