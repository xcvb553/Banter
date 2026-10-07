namespace Banter.Models.Dtos
{
    public class AdminUserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Image { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsOnline { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class AdminServerDto
    {
        public Guid ServerId { get; set; }
        public string Name { get; set; } = null!;
        public string OwnerName { get; set; } = null!;
        public int MemberCount { get; set; }
        public int ChannelCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminStatsDto
    {
        public int Users { get; set; }
        public int OnlineUsers { get; set; }
        public int Servers { get; set; }
        public int Messages { get; set; }
    }
}
