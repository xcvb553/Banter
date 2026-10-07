import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import TagRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import type { ChannelType } from "../../app/models/server";
import { getErrorMessage } from "../../app/utils/helpers";

interface Props {
    serverId: string;
    type: ChannelType | null;
    onClose: () => void;
}

export default function CreateChannelDialog({ serverId, type, onClose }: Props) {
    const { serverStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [channelType, setChannelType] = useState<ChannelType>(type ?? "Text");
    const [name, setName] = useState("");
    const [topic, setTopic] = useState("");
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        setSaving(true);
        try {
            const channel = await serverStore.createChannel(serverId, {
                name: name.trim(),
                channelType,
                topic: channelType === "Text" && topic.trim() ? topic.trim() : null,
            });
            onClose();
            if (channel.channelType === "Text") navigate(`/server/${serverId}/${channel.channelId}`);
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Could not create the channel"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={!!type} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Create channel</DialogTitle>
            <DialogContent>
                <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={channelType}
                    onChange={(_, value) => value && setChannelType(value)}
                    sx={{ mt: 1, mb: 2 }}
                >
                    <ToggleButton value="Text" sx={{ gap: 1, fontWeight: 700 }}>
                        <TagRoundedIcon fontSize="small" /> Text
                    </ToggleButton>
                    <ToggleButton value="Voice" sx={{ gap: 1, fontWeight: 700 }}>
                        <VolumeUpRoundedIcon fontSize="small" /> Voice
                    </ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Channel name"
                        placeholder={channelType === "Text" ? "new-channel" : "Chill zone"}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                    />
                    {channelType === "Text" && (
                        <TextField
                            fullWidth
                            label="Topic (optional)"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            slotProps={{ htmlInput: { maxLength: 250 } }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button color="inherit" onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}
