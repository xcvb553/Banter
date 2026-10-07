import { Alert, Snackbar } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { resetStores, useStore } from "../stores/store";

export default observer(function App() {
    const { userStore, serverStore, friendStore, chatStore, voiceStore, commonStore } = useStore();
    const isLoggedIn = userStore.isLoggedIn;

    useEffect(() => {
        if (!isLoggedIn) return;

        userStore.loadCurrentUser();
        serverStore.loadServers();
        friendStore.loadAll();
        chatStore.loadUnreadCounts();
        chatStore.connect();
        voiceStore.connect();

        return () => {
            chatStore.disconnect();
            voiceStore.disconnect();
            resetStores();
        };
    }, [isLoggedIn, userStore, serverStore, friendStore, chatStore, voiceStore]);

    const toast = commonStore.toast;

    return (
        <>
            <Outlet />
            <Snackbar
                key={toast?.id}
                open={!!toast}
                autoHideDuration={4000}
                onClose={(_, reason) => reason !== "clickaway" && commonStore.hideToast()}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={toast?.severity ?? "info"}
                    variant="filled"
                    onClose={commonStore.hideToast}
                    sx={{ fontWeight: 600 }}
                >
                    {toast?.message}
                </Alert>
            </Snackbar>
        </>
    );
});
