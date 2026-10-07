import { Box, IconButton, InputBase, Link, Tooltip, Typography } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import MessageShell, { MessageText } from "../../app/common/MessageShell";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { Attachment, Message } from "../../app/models/message";
import { fileUrl, formatFileSize, getErrorMessage } from "../../app/utils/helpers";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "👀"];

interface Props {
    message: Message;
    compact: boolean;
    canDelete: boolean;
}

export default observer(function ChannelMessage({ message, compact, canDelete }: Props) {
    const { chatStore, userStore, commonStore } = useStore();
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(message.content);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const myId = userStore.user?.id;
    const isMine = message.senderId === myId;

    const reactionGroups = new Map<string, { count: number; mine: boolean }>();
    message.reactions.forEach(r => {
        const group = reactionGroups.get(r.reactionType) ?? { count: 0, mine: false };
        group.count++;
        if (r.userId === myId) group.mine = true;
        reactionGroups.set(r.reactionType, group);
    });

    const react = (emoji: string) => {
        chatStore.toggleReaction(message, emoji).catch(error => commonStore.showError(getErrorMessage(error)));
    };

    const saveEdit = async () => {
        const text = editText.trim();
        if (!text) return;
        try {
            await chatStore.editMessage(message.messageId, text);
            setEditing(false);
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Could not edit the message"));
        }
    };

    const actions = (
        <>
            {QUICK_REACTIONS.map(emoji => (
                <IconButton key={emoji} size="small" onClick={() => react(emoji)} sx={{ fontSize: "1rem", width: 32, height: 32 }}>
                    {emoji}
                </IconButton>
            ))}
            {isMine && !editing && (
                <Tooltip title="Edit">
                    <IconButton
                        size="small"
                        onClick={() => {
                            setEditText(message.content);
                            setEditing(true);
                        }}
                        sx={{ color: "text.secondary" }}
                    >
                        <EditRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {canDelete && (
                <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => setDeleteOpen(true)} sx={{ color: "text.secondary", "&:hover": { color: colors.danger } }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </>
    );

    return (
        <>
            <MessageShell
                senderId={message.senderId}
                senderName={message.senderName}
                senderImage={message.senderImage}
                date={message.createdAt}
                compact={compact}
                edited={message.isEdited && !editing}
                isMine={isMine}
                actions={editing ? undefined : actions}
                footer={
                    <>
                        {editing && (
                            <Box sx={{ my: 0.5, width: 420, maxWidth: "100%" }}>
                                <InputBase
                                    autoFocus
                                    multiline
                                    fullWidth
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            saveEdit();
                                        }
                                        if (e.key === "Escape") setEditing(false);
                                    }}
                                    sx={{ bgcolor: colors.input, borderRadius: 2, px: 1.5, py: 1, fontSize: "0.95rem" }}
                                />
                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", mt: 0.5 }}>
                                    escape to <Link component="button" onClick={() => setEditing(false)}>cancel</Link> • enter to{" "}
                                    <Link component="button" onClick={saveEdit}>save</Link>
                                </Typography>
                            </Box>
                        )}
                        {message.attachments.length > 0 && (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.75, alignItems: isMine ? "flex-end" : "flex-start" }}>
                                {message.attachments.map(attachment => (
                                    <AttachmentView key={attachment.attachmentId} attachment={attachment} />
                                ))}
                            </Box>
                        )}

                        {reactionGroups.size > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                                {Array.from(reactionGroups.entries()).map(([emoji, group]) => (
                                    <Box
                                        key={emoji}
                                        onClick={() => react(emoji)}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 99,
                                            cursor: "pointer",
                                            fontSize: "0.9rem",
                                            border: `1px solid ${group.mine ? colors.accent : colors.border}`,
                                            bgcolor: group.mine ? colors.selected : colors.elevated,
                                            "&:hover": { borderColor: colors.accent },
                                        }}
                                    >
                                        <span>{emoji}</span>
                                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: group.mine ? colors.accent : "text.secondary" }}>
                                            {group.count}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </>
                }
            >
                {!editing && message.content ? <MessageText text={message.content} /> : undefined}
            </MessageShell>

            <ConfirmDialog
                open={deleteOpen}
                title="Delete message"
                message="Are you sure you want to delete this message?"
                confirmText="Delete"
                danger
                onConfirm={async () => {
                    try {
                        await chatStore.deleteMessage(message);
                    } catch (error) {
                        commonStore.showError(getErrorMessage(error));
                    }
                }}
                onClose={() => setDeleteOpen(false)}
            />
        </>
    );
});

function AttachmentView({ attachment }: { attachment: Attachment }) {
    const url = fileUrl(attachment.attachmentUrl);

    if (attachment.attachmentType === "Image") {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer">
                <Box
                    component="img"
                    src={url}
                    alt={attachment.fileName}
                    loading="lazy"
                    sx={{ maxWidth: 400, maxHeight: 320, borderRadius: 2, display: "block", border: `1px solid ${colors.border}` }}
                />
            </a>
        );
    }

    if (attachment.attachmentType === "Video") {
        return <Box component="video" src={url} controls sx={{ maxWidth: 420, maxHeight: 320, borderRadius: 2 }} />;
    }

    return (
        <Box
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.fileName}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                minWidth: 260,
                borderRadius: 2,
                textDecoration: "none",
                bgcolor: colors.elevated,
                border: `1px solid ${colors.border}`,
                "&:hover": { borderColor: colors.accent },
            }}
        >
            <InsertDriveFileRoundedIcon sx={{ color: colors.accent, fontSize: 32 }} />
            <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700, color: colors.accent, maxWidth: 260 }}>{attachment.fileName}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{formatFileSize(attachment.size)}</Typography>
            </Box>
        </Box>
    );
}
