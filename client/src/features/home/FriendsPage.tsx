import { Badge, Box, Button, IconButton, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import ChatHeader from "../../app/common/ChatHeader";
import UserAvatar from "../../app/common/UserAvatar";
import EmptyState from "../../app/common/EmptyState";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { User } from "../../app/models/user";
import { getErrorMessage } from "../../app/utils/helpers";

type FriendsTab = "online" | "all" | "pending" | "add";

export default observer(function FriendsPage() {
    const { friendStore, voiceStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<FriendsTab>("online");
    const [friendToRemove, setFriendToRemove] = useState<User | null>(null);

    const list = tab === "online" ? friendStore.onlineFriends : friendStore.friends;

    const handleCall = async (friend: User) => {
        await voiceStore.makeCall(friend.id);
        navigate(`/home/dm/${friend.id}`);
    };

    return (
        <>
            <ChatHeader>
                <PeopleAltRoundedIcon sx={{ color: "text.secondary" }} />
                <Typography sx={{ fontWeight: 700, mr: 2 }}>Friends</Typography>
                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, fontWeight: 700 } }}
                >
                    <Tab value="online" label="Online" />
                    <Tab value="all" label="All" />
                    <Tab
                        value="pending"
                        label={
                            <Badge color="error" badgeContent={friendStore.requests.length} sx={{ "& .MuiBadge-badge": { right: -12 } }}>
                                Pending
                            </Badge>
                        }
                    />
                    <Tab value="add" label="Add friend" sx={{ color: colors.online }} />
                </Tabs>
            </ChatHeader>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 3, py: 2 }}>
                {tab === "add" && <AddFriendForm />}

                {tab === "pending" && (
                    <>
                        <ListTitle text={`Pending — ${friendStore.requests.length}`} />
                        {friendStore.requests.length === 0 && (
                            <EmptyState title="No pending requests" text="When somebody adds you, the request will show up here." />
                        )}
                        {friendStore.requests.map(request => (
                            <PersonRow key={request.requestId} id={request.senderId} name={request.userName} image={request.image} subtitle="Incoming friend request">
                                <ActionButton title="Accept" color={colors.online} onClick={() => friendStore.acceptRequest(request).catch(e => commonStore.showError(getErrorMessage(e)))}>
                                    <CheckRoundedIcon />
                                </ActionButton>
                                <ActionButton title="Ignore" color={colors.danger} onClick={() => friendStore.rejectRequest(request).catch(e => commonStore.showError(getErrorMessage(e)))}>
                                    <CloseRoundedIcon />
                                </ActionButton>
                            </PersonRow>
                        ))}
                    </>
                )}

                {(tab === "online" || tab === "all") && (
                    <>
                        <ListTitle text={`${tab === "online" ? "Online" : "All friends"} — ${list.length}`} />
                        {list.length === 0 && (
                            <EmptyState
                                icon={<PeopleAltRoundedIcon fontSize="inherit" />}
                                title={tab === "online" ? "Nobody is online" : "No friends yet"}
                                text={tab === "online" ? "Your friends are offline right now." : "Use the 'Add friend' tab to find people by their username."}
                            />
                        )}
                        {list.map(friend => (
                            <PersonRow
                                key={friend.id}
                                id={friend.id}
                                name={friend.username}
                                image={friend.image}
                                online={friend.isOnline}
                                subtitle={friend.isOnline ? "Online" : "Offline"}
                                onClick={() => navigate(`/home/dm/${friend.id}`)}
                            >
                                <ActionButton title="Message" onClick={() => navigate(`/home/dm/${friend.id}`)}>
                                    <ChatBubbleRoundedIcon fontSize="small" />
                                </ActionButton>
                                <ActionButton title="Call" onClick={() => handleCall(friend)} disabled={!friend.isOnline || voiceStore.isInCall}>
                                    <CallRoundedIcon fontSize="small" />
                                </ActionButton>
                                <ActionButton title="Remove friend" color={colors.danger} onClick={() => setFriendToRemove(friend)}>
                                    <PersonRemoveRoundedIcon fontSize="small" />
                                </ActionButton>
                            </PersonRow>
                        ))}
                    </>
                )}
            </Box>

            <ConfirmDialog
                open={!!friendToRemove}
                title="Remove friend"
                message={`Are you sure you want to remove ${friendToRemove?.username} from your friends?`}
                confirmText="Remove"
                danger
                onConfirm={async () => {
                    if (friendToRemove) await friendStore.removeFriend(friendToRemove.id);
                }}
                onClose={() => setFriendToRemove(null)}
            />
        </>
    );
});

const AddFriendForm = observer(function AddFriendForm() {
    const { friendStore, commonStore } = useStore();
    const [userName, setUserName] = useState("");
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userName.trim()) return;
        setSending(true);
        try {
            await friendStore.sendRequest(userName.trim());
            commonStore.showSuccess(`Friend request sent to ${userName.trim()}`);
            setUserName("");
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Could not send the request"));
        } finally {
            setSending(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 640 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Add friend</Typography>
            <Typography sx={{ color: "text.secondary", mb: 2 }}>You can add friends with their username.</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 1 }}>
                <TextField
                    fullWidth
                    autoFocus
                    placeholder="Enter a username"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                />
                <Button type="submit" variant="contained" disabled={!userName.trim() || sending} sx={{ whiteSpace: "nowrap" }}>
                    Send request
                </Button>
            </Box>
        </Box>
    );
});

function ListTitle({ text }: { text: string }) {
    return (
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.disabled", mb: 1 }}>
            {text}
        </Typography>
    );
}

interface PersonRowProps {
    id: string;
    name: string;
    image: string | null;
    subtitle: string;
    online?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}

function PersonRow({ id, name, image, subtitle, online, onClick, children }: PersonRowProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderTop: `1px solid ${colors.border}`,
                cursor: onClick ? "pointer" : "default",
                "&:hover": { bgcolor: colors.hover },
            }}
        >
            <UserAvatar id={id} name={name} image={image} size={38} online={online} dotBorderColor={colors.main} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 700 }}>{name}</Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{subtitle}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }} onClick={e => e.stopPropagation()}>
                {children}
            </Box>
        </Box>
    );
}

interface ActionButtonProps {
    title: string;
    color?: string;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function ActionButton({ title, color, disabled, onClick, children }: ActionButtonProps) {
    return (
        <Tooltip title={title}>
            <span>
                <IconButton
                    onClick={onClick}
                    disabled={disabled}
                    sx={{ bgcolor: colors.elevated, color: "text.secondary", "&:hover": { color: color ?? "text.primary", bgcolor: colors.input } }}
                >
                    {children}
                </IconButton>
            </span>
        </Tooltip>
    );
}
