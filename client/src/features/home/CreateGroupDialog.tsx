import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import UserAvatar from "../../app/common/UserAvatar";
import { getErrorMessage } from "../../app/utils/helpers";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default observer(function CreateGroupDialog({ open, onClose }: Props) {
    const { friendStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const handleClose = () => {
        setName("");
        setSelected([]);
        onClose();
    };

    const toggleFriend = (id: string) => {
        setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const group = await friendStore.createGroup({ name: name.trim(), memberIds: selected });
            handleClose();
            navigate(`/home/group/${group.id}`);
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Could not create the group"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Create a group</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label="Group name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    sx={{ mt: 1, mb: 2 }}
                />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "text.disabled", mb: 1 }}>
                    Add friends ({selected.length} selected)
                </Typography>
                <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
                    {friendStore.friends.length === 0 && (
                        <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>
                            You don't have any friends to add yet.
                        </Typography>
                    )}
                    {friendStore.friends.map(friend => (
                        <Box
                            key={friend.id}
                            onClick={() => toggleFriend(friend.id)}
                            sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, py: 0.5, borderRadius: 2, cursor: "pointer", "&:hover": { bgcolor: colors.hover } }}
                        >
                            <UserAvatar id={friend.id} name={friend.username} image={friend.image} size={30} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>{friend.username}</Typography>
                            <Checkbox checked={selected.includes(friend.id)} size="small" />
                        </Box>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} color="inherit">Cancel</Button>
                <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || saving}>
                    Create group
                </Button>
            </DialogActions>
        </Dialog>
    );
});
