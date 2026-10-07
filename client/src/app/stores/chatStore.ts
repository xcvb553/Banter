import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { makeAutoObservable, runInAction } from "mobx";
import agent, { API_URL } from "../api/agent";
import type { GroupMessage, Message, PrivateMessage, Reaction } from "../models/message";
import type { Channel } from "../models/server";
import type { User } from "../models/user";
import type { VoiceUser } from "../models/voice";
import type CommonStore from "./commonStore";
import type FriendStore from "./friendStore";
import type ServerStore from "./serverStore";
import type UserStore from "./userStore";

const PAGE_SIZE = 50;

type ChatType = "channel" | "private" | "group";

interface Notification {
    type: string;
    payload: Record<string, string>;
}

export default class ChatStore {
    connection: HubConnection | null = null;
    isConnected = false;

    channelMessages = new Map<string, Message[]>();
    privateMessages = new Map<string, PrivateMessage[]>();
    groupMessages = new Map<string, GroupMessage[]>();

    hasMore = new Map<string, boolean>();
    loadingMore = new Set<string>();

    unreadPrivate = new Map<string, number>();
    unreadGroups = new Map<string, number>();

    activeChat: { type: ChatType; id: string } | null = null;

    private userStore: UserStore;
    private serverStore: ServerStore;
    private friendStore: FriendStore;
    private commonStore: CommonStore;

    constructor(userStore: UserStore, serverStore: ServerStore, friendStore: FriendStore, commonStore: CommonStore) {
        makeAutoObservable<ChatStore, "userStore" | "serverStore" | "friendStore" | "commonStore">(this, {
            connection: false,
            userStore: false,
            serverStore: false,
            friendStore: false,
            commonStore: false,
        });
        this.userStore = userStore;
        this.serverStore = serverStore;
        this.friendStore = friendStore;
        this.commonStore = commonStore;
    }

