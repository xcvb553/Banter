import { Box, Divider, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { Server } from "../../app/models/server";
import { getErrorMessage } from "../../app/utils/helpers";
import InviteDialog from "./InviteDialog";
import BansDialog from "./BansDialog";

interface Props {
    server: Server;
    isOwner: boolean;
    onCreateChannel: () => void;
}

export default observer(function ServerMenu({ server, isOwner, onCreateChannel }: Props) {
    const { serverStore, voiceStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [bansOpen, setBansOpen] = useState(false);
    const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);

    const close = () => setAnchor(null);

    const handleLeaveOrDelete = async () => {
        try {
            if (voiceStore.currentServerId === server.serverId) await voiceStore.leaveVoiceChannel();
            if (confirm === "delete") {
                await serverStore.deleteServer(server.serverId);
            } else {
                await serverStore.leaveServer(server.serverId);
            }
            navigate("/home");
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    return (
        <>
            <Box
                onClick={e => setAnchor(e.currentTarget)}
                sx={{ display: "flex", alignItems: "center", width: "100%", cursor: "pointer", gap: 1, "&:hover": { color: colors.accent } }}
            >
                <Typography noWrap sx={{ fontWeight: 700, flexGrow: 1 }}>{server.name}</Typography>
                <KeyboardArrowDownRoundedIcon />
            </Box>

            <Menu
                anchorEl={anchor}
                open={!!anchor}
                onClose={close}
                slotProps={{ paper: { sx: { width: 230 } } }}
            >
                <MenuItem onClick={() => { setInviteOpen(true); close(); }} sx={{ color: colors.accent }}>
                    <ListItemIcon sx={{ color: "inherit" }}><PersonAddAlt1RoundedIcon fontSize="small" /></ListItemIcon>
                    Invite people
                </MenuItem>
                {isOwner && (
                    <MenuItem onClick={() => { onCreateChannel(); close(); }}>
                        <ListItemIcon><AddCircleOutlineRoundedIcon fontSize="small" /></ListItemIcon>
                        Create channel
                    </MenuItem>
                )}
                {isOwner && (
                    <MenuItem onClick={() => { setBansOpen(true); close(); }}>
                        <ListItemIcon><GavelRoundedIcon fontSize="small" /></ListItemIcon>
                        Bans
                    </MenuItem>
                )}
                {server.isPublic && (
                    <MenuItem
                        onClick={() => {
                            navigator.clipboard.writeText(server.serverId);
                            commonStore.showSuccess("Server ID copied");
                            close();
                        }}
                    >
                        <ListItemIcon><ContentCopyRoundedIcon fontSize="small" /></ListItemIcon>
                        Copy server ID
                    </MenuItem>
                )}
                <Divider />
                {isOwner ? (
                    <MenuItem onClick={() => { setConfirm("delete"); close(); }} sx={{ color: colors.danger }}>
                        <ListItemIcon sx={{ color: "inherit" }}><DeleteForeverRoundedIcon fontSize="small" /></ListItemIcon>
                        Delete server
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => { setConfirm("leave"); close(); }} sx={{ color: colors.danger }}>
                        <ListItemIcon sx={{ color: "inherit" }}><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                        Leave server
                    </MenuItem>
                )}
            </Menu>

            {inviteOpen && <InviteDialog open server={server} onClose={() => setInviteOpen(false)} />}
            {isOwner && bansOpen && <BansDialog open serverId={server.serverId} onClose={() => setBansOpen(false)} />}

            <ConfirmDialog
                open={!!confirm}
                title={confirm === "delete" ? "Delete server" : "Leave server"}
                message={
                    confirm === "delete"
                        ? `Delete "${server.name}" with all channels and messages? This can't be undone.`
                        : `Are you sure you want to leave "${server.name}"?`
                }
                confirmText={confirm === "delete" ? "Delete" : "Leave"}
                danger
                onConfirm={handleLeaveOrDelete}
                onClose={() => setConfirm(null)}
            />
        </>
    );
});
