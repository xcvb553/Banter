using Banter.Models;
using Banter.Models.Dtos;

namespace Banter.Utils
{
    public static class Mappings
    {
        public static UserDto ToDto(this User user, bool isOnline = false) => new()
        {
            Id = user.Id,
            Username = user.UserName ?? "",
            Image = user.AvatarUrl,
            IsOnline = isOnline
        };

        public static ServerDto ToDto(this Server server) => new()
        {
            ServerId = server.ServerId,
            Name = server.Name,
            Description = server.Description,
            IsPublic = server.IsPublic,
            OwnerId = server.OwnerId
        };

        public static ChannelDto ToDto(this Channel channel) => new()
        {
            ChannelId = channel.ChannelId,
            ServerId = channel.ServerId,
            Name = channel.Name,
            ChannelType = channel.ChannelType,
            Topic = channel.Topic,
            CreatedAt = channel.CreatedAt
        };

        public static MessageDto ToDto(this Message message) => new()
        {
            MessageId = message.MessageId,
            ChannelId = message.ChannelId,
            ServerId = message.Channel.ServerId,
            SenderId = message.UserId,
            SenderName = message.User.UserName ?? "",
            SenderImage = message.User.AvatarUrl,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            IsEdited = message.IsEdited,
            Reactions = message.Reactions.Select(r => r.ToDto()).ToList(),
            Attachments = message.Attachments.Select(a => new AttachmentDto
            {
                AttachmentId = a.AttachmentId,
                AttachmentUrl = a.Url,
                FileName = a.FileName,
                AttachmentType = a.Type,
                Size = a.Size
            }).ToList()
        };

        public static ReactionDto ToDto(this Reaction reaction) => new()
        {
            UserId = reaction.UserId,
            ReactionType = reaction.ReactionType
        };

        public static PrivateMessageDto ToDto(this PrivateMessage message) => new()
        {
            MessageId = message.MessageId,
            SenderId = message.SenderId,
            ReceiverId = message.ReceiverId,
            Content = message.Content,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        };

        public static GroupMessageDto ToDto(this GroupMessage message) => new()
        {
            MessageId = message.MessageId,
            GroupId = message.GroupId,
            SenderId = message.SenderId,
            SenderName = message.Sender.UserName ?? "",
            SenderImage = message.Sender.AvatarUrl,
            Content = message.Content,
            SentAt = message.SentAt
        };
    }
}
