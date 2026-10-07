import type { User } from "./user";

export interface FriendRequest {
    requestId: string;
    senderId: string;
    receiverId: string;
    userName: string;
    image: string | null;
}

export interface FriendGroup {
    id: string;
    name: string;
    creatorId: string;
    members: User[];
}

export interface CreateGroupModel {
    name: string;
    memberIds: string[];
}
