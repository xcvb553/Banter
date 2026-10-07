export interface Server {
    serverId: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    ownerId: string;
}

export interface ServerCreateModel {
    name: string;
    description: string;
    isPublic: boolean;
}

export type ChannelType = "Text" | "Voice";

export interface Channel {
    channelId: string;
    serverId: string;
    name: string;
    channelType: ChannelType;
    topic: string | null;
    createdAt: string;
}

export interface ChannelCreateModel {
    name: string;
    channelType: ChannelType;
    topic: string | null;
}

export interface ServerBan {
    bannedUserId: string;
    username: string;
    image: string | null;
    reason: string | null;
    bannedAt: string;
}

export interface Invite {
    code: string;
    expiresAt: string | null;
}
