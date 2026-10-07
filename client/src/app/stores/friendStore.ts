import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import type { User } from "../models/user";
import type { CreateGroupModel, FriendGroup, FriendRequest } from "../models/friend";

export default class FriendStore {
    friends: User[] = [];
    requests: FriendRequest[] = [];
    groups: FriendGroup[] = [];
    loaded = false;

    constructor() {
        makeAutoObservable(this);
    }

    get onlineFriends() {
        return this.friends.filter(f => f.isOnline);
    }

    getFriend = (id: string | undefined) => this.friends.find(f => f.id === id);

    getGroup = (id: string | undefined) => this.groups.find(g => g.id === id);

    loadAll = async () => {
        await Promise.all([this.loadFriends(), this.loadRequests(), this.loadGroups()]);
        runInAction(() => (this.loaded = true));
    };

    loadFriends = async () => {
        try {
            const friends = await agent.Friends.list();
            runInAction(() => (this.friends = friends));
        } catch (error) {
            console.error("Could not load friends", error);
        }
    };

    loadRequests = async () => {
        try {
            const requests = await agent.Friends.requests();
            runInAction(() => (this.requests = requests));
        } catch (error) {
            console.error("Could not load friend requests", error);
        }
    };

    loadGroups = async () => {
        try {
            const groups = await agent.Groups.list();
            runInAction(() => (this.groups = groups));
        } catch (error) {
            console.error("Could not load groups", error);
        }
    };

    sendRequest = async (userName: string) => {
        await agent.Friends.sendRequest(userName);
        await this.loadFriends();
    };

    acceptRequest = async (request: FriendRequest) => {
        await agent.Friends.accept(request.requestId);
        runInAction(() => {
            this.requests = this.requests.filter(r => r.requestId !== request.requestId);
        });
        await this.loadFriends();
    };

    rejectRequest = async (request: FriendRequest) => {
        await agent.Friends.reject(request.requestId);
        runInAction(() => {
            this.requests = this.requests.filter(r => r.requestId !== request.requestId);
        });
    };

    removeFriend = async (friendId: string) => {
        await agent.Friends.remove(friendId);
        runInAction(() => {
            this.friends = this.friends.filter(f => f.id !== friendId);
        });
    };

    createGroup = async (model: CreateGroupModel) => {
        const group = await agent.Groups.create(model);
        runInAction(() => this.groups.push(group));
        return group;
    };

    renameGroup = async (groupId: string, name: string) => {
        await agent.Groups.rename(groupId, name);
        runInAction(() => {
            const group = this.getGroup(groupId);
            if (group) group.name = name;
        });
    };

    deleteGroup = async (groupId: string) => {
        await agent.Groups.delete(groupId);
        this.removeGroup(groupId);
    };

    leaveGroup = async (groupId: string, userId: string) => {
        await agent.Groups.removeMember(groupId, userId);
        this.removeGroup(groupId);
    };

    addGroupMember = async (groupId: string, userId: string) => {
        const user = await agent.Groups.addMember(groupId, userId);
        runInAction(() => {
            const group = this.getGroup(groupId);
            if (group && !group.members.some(m => m.id === user.id)) group.members.push(user);
        });
    };

    kickGroupMember = async (groupId: string, userId: string) => {
        await agent.Groups.removeMember(groupId, userId);
        runInAction(() => {
            const group = this.getGroup(groupId);
            if (group) group.members = group.members.filter(m => m.id !== userId);
        });
    };

    removeGroup = (groupId: string) => {
        this.groups = this.groups.filter(g => g.id !== groupId);
    };

    setPresence = (userId: string, isOnline: boolean) => {
        const friend = this.friends.find(f => f.id === userId);
        if (friend) friend.isOnline = isOnline;

        this.groups.forEach(group => {
            const member = group.members.find(m => m.id === userId);
            if (member) member.isOnline = isOnline;
        });
    };

    reset = () => {
        this.friends = [];
        this.requests = [];
        this.groups = [];
        this.loaded = false;
    };
}
