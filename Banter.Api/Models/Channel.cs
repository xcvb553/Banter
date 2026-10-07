using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public enum ChannelType
    {
        Text,
        Voice
    }

    public class Channel
    {
        [Key]
        public Guid ChannelId { get; set; }

        [StringLength(100)]
        public string Name { get; set; } = null!;

        public ChannelType ChannelType { get; set; } = ChannelType.Text;

        [StringLength(250)]
        public string? Topic { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(Server))]
        public Guid ServerId { get; set; }
        public Server Server { get; set; } = null!;

        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
