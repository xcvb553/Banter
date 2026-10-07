namespace Banter.Models.Dtos
{
    public class VoiceUserDto
    {
        public string Id { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string? Image { get; set; }
        public bool IsMuted { get; set; }
        public bool IsDeafened { get; set; }
    }

    public class ChannelStateDto
    {
        public string ChannelId { get; set; } = null!;
        public List<VoiceUserDto> Users { get; set; } = new();
    }

    public class CallUserDto
    {
        public string CallerId { get; set; } = null!;
        public string TargetId { get; set; } = null!;
    }
}
