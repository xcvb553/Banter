import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import type { Channel, ChannelCreateModel, Server, ServerCreateModel } from "../models/server";
import type { User } from "../models/user";
import type { VoiceUser } from "../models/voice";

export default class ServerStore {
    servers: Server[] = [];
    serversLoaded = false;

    currentServerId: string | null = null;
    channels: Channel[] = [];
    members: User[] = [];
    loadingServer = false;

    voiceUsers = new Map<string, VoiceUser[]>();

    constructor() {
        makeAutoObservable(this);
    }

    get currentServer() {
        return this.servers.find(s => s.serverId === this.currentServerId) ?? null;
    }

    get textChannels() {
        return this.channels.filter(c => c.channelType === "Text");
    }

    get voiceChannels() {
        return this.channels.filter(c => c.channelType === "Voice");
    }

    isOwner = (userId: string | undefined) => {
        return !!userId && this.currentServer?.ownerId === userId;
    };

    loadServers = async () => {
        try {
            const servers = await agent.Servers.list();
            runInAction(() => {
                this.servers = servers;
                this.serversLoaded = true;
            });
        } catch (error) {
            console.error("Could not load servers", error);
        }
    };

    openServer = async (serverId: string) => {
        if (this.currentServerId === serverId && this.channels.length > 0) return;

        this.currentServerId = serverId;
        this.channels = [];
        this.members = [];
        this.loadingServer = true;
        try {
            const [channels, members] = await Promise.all([
                agent.Channels.list(serverId),
                agent.Servers.members(serverId),
            ]);
            runInAction(() => {
                if (this.currentServerId !== serverId) return;
                this.channels = channels;
                this.members = members;
            });
        } finally {
            runInAction(() => (this.loadingServer = false));
        }
    };

    closeServer = () => {
        this.currentServerId = null;
        this.channels = [];
        this.members = [];
    };

    createServer = async (model: ServerCreateModel) => {
        const server = await agent.Servers.create(model);
        runInAction(() => this.servers.push(server));
        return server;
    };

    joinServer = async (idOrCode: string) => {
        const server = await agent.Servers.join(idOrCode);
        runInAction(() => this.servers.push(server));
        return server;
    };

    leaveServer = async (serverId: string) => {
        await agent.Servers.leave(serverId);
        this.removeServer(serverId);
    };

    deleteServer = async (serverId: string) => {
        await agent.Servers.delete(serverId);
        this.removeServer(serverId);
    };

    removeServer = (serverId: string) => {
        this.servers = this.servers.filter(s => s.serverId !== serverId);
        if (this.currentServerId === serverId) {
            this.closeServer();
        }
    };

    createChannel = async (serverId: string, model: ChannelCreateModel) => {
        const channel = await agent.Channels.create(serverId, model);
        this.addChannel(channel);
        return channel;
    };

    deleteChannel = async (channelId: string) => {
        await agent.Channels.delete(channelId);
        this.removeChannel(channelId);
    };

    kickMember = async (userId: string) => {
        if (!this.currentServerId) return;
        await agent.Servers.kick(this.currentServerId, userId);
        this.removeMember(this.currentServerId, userId);
    };

    banMember = async (userId: string, reason: string) => {
        if (!this.currentServerId) return;
        await agent.Servers.ban(this.currentServerId, userId, reason);
        this.removeMember(this.currentServerId, userId);
    };

    addChannel = (channel: Channel) => {
        if (channel.serverId !== this.currentServerId) return;
        if (this.channels.some(c => c.channelId === channel.channelId)) return;
        this.channels.push(channel);
    };

    removeChannel = (channelId: string) => {
        this.channels = this.channels.filter(c => c.channelId !== channelId);
    };

    addMember = (serverId: string, user: User) => {
        if (serverId !== this.currentServerId) return;
        if (this.members.some(m => m.id === user.id)) return;
        this.members.push(user);
    };

    removeMember = (serverId: string, userId: string) => {
        if (serverId !== this.currentServerId) return;
        this.members = this.members.filter(m => m.id !== userId);
    };

    setPresence = (userId: string, isOnline: boolean) => {
        const member = this.members.find(m => m.id === userId);
        if (member) member.isOnline = isOnline;
    };

    setVoiceUsers = (channelId: string, users: VoiceUser[]) => {
        if (users.length === 0) {
            this.voiceUsers.delete(channelId);
        } else {
            this.voiceUsers.set(channelId, users);
        }
    };

    setAllVoiceUsers = (data: Record<string, VoiceUser[]>) => {
        Object.entries(data).forEach(([channelId, users]) => this.setVoiceUsers(channelId, users));
    };

    reset = () => {
        this.servers = [];
        this.serversLoaded = false;
        this.voiceUsers.clear();
        this.closeServer();
    };
}
