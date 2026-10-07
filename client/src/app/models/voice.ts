export interface VoiceUser {
    id: string;
    username: string;
    image: string | null;
    isMuted: boolean;
    isDeafened: boolean;
}

export interface ChannelState {
    channelId: string;
    users: VoiceUser[];
}

export interface CallInfo {
    callerId: string;
    targetId: string;
    isInitiator: boolean;
}
