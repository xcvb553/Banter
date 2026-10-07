using System.ComponentModel.DataAnnotations;

namespace Banter.Models.Dtos
{
    public class MessageDto
    {
        public Guid MessageId { get; set; }
        public Guid ChannelId { get; set; }
        public Guid ServerId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderImage { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsEdited { get; set; }
        public List<ReactionDto> Reactions { get; set; } = new();
        public List<AttachmentDto> Attachments { get; set; } = new();
    }

    public class ReactionDto
    {
        public Guid UserId { get; set; }
        public string ReactionType { get; set; } = null!;
    }

    public class AttachmentDto
    {
        public Guid AttachmentId { get; set; }
        public string AttachmentUrl { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public AttachmentType AttachmentType { get; set; }
        public long Size { get; set; }
    }

    public class EditMessageDto
    {
        [Required]
        [StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = null!;
    }

    public class ToggleReactionDto
    {
        [Required]
        [StringLength(16)]
        public string ReactionType { get; set; } = null!;
    }

    public class SendTextMessageDto
    {
        [Required]
        [StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = null!;
    }

    public class PrivateMessageDto
    {
        public Guid MessageId { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string Content { get; set; } = null!;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }

    public class GroupMessageDto
    {
        public Guid MessageId { get; set; }
        public Guid GroupId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderImage { get; set; }
        public string Content { get; set; } = null!;
        public DateTime SentAt { get; set; }
    }

    public class UnreadCountDto
    {
        public Guid Id { get; set; }
        public int Count { get; set; }
    }
}
