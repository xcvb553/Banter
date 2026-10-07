import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, TextField, Typography } from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors, panelSx } from "../../app/theme/theme";
import UserAvatar from "../../app/common/UserAvatar";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { User } from "../../app/models/user";
import { getErrorMessage } from "../../app/utils/helpers";

export default observer(function MemberList() {
    const { serverStore, userStore, friendStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [menu, setMenu] = useState<{ anchor: HTMLElement; user: User } | null>(null);
    const [kickUser, setKickUser] = useState<User | null>(null);
    const [banUser, setBanUser] = useState<User | null>(null);
    const [banReason, setBanReason] = useState("");

    const myId = userStore.user?.id;
    const isOwner = serverStore.isOwner(myId);
    const ownerId = serverStore.currentServer?.ownerId;

    const online = serverStore.members.filter(m => m.isOnline);
    const offline = serverStore.members.filter(m => !m.isOnline);

    const handleBan = async () => {
        if (!banUser) return;
        try {
            await serverStore.banMember(banUser.id, banReason);
            commonStore.showSuccess(`${banUser.username} was banned`);
            setBanUser(null);
            setBanReason("");
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    const renderMember = (member: User) => {
        const isFriend = !!friendStore.getFriend(member.id);
        const hasMenu = member.id !== myId && (isOwner || isFriend);

        return (
            <Box
                key={member.id}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    "&:hover": { bgcolor: colors.hover },
                    "&:hover .member-menu": { opacity: 1 },
                }}
            >
                <UserAvatar id={member.id} name={member.username} image={member.image} size={32} online={member.isOnline} />
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.9rem", opacity: member.isOnline ? 1 : 0.55 }}>
                        {member.username}
                    </Typography>
                    {member.id === ownerId && (
                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>owner</Typography>
                    )}
                </Box>
                {hasMenu && (
                    <IconButton
                        className="member-menu"
                        size="small"
                        onClick={e => setMenu({ anchor: e.currentTarget, user: member })}
                        sx={{ opacity: 0, color: "text.secondary" }}
                    >
                        <MoreVertRoundedIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ ...panelSx, bgcolor: colors.sidebar, borderLeft: `1px solid ${colors.border}`, width: 240, flexShrink: 0, overflowY: "auto", p: 1.5 }}>
            <SectionTitle text={`Online — ${online.length}`} />
            {online.map(renderMember)}
            {offline.length > 0 && (
                <>
                    <SectionTitle text={`Offline — ${offline.length}`} />
                    {offline.map(renderMember)}
                </>
            )}

            <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
                {menu && friendStore.getFriend(menu.user.id) && (
                    <MenuItem
                        onClick={() => {
                            navigate(`/home/dm/${menu.user.id}`);
                            setMenu(null);
                        }}
                    >
                        <ListItemIcon><ChatBubbleRoundedIcon fontSize="small" /></ListItemIcon>
                        Message
                    </MenuItem>
                )}
                {isOwner && (
                    <MenuItem
                        onClick={() => {
                            setKickUser(menu!.user);
                            setMenu(null);
                        }}
                        sx={{ color: colors.warning }}
                    >
                        <ListItemIcon sx={{ color: "inherit" }}><PersonRemoveRoundedIcon fontSize="small" /></ListItemIcon>
                        Kick
                    </MenuItem>
                )}
                {isOwner && (
                    <MenuItem
                        onClick={() => {
                            setBanUser(menu!.user);
                            setMenu(null);
                        }}
                        sx={{ color: colors.danger }}
                    >
                        <ListItemIcon sx={{ color: "inherit" }}><GavelRoundedIcon fontSize="small" /></ListItemIcon>
                        Ban
                    </MenuItem>
                )}
            </Menu>

            <ConfirmDialog
                open={!!kickUser}
                title="Kick member"
                message={`Kick ${kickUser?.username} from the server? They can join again with an invite.`}
                confirmText="Kick"
                danger
                onConfirm={async () => {
                    try {
                        await serverStore.kickMember(kickUser!.id);
                    } catch (error) {
                        commonStore.showError(getErrorMessage(error));
                    }
                }}
                onClose={() => setKickUser(null)}
            />

            <Dialog open={!!banUser} onClose={() => setBanUser(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Ban {banUser?.username}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "text.secondary", mb: 2 }}>
                        A banned user is removed from the server and can't join again until you unban them.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Reason (optional)"
                        value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                        slotProps={{ htmlInput: { maxLength: 300 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setBanUser(null)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleBan}>Ban</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

function SectionTitle({ text }: { text: string }) {
    return (
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.disabled", px: 1, pt: 1, pb: 0.5 }}>
            {text}
        </Typography>
    );
}
