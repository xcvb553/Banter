using System.ComponentModel.DataAnnotations;

namespace Banter.Models
{
    public enum FriendshipStatus
    {
        Pending,
        Accepted
    }

    public class Friendship
    {
        [Key]
        public Guid Id { get; set; }

        public Guid SenderId { get; set; }
        public User Sender { get; set; } = null!;

        public Guid ReceiverId { get; set; }
        public User Receiver { get; set; } = null!;

        public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public DateTime? AcceptedAt { get; set; }
    }
}
