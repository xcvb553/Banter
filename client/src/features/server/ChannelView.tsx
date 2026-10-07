import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import TagRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Navigate, useOutletContext, useParams } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import ChatHeader from "../../app/common/ChatHeader";
import ChatComposer from "../../app/common/ChatComposer";
import MessageList from "../../app/common/MessageList";
import { isSameAuthorGroup } from "../../app/utils/helpers";
import useActiveChat from "../chat/useActiveChat";
import ChannelMessage from "./ChannelMessage";
import type { ServerOutletContext } from "./ServerLayout";

export default observer(function ChannelView() {
    const { serverId, channelId } = useParams<{ serverId: string; channelId: string }>();
    const { serverStore, chatStore, userStore } = useStore();
    const { showMembers, toggleMembers } = useOutletContext<ServerOutletContext>();

    const channel = serverStore.channels.find(c => c.channelId === channelId);
    const loadedChannelId = channel?.channelId;

    useActiveChat("channel", loadedChannelId);

    useEffect(() => {
        if (loadedChannelId) chatStore.loadChannelMessages(loadedChannelId);
    }, [loadedChannelId, chatStore]);

    if (!channel) {
        if (!serverStore.loadingServer && serverStore.channels.length > 0) {
            return <Navigate to={`/server/${serverId}`} replace />;
        }
        return null;
    }

    if (channel.channelType !== "Text") {
        return <Navigate to={`/server/${serverId}`} replace />;
    }

    const messages = chatStore.channelMessages.get(channel.channelId) ?? [];
    const isOwner = serverStore.isOwner(userStore.user?.id);

    return (
        <>
            <ChatHeader>
                <TagRoundedIcon sx={{ color: "text.disabled" }} />
                <Typography noWrap sx={{ fontWeight: 700 }}>{channel.name}</Typography>
                {channel.topic && (
                    <>
                        <Box sx={{ width: "1px", height: 22, bgcolor: colors.border, mx: 0.5 }} />
                        <Typography noWrap sx={{ color: "text.secondary", fontSize: "0.88rem" }}>{channel.topic}</Typography>
                    </>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title={showMembers ? "Hide members" : "Show members"}>
                    <IconButton onClick={toggleMembers} sx={{ color: showMembers ? "text.primary" : "text.secondary" }}>
                        <GroupRoundedIcon />
                    </IconButton>
                </Tooltip>
            </ChatHeader>

            <MessageList
                key={channel.channelId}
                firstKey={messages[0]?.messageId}
                lastKey={messages[messages.length - 1]?.messageId}
                hasMore={chatStore.canLoadMore("channel", channel.channelId)}
                loading={chatStore.isLoading("channel", channel.channelId)}
                onLoadMore={() => chatStore.loadChannelMessages(channel.channelId, true)}
                beginningText={`This is the start of ${channel.name}.`}
            >
                {messages.map((message, index) => {
                    const prev = messages[index - 1];
                    return (
                        <ChannelMessage
                            key={message.messageId}
                            message={message}
                            compact={isSameAuthorGroup(
                                prev && { senderId: prev.senderId, date: prev.createdAt },
                                { senderId: message.senderId, date: message.createdAt }
                            )}
                            canDelete={isOwner || message.senderId === userStore.user?.id}
                        />
                    );
                })}
            </MessageList>

            <ChatComposer
                placeholder={`Message ${channel.name}`}
                allowFiles
                onSend={(content, files) => chatStore.sendChannelMessage(channel.channelId, content, files)}
            />
        </>
    );
});
