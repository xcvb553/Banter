import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Tab, Tabs, TextField, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { getErrorMessage } from "../../app/utils/helpers";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default observer(function JoinServerDialog({ open, onClose }: Props) {
    const { serverStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<"create" | "join">("create");
    const [code, setCode] = useState("");
    const [form, setForm] = useState({ name: "", description: "", isPublic: true });
    const [saving, setSaving] = useState(false);

    const handleClose = () => {
        setCode("");
        setForm({ name: "", description: "", isPublic: true });
        onClose();
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const server = await serverStore.createServer({
                name: form.name.trim(),
                description: form.description.trim(),
                isPublic: form.isPublic,
            });
            handleClose();
            navigate(`/server/${server.serverId}`);
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Could not create the server"));
        } finally {
            setSaving(false);
        }
    };

    const handleJoin = async () => {
        setSaving(true);
        try {
            const server = await serverStore.joinServer(code.trim());
            handleClose();
            commonStore.showSuccess(`Welcome to ${server.name}!`);
            navigate(`/server/${server.serverId}`);
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Could not join the server"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>Add a server</DialogTitle>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 3 }}>
                <Tab value="create" label="Create" sx={{ fontWeight: 700 }} />
                <Tab value="join" label="Join" sx={{ fontWeight: 700 }} />
            </Tabs>

            <DialogContent>
                {tab === "create" ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <Typography sx={{ color: "text.secondary" }}>
                            Your server is where you and your friends hang out. Make yours and start talking.
                        </Typography>
                        <TextField
                            autoFocus
                            label="Server name"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            slotProps={{ htmlInput: { maxLength: 100 } }}
                        />
                        <TextField
                            label="Description (optional)"
                            multiline
                            minRows={2}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} />}
                            label={
                                <Box>
                                    <Typography sx={{ fontWeight: 600 }}>Public server</Typography>
                                    <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                                        Anyone with the server ID can join. Private servers need an invite code.
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <Typography sx={{ color: "text.secondary" }}>
                            Enter an invite code (e.g. <b>hTKzmak9</b>) or the ID of a public server.
                        </Typography>
                        <TextField
                            autoFocus
                            label="Invite code or server ID"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && code.trim() && handleJoin()}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button color="inherit" onClick={handleClose}>Cancel</Button>
                {tab === "create" ? (
                    <Button variant="contained" onClick={handleCreate} disabled={form.name.trim().length < 2 || saving}>
                        Create server
                    </Button>
                ) : (
                    <Button variant="contained" onClick={handleJoin} disabled={!code.trim() || saving}>
                        Join server
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
});
