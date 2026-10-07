using System.ComponentModel.DataAnnotations;

namespace Banter.Models.Dtos
{
    public class FriendRequestDto
    {
        public Guid RequestId { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string UserName { get; set; } = null!;
        public string? Image { get; set; }
    }

    public class SendFriendRequestDto
    {
        [Required]
        public string UserName { get; set; } = null!;
    }

    public class FriendGroupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public Guid CreatorId { get; set; }
        public List<UserDto> Members { get; set; } = new();
    }

    public class CreateGroupDto
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Name { get; set; } = null!;

        public List<Guid> MemberIds { get; set; } = new();
    }

    public class RenameGroupDto
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Name { get; set; } = null!;
    }
}
