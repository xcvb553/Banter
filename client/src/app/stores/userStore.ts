import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import type { CurrentUser, LoginModel, RegisterModel, UpdateUserModel } from "../models/user";

export default class UserStore {
    user: CurrentUser | null = null;
    token: string | null = null;
    loading = false;

    constructor() {
        makeAutoObservable(this);

        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (token && user) {
            try {
                this.token = token;
                this.user = JSON.parse(user);
            } catch {
                localStorage.removeItem("user");
            }
        }
    }

    get isLoggedIn() {
        return !!this.token && !!this.user;
    }

    get isAdmin() {
        return this.user?.role === "Admin";
    }

    private setSession = (token: string, user: CurrentUser) => {
        this.token = token;
        this.user = user;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
    };

    private setUser = (user: CurrentUser) => {
        this.user = user;
        localStorage.setItem("user", JSON.stringify(user));
    };

    login = async (model: LoginModel) => {
        this.loading = true;
        try {
            const response = await agent.Auth.login(model);
            runInAction(() => this.setSession(response.token, response.user));
        } finally {
            runInAction(() => (this.loading = false));
        }
    };

    register = async (model: RegisterModel) => {
        this.loading = true;
        try {
            const response = await agent.Auth.register(model);
            runInAction(() => this.setSession(response.token, response.user));
        } finally {
            runInAction(() => (this.loading = false));
        }
    };

    logout = () => {
        this.token = null;
        this.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    loadCurrentUser = async () => {
        try {
            const user = await agent.Users.me();
            runInAction(() => this.setUser(user));
        } catch (error) {
            console.error("Could not load current user", error);
        }
    };

    updateProfile = async (model: UpdateUserModel) => {
        const user = await agent.Users.update(model);
        runInAction(() => this.setUser(user));
    };

    uploadAvatar = async (file: File) => {
        const form = new FormData();
        form.append("file", file);
        const user = await agent.Users.uploadAvatar(form);
        runInAction(() => this.setUser(user));
    };

    changePassword = async (currentPassword: string, newPassword: string) => {
        await agent.Users.changePassword(currentPassword, newPassword);
    };

    deleteAccount = async (password: string) => {
        await agent.Users.deleteAccount(password);
        this.logout();
    };
}
