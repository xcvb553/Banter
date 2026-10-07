import { Box, Dialog, IconButton, Tooltip, Typography } from "@mui/material";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import UserAvatar from "../../app/common/UserAvatar";
import type { User } from "../../app/models/user";

export default observer(function IncomingCallDialog() {
    const { voiceStore, friendStore } = useStore();
    const callerId = voiceStore.callStatus === "incoming" ? voiceStore.call?.callerId : undefined;
    const [caller, setCaller] = useState<User | null>(null);

    useEffect(() => {
        if (!callerId) {
            setCaller(null);
            return;
        }
        const friend = friendStore.getFriend(callerId);
        if (friend) {
            setCaller(friend);
        } else {
            agent.Users.get(callerId).then(setCaller).catch(() => setCaller(null));
        }
    }, [callerId, friendStore]);

    return (
        <Dialog open={!!callerId} maxWidth="xs" slotProps={{ paper: { sx: { width: 320, textAlign: "center", p: 3 } } }}>
            <Box
                sx={{
                    display: "inline-flex",
                    borderRadius: "50%",
                    p: 0.75,
                    mx: "auto",
                    mb: 2,
                    animation: "pulse 1.4s infinite",
                    "@keyframes pulse": {
                        "0%": { boxShadow: `0 0 0 0 rgba(16,185,129,0.5)` },
                        "100%": { boxShadow: `0 0 0 22px rgba(16,185,129,0)` },
                    },
                }}
            >
                <UserAvatar id={callerId} name={caller?.username} image={caller?.image} size={84} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.2rem" }}>{caller?.username ?? "Someone"}</Typography>
            <Typography sx={{ color: "text.secondary", mb: 3 }}>is calling you...</Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 4 }}>
                <Tooltip title="Decline">
                    <IconButton onClick={voiceStore.declineCall} sx={{ bgcolor: colors.danger, color: "white", width: 56, height: 56, "&:hover": { bgcolor: colors.danger, opacity: 0.85 } }}>
                        <CallEndRoundedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Accept">
                    <IconButton onClick={voiceStore.acceptCall} sx={{ bgcolor: colors.online, color: "#fff", width: 56, height: 56, "&:hover": { bgcolor: colors.online, opacity: 0.85 } }}>
                        <CallRoundedIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Dialog>
    );
});
