using System.ComponentModel.DataAnnotations;

namespace Banter.Models.Dtos
{
    public class ChannelDto
    {
        public Guid ChannelId { get; set; }
        public Guid ServerId { get; set; }
        public string Name { get; set; } = null!;
        public ChannelType ChannelType { get; set; }
        public string? Topic { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChannelCreateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        public ChannelType ChannelType { get; set; } = ChannelType.Text;

        [StringLength(250)]
        public string? Topic { get; set; }
    }
}
