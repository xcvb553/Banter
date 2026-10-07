import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { useStore } from "../../app/stores/store";
import UserAvatar from "../../app/common/UserAvatar";
import type { ServerBan } from "../../app/models/server";
import { getErrorMessage } from "../../app/utils/helpers";

interface Props {
    open: boolean;
    serverId: string;
    onClose: () => void;
}

export default function BansDialog({ open, serverId, onClose }: Props) {
    const { commonStore } = useStore();
    const [bans, setBans] = useState<ServerBan[] | null>(null);

    useEffect(() => {
        if (!open) return;
        agent.Servers.bans(serverId)
            .then(setBans)
            .catch(error => commonStore.showError(getErrorMessage(error)));
    }, [open, serverId, commonStore]);

    const unban = async (ban: ServerBan) => {
        try {
            await agent.Servers.unban(serverId, ban.bannedUserId);
            setBans(bans?.filter(b => b.bannedUserId !== ban.bannedUserId) ?? null);
            commonStore.showSuccess(`${ban.username} was unbanned`);
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Banned users</DialogTitle>
            <DialogContent>
                {!bans && <CircularProgress size={22} />}
                {bans?.length === 0 && <Typography sx={{ color: "text.secondary" }}>Nobody is banned. Nice!</Typography>}
                {bans?.map(ban => (
                    <Box key={ban.bannedUserId} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                        <UserAvatar id={ban.bannedUserId} name={ban.username} image={ban.image} size={36} />
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700 }}>{ban.username}</Typography>
                            <Typography noWrap sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                                {ban.reason ? `Reason: ${ban.reason}` : "No reason"} • {new Date(ban.bannedAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Button variant="outlined" color="inherit" size="small" onClick={() => unban(ban)}>
                            Unban
                        </Button>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant="contained" onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
