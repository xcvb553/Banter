import axios, { type AxiosResponse } from "axios";
import type { AuthResponse, CurrentUser, LoginModel, RegisterModel, UpdateUserModel, User } from "../models/user";
import type { Channel, ChannelCreateModel, Invite, Server, ServerBan, ServerCreateModel } from "../models/server";
import type { GroupMessage, Message, PrivateMessage, Reaction, UnreadCount } from "../models/message";
import type { CreateGroupModel, FriendGroup, FriendRequest } from "../models/friend";
import type { AdminServer, AdminStats, AdminUser } from "../models/admin";

export const API_URL = import.meta.env.VITE_API_URL ?? "";

axios.defaults.baseURL = `${API_URL}/api`;

axios.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    response => response,
    error => {
        const isAuthCall = error.config?.url?.startsWith("/auth");
        if (error.response?.status === 401 && !isAuthCall) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

const requests = {
    get: <T>(url: string, params?: object) => axios.get<T>(url, { params }).then(responseBody),
    post: <T>(url: string, body: object = {}) => axios.post<T>(url, body).then(responseBody),
    put: <T>(url: string, body: object) => axios.put<T>(url, body).then(responseBody),
    del: <T>(url: string, body?: object) => axios.delete<T>(url, { data: body }).then(responseBody),
    postForm: <T>(url: string, form: FormData) => axios.post<T>(url, form).then(responseBody),
};

interface PageParams {
    before?: string;
    take?: number;
}

const Auth = {
    login: (model: LoginModel) => requests.post<AuthResponse>("/auth/login", model),
    register: (model: RegisterModel) => requests.post<AuthResponse>("/auth/register", model),
};

const Users = {
    me: () => requests.get<CurrentUser>("/user/me"),
    get: (id: string) => requests.get<User>(`/user/${id}`),
    update: (model: UpdateUserModel) => requests.put<CurrentUser>("/user/me", model),
    uploadAvatar: (form: FormData) => requests.postForm<CurrentUser>("/user/me/avatar", form),
    changePassword: (currentPassword: string, newPassword: string) =>
        requests.post<void>("/user/me/password", { currentPassword, newPassword }),
    deleteAccount: (password: string) => requests.del<void>("/user/me", { password }),
};

const Servers = {
    list: () => requests.get<Server[]>("/server"),
    get: (serverId: string) => requests.get<Server>(`/server/${serverId}`),
    create: (model: ServerCreateModel) => requests.post<Server>("/server", model),
    delete: (serverId: string) => requests.del<void>(`/server/${serverId}`),
    join: (idOrCode: string) => requests.post<Server>(`/server/join/${encodeURIComponent(idOrCode)}`),
    leave: (serverId: string) => requests.post<void>(`/server/${serverId}/leave`),
    members: (serverId: string) => requests.get<User[]>(`/server/${serverId}/members`),
    kick: (serverId: string, userId: string) => requests.post<void>(`/server/${serverId}/kick/${userId}`),
    ban: (serverId: string, userId: string, reason: string) =>
        requests.post<void>(`/server/${serverId}/ban/${userId}`, { reason }),
    bans: (serverId: string) => requests.get<ServerBan[]>(`/server/${serverId}/bans`),
    unban: (serverId: string, userId: string) => requests.del<void>(`/server/${serverId}/bans/${userId}`),
    createInvite: (serverId: string) => requests.post<Invite>(`/server/${serverId}/invite`),
};

const Channels = {
    list: (serverId: string) => requests.get<Channel[]>(`/channel/server/${serverId}`),
    create: (serverId: string, model: ChannelCreateModel) => requests.post<Channel>(`/channel/server/${serverId}`, model),
    delete: (channelId: string) => requests.del<void>(`/channel/${channelId}`),
};

const Messages = {
    list: (channelId: string, params: PageParams) => requests.get<Message[]>(`/message/channel/${channelId}`, params),
    send: (channelId: string, form: FormData) => requests.postForm<Message>(`/message/channel/${channelId}`, form),
    edit: (messageId: string, content: string) => requests.put<Message>(`/message/${messageId}`, { content }),
    delete: (messageId: string) => requests.del<void>(`/message/${messageId}`),
    toggleReaction: (messageId: string, reactionType: string) =>
        requests.post<Reaction[]>(`/message/${messageId}/reactions`, { reactionType }),
};

const PrivateMessages = {
    list: (friendId: string, params: PageParams) => requests.get<PrivateMessage[]>(`/private-messages/${friendId}`, params),
    send: (friendId: string, content: string) => requests.post<PrivateMessage>(`/private-messages/${friendId}`, { content }),
    markAsRead: (friendId: string) => requests.post<void>(`/private-messages/${friendId}/read`),
    unread: () => requests.get<UnreadCount[]>("/private-messages/unread"),
};

const Friends = {
    list: () => requests.get<User[]>("/friendship"),
    requests: () => requests.get<FriendRequest[]>("/friendship/requests"),
    sendRequest: (userName: string) => requests.post<void>("/friendship/requests", { userName }),
    accept: (requestId: string) => requests.post<void>(`/friendship/requests/${requestId}/accept`),
    reject: (requestId: string) => requests.post<void>(`/friendship/requests/${requestId}/reject`),
    remove: (friendId: string) => requests.del<void>(`/friendship/${friendId}`),
};

const Groups = {
    list: () => requests.get<FriendGroup[]>("/group"),
    create: (model: CreateGroupModel) => requests.post<FriendGroup>("/group", model),
    rename: (groupId: string, name: string) => requests.put<void>(`/group/${groupId}`, { name }),
    delete: (groupId: string) => requests.del<void>(`/group/${groupId}`),
    members: (groupId: string) => requests.get<User[]>(`/group/${groupId}/members`),
    addMember: (groupId: string, userId: string) => requests.post<User>(`/group/${groupId}/members/${userId}`),
    removeMember: (groupId: string, userId: string) => requests.del<void>(`/group/${groupId}/members/${userId}`),
    messages: (groupId: string, params: PageParams) => requests.get<GroupMessage[]>(`/group/${groupId}/messages`, params),
    sendMessage: (groupId: string, content: string) => requests.post<GroupMessage>(`/group/${groupId}/messages`, { content }),
    markAsRead: (groupId: string) => requests.post<void>(`/group/${groupId}/read`),
    unread: () => requests.get<UnreadCount[]>("/group/unread"),
};

const Admin = {
    stats: () => requests.get<AdminStats>("/admin/stats"),
    users: () => requests.get<AdminUser[]>("/admin/users"),
    deleteUser: (userId: string) => requests.del<void>(`/admin/users/${userId}`),
    servers: () => requests.get<AdminServer[]>("/admin/servers"),
    deleteServer: (serverId: string) => requests.del<void>(`/admin/servers/${serverId}`),
};

const agent = {
    Auth,
    Users,
    Servers,
    Channels,
    Messages,
    PrivateMessages,
    Friends,
    Groups,
    Admin,
};

export default agent;
