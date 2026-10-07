import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, InputBase, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import type { Invite, Server } from "../../app/models/server";
import { getErrorMessage } from "../../app/utils/helpers";

interface Props {
    open: boolean;
    server: Server;
    onClose: () => void;
}

export default function InviteDialog({ open, server, onClose }: Props) {
    const { commonStore } = useStore();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!open) return;
        agent.Servers.createInvite(server.serverId)
            .then(setInvite)
            .catch(error => commonStore.showError(getErrorMessage(error)));
    }, [open, server.serverId, commonStore]);

    const copy = async () => {
        if (!invite) return;
        await navigator.clipboard.writeText(invite.code);
        setCopied(true);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Invite friends to {server.name}</DialogTitle>
            <DialogContent>
                <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
                    Send this code to a friend. They can paste it in "Add a server" → "Join".
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.75, pl: 1.5, bgcolor: colors.rail, borderRadius: 2 }}>
                    {invite ? (
                        <InputBase value={invite.code} readOnly fullWidth sx={{ fontWeight: 700, letterSpacing: "0.08em", fontSize: "1.1rem" }} />
                    ) : (
                        <Box sx={{ flexGrow: 1 }}><CircularProgress size={18} /></Box>
                    )}
                    <Button variant="contained" onClick={copy} disabled={!invite} color={copied ? "success" : "primary"}>
                        {copied ? "Copied" : "Copy"}
                    </Button>
                </Box>
                {invite?.expiresAt && (
                    <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", mt: 1 }}>
                        Expires on {new Date(invite.expiresAt).toLocaleDateString()}.
                    </Typography>
                )}
                {server.isPublic && (
                    <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", mt: 1.5 }}>
                        This server is public, so people can also join with the server ID: <b>{server.serverId}</b>
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );
}
