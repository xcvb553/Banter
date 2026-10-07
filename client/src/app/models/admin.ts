export interface AdminUser {
    id: string;
    username: string;
    email: string;
    image: string | null;
    createdAt: string;
    isOnline: boolean;
    isAdmin: boolean;
}

export interface AdminServer {
    serverId: string;
    name: string;
    ownerName: string;
    memberCount: number;
    channelCount: number;
    createdAt: string;
}

export interface AdminStats {
    users: number;
    onlineUsers: number;
    servers: number;
    messages: number;
}
