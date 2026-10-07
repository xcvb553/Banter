using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Banter.Models
{
    public enum AttachmentType
    {
        Image,
        Video,
        Document
    }

    public class Attachment
    {
        [Key]
        public Guid AttachmentId { get; set; }

        public string Url { get; set; } = null!;

        [StringLength(255)]
        public string FileName { get; set; } = null!;

        public long Size { get; set; }

        public AttachmentType Type { get; set; }

        [ForeignKey(nameof(Message))]
        public Guid MessageId { get; set; }
        public Message Message { get; set; } = null!;
    }
}
