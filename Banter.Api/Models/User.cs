using Microsoft.AspNetCore.Identity;

namespace Banter.Models
{
    public class User : IdentityUser<Guid>
    {
        public string? AvatarUrl { get; set; }

        public string? Bio { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Friendship> SentFriendRequests { get; set; } = new List<Friendship>();
        public ICollection<Friendship> ReceivedFriendRequests { get; set; } = new List<Friendship>();
        public ICollection<ServerMember> ServerMembers { get; set; } = new List<ServerMember>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
        public ICollection<FriendGroup> FriendGroups { get; set; } = new List<FriendGroup>();
    }
}
