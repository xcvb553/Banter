import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import ChatHeader from "../../app/common/ChatHeader";
import ChatComposer from "../../app/common/ChatComposer";
import MessageList from "../../app/common/MessageList";
import UserAvatar from "../../app/common/UserAvatar";
import EmptyState from "../../app/common/EmptyState";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import SearchBox from "../chat/SearchBox";
import TextMessageList, { type SimpleMessage } from "../chat/TextMessageList";
import useActiveChat from "../chat/useActiveChat";
import GroupSettingsDialog from "./GroupSettingsDialog";
import { colorFromString, getErrorMessage } from "../../app/utils/helpers";

export default observer(function GroupChat() {
    const { groupId } = useParams<{ groupId: string }>();
    const { friendStore, chatStore, userStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [showMembers, setShowMembers] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);

    const group = friendStore.getGroup(groupId);
    const me = userStore.user!;

    useActiveChat("group", group ? groupId : undefined);

    const loadedGroupId = group?.id;
    useEffect(() => {
        if (loadedGroupId) chatStore.loadGroupMessages(loadedGroupId);
        setSearch("");
    }, [loadedGroupId, chatStore]);

    if (!group) {
        if (!friendStore.loaded) return null;
        return (
            <EmptyState icon={<SearchOffRoundedIcon fontSize="inherit" />} title="Group not found" text="It was deleted or you are not a member anymore.">
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/home")}>Back home</Button>
            </EmptyState>
        );
    }

    const isCreator = group.creatorId === me.id;
    const allMessages = chatStore.groupMessages.get(group.id) ?? [];
    const messages: SimpleMessage[] = allMessages
        .filter(m => !search || m.content.toLowerCase().includes(search.toLowerCase()))
        .map(m => ({
            messageId: m.messageId,
            senderId: m.senderId,
            senderName: m.senderName,
            senderImage: m.senderImage,
            content: m.content,
            date: m.sentAt,
        }));

    const handleLeave = async () => {
        try {
            await friendStore.leaveGroup(group.id, me.id);
            navigate("/home");
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    return (
        <Box sx={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
            <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
                <ChatHeader>
                    <Box
                        sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            color: "#fff",
                            bgcolor: colorFromString(group.id),
                        }}
                    >
                        {group.name[0]?.toUpperCase()}
                    </Box>
                    <Typography noWrap sx={{ fontWeight: 700, flexGrow: 1 }}>{group.name}</Typography>
                    <SearchBox value={search} onChange={setSearch} />
                    <Tooltip title={showMembers ? "Hide members" : "Show members"}>
                        <IconButton onClick={() => setShowMembers(!showMembers)} sx={{ color: showMembers ? "text.primary" : "text.secondary" }}>
                            <GroupRoundedIcon />
                        </IconButton>
                    </Tooltip>
                    {isCreator ? (
                        <Tooltip title="Group settings">
                            <IconButton onClick={() => setSettingsOpen(true)} sx={{ color: "text.secondary" }}>
                                <SettingsRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Leave group">
                            <IconButton onClick={() => setLeaveOpen(true)} sx={{ color: "text.secondary", "&:hover": { color: colors.danger } }}>
                                <LogoutRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </ChatHeader>

                <MessageList
                    key={group.id}
                    firstKey={allMessages[0]?.messageId}
                    lastKey={allMessages[allMessages.length - 1]?.messageId}
                    hasMore={chatStore.canLoadMore("group", group.id)}
                    loading={chatStore.isLoading("group", group.id)}
                    onLoadMore={() => chatStore.loadGroupMessages(group.id, true)}
                    beginningText={search ? undefined : `Welcome to ${group.name}! This is the start of the group.`}
                >
                    <TextMessageList messages={messages} searching={!!search} />
                </MessageList>

                <ChatComposer placeholder={`Message ${group.name}`} onSend={content => chatStore.sendGroupMessage(group.id, content)} />
            </Box>

            {showMembers && (
                <Box sx={{ width: 240, flexShrink: 0, bgcolor: colors.sidebar, borderLeft: `1px solid ${colors.border}`, overflowY: "auto", p: 1.5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.disabled", px: 1, pb: 1 }}>
                        Members — {group.members.length}
                    </Typography>
                    {group.members.map(member => (
                        <Box key={member.id} sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1, py: 0.75, borderRadius: 1, "&:hover": { bgcolor: colors.hover } }}>
                            <UserAvatar id={member.id} name={member.username} image={member.image} size={32} online={member.isOnline} />
                            <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.9rem", opacity: member.isOnline ? 1 : 0.6 }}>
                                {member.username}
                            </Typography>
                            {member.id === group.creatorId && (
                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>owner</Typography>
                            )}
                        </Box>
                    ))}
                </Box>
            )}

            {isCreator && <GroupSettingsDialog open={settingsOpen} group={group} onClose={() => setSettingsOpen(false)} />}

            <ConfirmDialog
                open={leaveOpen}
                title="Leave group"
                message={`Are you sure you want to leave ${group.name}?`}
                confirmText="Leave"
                danger
                onConfirm={handleLeave}
                onClose={() => setLeaveOpen(false)}
            />
        </Box>
    );
});
