import { isAxiosError } from "axios";
import { API_URL } from "../api/agent";

export function fileUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    return `${API_URL}${path}`;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
    if (isAxiosError(error)) {
        const data = error.response?.data;
        if (typeof data === "string" && data.length > 0) return data;
        if (data?.message) return data.message;
        if (data?.errors) {
            const first = Object.values(data.errors as Record<string, string[]>)[0];
            if (first?.length) return first[0];
        }
        if (!error.response) return "Can't connect to the server";
    }
    return fallback;
}

export function colorFromString(value: string | undefined | null): string {
    const palette = ["#d9734e", "#3f8f86", "#7b68b5", "#c25d86", "#4a7cc4", "#c69a2c", "#4f9a63", "#b85454"];
    if (!value) return palette[0];
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
}

export function formatMessageTime(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (d.toDateString() === now.toDateString()) return `Today at ${time}`;

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;

    return `${d.toLocaleDateString()} ${time}`;
}

export function formatShortTime(date: string): string {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isSameAuthorGroup(prev: { senderId: string; date: string } | undefined, current: { senderId: string; date: string }) {
    if (!prev) return false;
    if (prev.senderId !== current.senderId) return false;
    return new Date(current.date).getTime() - new Date(prev.date).getTime() < 5 * 60 * 1000;
}
