export interface User {
    id: string;
    username: string;
    image: string | null;
    isOnline: boolean;
}

export interface CurrentUser {
    id: string;
    username: string;
    email: string;
    image: string | null;
    bio: string | null;
    role: "Admin" | "User";
}

export interface LoginModel {
    username: string;
    password: string;
}

export interface RegisterModel {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: CurrentUser;
}

export interface UpdateUserModel {
    username?: string;
    email?: string;
    bio?: string;
}
