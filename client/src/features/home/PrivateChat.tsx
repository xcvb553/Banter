import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import CallEndRoundedIcon from "@mui/icons-material/CallEndRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
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
import SearchBox from "../chat/SearchBox";
import TextMessageList, { type SimpleMessage } from "../chat/TextMessageList";
import useActiveChat from "../chat/useActiveChat";

export default observer(function PrivateChat() {
    const { friendId } = useParams<{ friendId: string }>();
    const { friendStore, chatStore, userStore, voiceStore } = useStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const friend = friendStore.getFriend(friendId);
    const me = userStore.user!;

    useActiveChat("private", friend ? friendId : undefined);

    const loadedFriendId = friend?.id;
    useEffect(() => {
        if (loadedFriendId) chatStore.loadPrivateMessages(loadedFriendId);
        setSearch("");
    }, [loadedFriendId, chatStore]);

    if (!friend) {
        if (!friendStore.loaded) return null;
        return (
            <EmptyState icon={<PersonOffRoundedIcon fontSize="inherit" />} title="This person is not your friend" text="You can only send messages to your friends.">
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/home")}>Back to friends</Button>
            </EmptyState>
        );
    }

    const allMessages = chatStore.privateMessages.get(friend.id) ?? [];
    const messages: SimpleMessage[] = allMessages
        .filter(m => !search || m.content.toLowerCase().includes(search.toLowerCase()))
        .map(m => {
            const isMine = m.senderId === me.id;
            return {
                messageId: m.messageId,
                senderId: m.senderId,
                senderName: isMine ? me.username : friend.username,
                senderImage: isMine ? me.image : friend.image,
                content: m.content,
                date: m.sentAt,
            };
        });

    const inCallWithFriend = voiceStore.isInCall && voiceStore.otherCallUserId === friend.id;

    return (
        <>
            <ChatHeader>
                <UserAvatar id={friend.id} name={friend.username} image={friend.image} size={30} online={friend.isOnline} dotBorderColor={colors.main} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }}>{friend.username}</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: friend.isOnline ? colors.online : "text.disabled" }}>
                        {friend.isOnline ? "Online" : "Offline"}
                    </Typography>
                </Box>
                <SearchBox value={search} onChange={setSearch} />
                {inCallWithFriend ? (
                    <Tooltip title="Hang up">
                        <IconButton onClick={voiceStore.endCall} sx={{ color: colors.danger }}>
                            <CallEndRoundedIcon />
                        </IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title={friend.isOnline ? "Start a voice call" : "Friend is offline"}>
                        <span>
                            <IconButton
                                onClick={() => voiceStore.makeCall(friend.id)}
                                disabled={voiceStore.isInCall || !friend.isOnline}
                                sx={{ color: "text.secondary", "&:hover": { color: colors.online } }}
                            >
                                <CallRoundedIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
            </ChatHeader>

            <MessageList
                key={friend.id}
                firstKey={allMessages[0]?.messageId}
                lastKey={allMessages[allMessages.length - 1]?.messageId}
                hasMore={chatStore.canLoadMore("private", friend.id)}
                loading={chatStore.isLoading("private", friend.id)}
                onLoadMore={() => chatStore.loadPrivateMessages(friend.id, true)}
                beginningText={search ? undefined : `This is the beginning of your conversation with ${friend.username}.`}
            >
                <TextMessageList messages={messages} searching={!!search} />
            </MessageList>

            <ChatComposer
                placeholder={`Message @${friend.username}`}
                onSend={content => chatStore.sendPrivateMessage(friend.id, content)}
            />
        </>
    );
});