    connect = async () => {
        if (this.connection) return;

        const connection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/hubs/chat`, {
                accessTokenFactory: () => localStorage.getItem("token") ?? "",
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        this.connection = connection;
        this.registerHandlers(connection);

        connection.onreconnecting(() => runInAction(() => (this.isConnected = false)));
        connection.onreconnected(() => {
            runInAction(() => (this.isConnected = true));
            this.clearCache();
            this.loadUnreadCounts();
        });
        connection.onclose(() => {
            runInAction(() => (this.isConnected = false));
            if (this.connection === connection && this.userStore.isLoggedIn) {
                this.connection = null;
                setTimeout(() => this.connect(), 5000);
            }
        });

        try {
            await connection.start();
            runInAction(() => (this.isConnected = true));
        } catch (error) {
            if (this.connection === connection) {
                console.error("ChatHub connection failed", error);
                this.connection = null;
                setTimeout(() => {
                    if (this.userStore.isLoggedIn) this.connect();
                }, 5000);
            }
        }
    };

    disconnect = async () => {
        const connection = this.connection;
        this.connection = null;
        this.isConnected = false;
        if (connection && connection.state !== HubConnectionState.Disconnected) {
            await connection.stop();
        }
    };

    private registerHandlers(connection: HubConnection) {
        connection.on("MessageReceived", this.handleMessageReceived);
        connection.on("MessageUpdated", this.handleMessageUpdated);
        connection.on("MessageDeleted", this.handleMessageDeleted);
        connection.on("ReactionsUpdated", this.handleReactionsUpdated);
        connection.on("PrivateMessageReceived", this.handlePrivateMessage);
        connection.on("GroupMessageReceived", this.handleGroupMessage);
        connection.on("ReceiveNotification", this.handleNotification);

        connection.on("ChannelCreated", (channel: Channel) => this.serverStore.addChannel(channel));
        connection.on("ChannelDeleted", (data: { channelId: string }) => this.serverStore.removeChannel(data.channelId));
        connection.on("MemberJoined", (data: { serverId: string; user: User }) =>
            this.serverStore.addMember(data.serverId, data.user));
        connection.on("MemberLeft", (data: { serverId: string; userId: string }) =>
            this.serverStore.removeMember(data.serverId, data.userId));
        connection.on("ServerDeleted", (data: { serverId: string }) => {
            const server = this.serverStore.servers.find(s => s.serverId === data.serverId);
            if (server && server.ownerId !== this.userStore.user?.id) {
                this.commonStore.showToast(`Server "${server.name}" was deleted`, "warning");
            }
            this.serverStore.removeServer(data.serverId);
        });
        connection.on("RemovedFromServer", (data: { serverId: string; reason: string }) => {
            this.commonStore.showToast(data.reason, "warning");
            this.serverStore.removeServer(data.serverId);
        });
        connection.on("PresenceChanged", (data: { userId: string; isOnline: boolean }) => {
            this.friendStore.setPresence(data.userId, data.isOnline);
            this.serverStore.setPresence(data.userId, data.isOnline);
        });
        connection.on("VoiceChannelUsersChanged", (channelId: string, users: VoiceUser[]) =>
            this.serverStore.setVoiceUsers(channelId, users));
    }

    private async loadPage<T extends { messageId: string }>(
        key: string,
        cache: Map<string, T[]>,
        id: string,
        older: boolean,
        getDate: (item: T) => string,
        fetch: (before?: string) => Promise<T[]>
    ) {
        const current = cache.get(id);
        if (!older && current) return;
        if (this.loadingMore.has(key)) return;

        const before = older && current?.length ? getDate(current[0]) : undefined;
        this.loadingMore.add(key);
        try {
            const page = await fetch(before);
            runInAction(() => {
                const existing = older ? (cache.get(id) ?? []) : [];
                const ids = new Set(existing.map(m => m.messageId));
                cache.set(id, [...page.filter(m => !ids.has(m.messageId)), ...existing]);
                this.hasMore.set(key, page.length === PAGE_SIZE);
            });
        } finally {
            runInAction(() => this.loadingMore.delete(key));
        }
    }

    loadChannelMessages = (channelId: string, older = false) =>
        this.loadPage(`channel:${channelId}`, this.channelMessages, channelId, older, m => m.createdAt,
            before => agent.Messages.list(channelId, { before, take: PAGE_SIZE }));

    loadPrivateMessages = (friendId: string, older = false) =>
        this.loadPage(`private:${friendId}`, this.privateMessages, friendId, older, m => m.sentAt,
            before => agent.PrivateMessages.list(friendId, { before, take: PAGE_SIZE }));

    loadGroupMessages = (groupId: string, older = false) =>
        this.loadPage(`group:${groupId}`, this.groupMessages, groupId, older, m => m.sentAt,
            before => agent.Groups.messages(groupId, { before, take: PAGE_SIZE }));

    canLoadMore = (type: ChatType, id: string) => this.hasMore.get(`${type}:${id}`) ?? false;

    isLoading = (type: ChatType, id: string) => this.loadingMore.has(`${type}:${id}`);

    sendChannelMessage = async (channelId: string, content: string, files: File[]) => {
        const form = new FormData();
        form.append("content", content);
        files.forEach(file => form.append("files", file));

        const message = await agent.Messages.send(channelId, form);
        this.handleMessageReceived(message);
    };

    editMessage = async (messageId: string, content: string) => {
        const message = await agent.Messages.edit(messageId, content);
        this.handleMessageUpdated(message);
    };

    deleteMessage = async (message: Message) => {
        await agent.Messages.delete(message.messageId);
        this.handleMessageDeleted({ messageId: message.messageId, channelId: message.channelId });
    };

    toggleReaction = async (message: Message, reactionType: string) => {
        const reactions = await agent.Messages.toggleReaction(message.messageId, reactionType);
        this.handleReactionsUpdated({ messageId: message.messageId, channelId: message.channelId, reactions });
    };

    sendPrivateMessage = async (friendId: string, content: string) => {
        const message = await agent.PrivateMessages.send(friendId, content);
        this.handlePrivateMessage(message);
    };

    sendGroupMessage = async (groupId: string, content: string) => {
        const message = await agent.Groups.sendMessage(groupId, content);
        this.handleGroupMessage(message);
    };

    loadUnreadCounts = async () => {
        try {
            const [privateCounts, groupCounts] = await Promise.all([
                agent.PrivateMessages.unread(),
                agent.Groups.unread(),
            ]);
            runInAction(() => {
                const active = this.activeChat;
                this.unreadPrivate = new Map(
                    privateCounts.filter(c => !(active?.type === "private" && active.id === c.id)).map(c => [c.id, c.count])
                );
                this.unreadGroups = new Map(
                    groupCounts.filter(c => !(active?.type === "group" && active.id === c.id)).map(c => [c.id, c.count])
                );
            });
        } catch (error) {
            console.error("Could not load unread counts", error);
        }
    };

    get totalUnread() {
        let total = 0;
        this.unreadPrivate.forEach(count => (total += count));
        this.unreadGroups.forEach(count => (total += count));
        return total;
    }

    setActiveChat = (type: ChatType, id: string) => {
        this.activeChat = { type, id };
        if (type === "private") this.markPrivateAsRead(id);
        if (type === "group") this.markGroupAsRead(id);
    };

    clearActiveChat = () => {
        this.activeChat = null;
    };

    markPrivateAsRead = async (friendId: string) => {
        this.unreadPrivate.delete(friendId);
        try {
            await agent.PrivateMessages.markAsRead(friendId);
        } catch (error) {
            console.error(error);
        }
    };

    markGroupAsRead = async (groupId: string) => {
        this.unreadGroups.delete(groupId);
        try {
            await agent.Groups.markAsRead(groupId);
        } catch (error) {
            console.error(error);
        }
    };

    private isChatActive(type: ChatType, id: string) {
        return this.activeChat?.type === type && this.activeChat.id === id && document.visibilityState === "visible";
    }

    handleMessageReceived = (message: Message) => {
        const list = this.channelMessages.get(message.channelId);
        if (!list) return;
        if (list.some(m => m.messageId === message.messageId)) return;
        list.push(message);
    };

    handleMessageUpdated = (message: Message) => {
        const list = this.channelMessages.get(message.channelId);
        const index = list?.findIndex(m => m.messageId === message.messageId) ?? -1;
        if (list && index >= 0) list[index] = message;
    };

    handleMessageDeleted = (data: { messageId: string; channelId: string }) => {
        const list = this.channelMessages.get(data.channelId);
        if (list) {
            this.channelMessages.set(data.channelId, list.filter(m => m.messageId !== data.messageId));
        }
    };

    handleReactionsUpdated = (data: { messageId: string; channelId: string; reactions: Reaction[] }) => {
        const message = this.channelMessages.get(data.channelId)?.find(m => m.messageId === data.messageId);
        if (message) message.reactions = data.reactions;
    };

    handlePrivateMessage = (message: PrivateMessage) => {
        const myId = this.userStore.user?.id;
        const friendId = message.senderId === myId ? message.receiverId : message.senderId;

        const list = this.privateMessages.get(friendId);
        if (list) {
            if (list.some(m => m.messageId === message.messageId)) return;
            list.push(message);
        }

        if (message.senderId !== myId) {
            if (this.isChatActive("private", friendId)) {
                this.markPrivateAsRead(friendId);
            } else {
                this.unreadPrivate.set(friendId, (this.unreadPrivate.get(friendId) ?? 0) + 1);
            }
        }
    };

    handleGroupMessage = (message: GroupMessage) => {
        const list = this.groupMessages.get(message.groupId);
        if (list) {
            if (list.some(m => m.messageId === message.messageId)) return;
            list.push(message);
        }

        if (message.senderId !== this.userStore.user?.id) {
            if (this.isChatActive("group", message.groupId)) {
                this.markGroupAsRead(message.groupId);
            } else {
                this.unreadGroups.set(message.groupId, (this.unreadGroups.get(message.groupId) ?? 0) + 1);
            }
        }
    };

    handleNotification = (notification: Notification) => {
        const { type, payload } = notification;
        switch (type) {
            case "FriendRequestReceived":
                this.friendStore.loadRequests();
                this.commonStore.showToast("You got a new friend request", "info");
                break;
            case "FriendRequestAccepted":
                this.friendStore.loadFriends();
                this.friendStore.loadRequests();
                break;
            case "FriendRemoved":
                this.friendStore.loadFriends();
                break;
            case "GroupUpdated":
                this.friendStore.loadGroups();
                break;
            case "GroupRemoved":
                if (this.friendStore.getGroup(payload.groupId)) {
                    this.commonStore.showToast(`You are no longer in the group "${payload.groupName}"`, "warning");
                }
                this.friendStore.removeGroup(payload.groupId);
                this.groupMessages.delete(payload.groupId);
                this.unreadGroups.delete(payload.groupId);
                break;
            default:
                console.warn("Unknown notification", type);
        }
    };

    clearCache = () => {
        this.channelMessages.clear();
        this.privateMessages.clear();
        this.groupMessages.clear();
        this.hasMore.clear();
    };

    reset = () => {
        this.clearCache();
        this.unreadPrivate.clear();
        this.unreadGroups.clear();
        this.activeChat = null;
    };
}
