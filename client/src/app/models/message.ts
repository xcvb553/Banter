export interface Reaction {
    userId: string;
    reactionType: string;
}

export type AttachmentType = "Image" | "Video" | "Document";

export interface Attachment {
    attachmentId: string;
    attachmentUrl: string;
    fileName: string;
    attachmentType: AttachmentType;
    size: number;
}

export interface Message {
    messageId: string;
    channelId: string;
    serverId: string;
    senderId: string;
    senderName: string;
    senderImage: string | null;
    content: string;
    createdAt: string;
    isEdited: boolean;
    reactions: Reaction[];
    attachments: Attachment[];
}

export interface PrivateMessage {
    messageId: string;
    senderId: string;
    receiverId: string;
    content: string;
    sentAt: string;
    isRead: boolean;
}

export interface GroupMessage {
    messageId: string;
    groupId: string;
    senderId: string;
    senderName: string;
    senderImage: string | null;
    content: string;
    sentAt: string;
}

export interface UnreadCount {
    id: string;
    count: number;
}
