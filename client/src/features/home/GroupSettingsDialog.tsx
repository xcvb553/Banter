import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import UserAvatar from "../../app/common/UserAvatar";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { FriendGroup } from "../../app/models/friend";
import { getErrorMessage } from "../../app/utils/helpers";

interface Props {
    open: boolean;
    group: FriendGroup;
    onClose: () => void;
}

export default observer(function GroupSettingsDialog({ open, group, onClose }: Props) {
    const { friendStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [name, setName] = useState(group.name);
    const [friendToAdd, setFriendToAdd] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);

    const friendsToAdd = friendStore.friends.filter(f => !group.members.some(m => m.id === f.id));

    const run = async (action: () => Promise<void>, successText?: string) => {
        try {
            await action();
            if (successText) commonStore.showSuccess(successText);
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Group settings</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <TextField fullWidth label="Group name" value={name} onChange={e => setName(e.target.value)} />
                        <Button
                            variant="contained"
                            disabled={!name.trim() || name.trim() === group.name}
                            onClick={() => run(() => friendStore.renameGroup(group.id, name.trim()), "Group renamed")}
                        >
                            Save
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "text.disabled", mb: 1 }}>
                        Add a friend
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            select
                            fullWidth
                            label={friendsToAdd.length ? "Choose a friend" : "All your friends are already here"}
                            value={friendToAdd}
                            onChange={e => setFriendToAdd(e.target.value)}
                            disabled={friendsToAdd.length === 0}
                        >
                            {friendsToAdd.map(friend => (
                                <MenuItem key={friend.id} value={friend.id}>{friend.username}</MenuItem>
                            ))}
                        </TextField>
                        <Button
                            variant="contained"
                            disabled={!friendToAdd}
                            onClick={() => run(async () => {
                                await friendStore.addGroupMember(group.id, friendToAdd);
                                setFriendToAdd("");
                            })}
                        >
                            Add
                        </Button>
                    </Box>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "text.disabled", mb: 1 }}>
                        Members — {group.members.length}
                    </Typography>
                    {group.members.map(member => (
                        <Box key={member.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75 }}>
                            <UserAvatar id={member.id} name={member.username} image={member.image} size={32} />
                            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>{member.username}</Typography>
                            {member.id !== group.creatorId && (
                                <Tooltip title="Remove from group">
                                    <IconButton
                                        size="small"
                                        onClick={() => run(() => friendStore.kickGroupMember(group.id, member.id))}
                                        sx={{ color: "text.secondary", "&:hover": { color: colors.danger } }}
                                    >
                                        <PersonRemoveRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
                    <Button color="error" onClick={() => setDeleteOpen(true)}>Delete group</Button>
                    <Button variant="contained" onClick={onClose}>Done</Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={deleteOpen}
                title="Delete group"
                message={`Delete "${group.name}" with all its messages? This can't be undone.`}
                confirmText="Delete"
                danger
                onConfirm={async () => {
                    await run(() => friendStore.deleteGroup(group.id));
                    onClose();
                    navigate("/home");
                }}
                onClose={() => setDeleteOpen(false)}
            />
        </>
    );
});
