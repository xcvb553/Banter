import { useEffect } from "react";
import { useStore } from "../../app/stores/store";

export default function useActiveChat(type: "channel" | "private" | "group", id: string | undefined) {
    const { chatStore } = useStore();

    useEffect(() => {
        if (!id) return;
        chatStore.setActiveChat(type, id);

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") chatStore.setActiveChat(type, id);
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            chatStore.clearActiveChat();
        };
    }, [type, id, chatStore]);
}
