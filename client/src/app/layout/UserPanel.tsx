import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import HeadsetRoundedIcon from "@mui/icons-material/HeadsetRounded";
import HeadsetOffRoundedIcon from "@mui/icons-material/HeadsetOffRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/store";
import { colors } from "../theme/theme";

export default observer(function UserPanel() {
    const { voiceStore, serverStore, friendStore } = useStore();

    const showCall = voiceStore.isInCall && voiceStore.callStatus !== "incoming";
    if (!voiceStore.currentChannelId && !showCall) return null;

    const voiceServer = serverStore.servers.find(s => s.serverId === voiceStore.currentServerId);
    const callFriend = friendStore.getFriend(voiceStore.otherCallUserId ?? undefined);

    const callText = {
        idle: "",
        incoming: "",
        outgoing: "Calling...",
        connecting: "Connecting...",
        connected: "In call",
    }[voiceStore.callStatus];

    return (
        <Box sx={{ m: 1, p: 1.5, borderRadius: "8px", bgcolor: colors.main, border: `1px solid ${colors.border}` }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <GraphicEqRoundedIcon sx={{ color: colors.online }} />
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography sx={{ color: colors.online, fontWeight: 700, fontSize: "0.85rem" }}>
                        {showCall ? callText : "Voice connected"}
                    </Typography>
                    <Typography noWrap sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                        {showCall ? callFriend?.username ?? "Friend" : `${voiceStore.currentChannelName} · ${voiceServer?.name ?? ""}`}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
                <ControlButton title={voiceStore.isMuted ? "Unmute" : "Mute"} active={voiceStore.isMuted} onClick={voiceStore.toggleMute}>
                    {voiceStore.isMuted ? <MicOffRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}
                </ControlButton>
                <ControlButton title={voiceStore.isDeafened ? "Undeafen" : "Deafen"} active={voiceStore.isDeafened} onClick={voiceStore.toggleDeafen}>
                    {voiceStore.isDeafened ? <HeadsetOffRoundedIcon fontSize="small" /> : <HeadsetRoundedIcon fontSize="small" />}
                </ControlButton>
                <Tooltip title={showCall ? "Hang up" : "Disconnect"}>
                    <IconButton
                        onClick={() => (showCall ? voiceStore.endCall() : voiceStore.leaveVoiceChannel())}
                        sx={{ flexGrow: 1, borderRadius: "6px", bgcolor: colors.danger, color: "#fff", "&:hover": { bgcolor: colors.danger, opacity: 0.85 } }}
                    >
                        <CallEndRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
});

function ControlButton({ title, active, onClick, children }: { title: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <Tooltip title={title}>
            <IconButton
                onClick={onClick}
                sx={{
                    flexGrow: 1,
                    borderRadius: "6px",
                    bgcolor: colors.sidebar,
                    border: `1px solid ${colors.border}`,
                    color: active ? colors.danger : "text.secondary",
                }}
            >
                {children}
            </IconButton>
        </Tooltip>
    );
}
