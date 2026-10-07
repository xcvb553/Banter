import { makeAutoObservable } from "mobx";

export type ToastSeverity = "success" | "error" | "info" | "warning";

interface Toast {
    id: number;
    message: string;
    severity: ToastSeverity;
}

export default class CommonStore {
    toast: Toast | null = null;
    private nextId = 1;

    constructor() {
        makeAutoObservable(this);
    }

    showToast = (message: string, severity: ToastSeverity = "info") => {
        this.toast = { id: this.nextId++, message, severity };
    };

    showError = (message: string) => this.showToast(message, "error");

    showSuccess = (message: string) => this.showToast(message, "success");

    hideToast = () => {
        this.toast = null;
    };
}
