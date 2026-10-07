import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import TagRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import HeadsetOffRoundedIcon from "@mui/icons-material/HeadsetOffRounded";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors, panelSx } from "../../app/theme/theme";
import Sidebar, { SidebarItem, SidebarSection } from "../../app/layout/Sidebar";
import UserAvatar from "../../app/common/UserAvatar";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { Channel, ChannelType } from "../../app/models/server";
import { getErrorMessage } from "../../app/utils/helpers";
import ServerMenu from "./ServerMenu";
import MemberList from "./MemberList";
import CreateChannelDialog from "./CreateChannelDialog";

export interface ServerOutletContext {
    showMembers: boolean;
    toggleMembers: () => void;
}

export default observer(function ServerLayout() {
    const { serverId, channelId } = useParams<{ serverId: string; channelId: string }>();
    const { serverStore, voiceStore, userStore, commonStore } = useStore();
    const navigate = useNavigate();
    const [showMembers, setShowMembers] = useState(true);
    const [createType, setCreateType] = useState<ChannelType | null>(null);
    const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

    useEffect(() => {
        if (serverId) {
            serverStore.openServer(serverId).catch(error => commonStore.showError(getErrorMessage(error)));
        }
    }, [serverId, serverStore, commonStore]);

    useEffect(() => {
        if (serverId && voiceStore.isConnected) voiceStore.loadVoiceUsers(serverId);
    }, [serverId, voiceStore, voiceStore.isConnected]);

    useEffect(() => () => serverStore.closeServer(), [serverStore]);

    const server = serverStore.servers.find(s => s.serverId === serverId);

    if (serverStore.serversLoaded && !server) {
        return <Navigate to="/home" replace />;
    }

    const isOwner = serverStore.isOwner(userStore.user?.id);

    const handleVoiceClick = (channel: Channel) => {
        if (voiceStore.currentChannelId === channel.channelId) return;
        voiceStore.joinVoiceChannel(channel);
    };

    const handleDeleteChannel = async () => {
        if (!channelToDelete) return;
        try {
            await serverStore.deleteChannel(channelToDelete.channelId);
            if (channelToDelete.channelId === channelId) navigate(`/server/${serverId}`);
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    const addButton = (type: ChannelType) =>
        isOwner && (
            <Tooltip title={`Create ${type.toLowerCase()} channel`}>
                <IconButton size="small" onClick={() => setCreateType(type)} sx={{ color: "text.secondary" }}>
                    <AddRoundedIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        );

    const deleteButton = (channel: Channel) =>
        isOwner && (
            <IconButton
                className="row-actions"
                size="small"
                onClick={e => {
                    e.stopPropagation();
                    setChannelToDelete(channel);
                }}
                sx={{ opacity: 0, color: "text.secondary", p: 0.25, "&:hover": { color: colors.danger } }}
            >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
        );

    return (
        <>
            <Sidebar header={server ? <ServerMenu server={server} isOwner={isOwner} onCreateChannel={() => setCreateType("Text")} /> : null}>
                {serverStore.loadingServer && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                        <CircularProgress size={22} />
                    </Box>
                )}

                <SidebarSection title="Channels" action={addButton("Text")} />
                {serverStore.textChannels.map(channel => (
                    <SidebarItem
                        key={channel.channelId}
                        selected={channel.channelId === channelId}
                        onClick={() => navigate(`/server/${serverId}/${channel.channelId}`)}
                    >
                        <TagRoundedIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.92rem", flexGrow: 1 }}>{channel.name}</Typography>
                        {deleteButton(channel)}
                    </SidebarItem>
                ))}

                <SidebarSection title="Voice rooms" action={addButton("Voice")} />
                {serverStore.voiceChannels.map(channel => {
                    const users = serverStore.voiceUsers.get(channel.channelId) ?? [];
                    const connected = voiceStore.currentChannelId === channel.channelId;
                    return (
                        <Box key={channel.channelId}>
                            <SidebarItem selected={connected} onClick={() => handleVoiceClick(channel)}>
                                <VolumeUpRoundedIcon sx={{ fontSize: 20, color: connected ? colors.online : "text.disabled" }} />
                                <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.92rem", flexGrow: 1 }}>{channel.name}</Typography>
                                {deleteButton(channel)}
                            </SidebarItem>
                            {users.map(user => (
                                <Box key={user.id} sx={{ display: "flex", alignItems: "center", gap: 1, pl: 4.5, pr: 1, py: 0.4 }}>
                                    <UserAvatar id={user.id} name={user.username} image={user.image} size={22} />
                                    <Typography noWrap sx={{ fontSize: "0.85rem", color: "text.secondary", flexGrow: 1 }}>{user.username}</Typography>
                                    {user.isMuted && <MicOffRoundedIcon sx={{ fontSize: 15, color: colors.danger }} />}
                                    {user.isDeafened && <HeadsetOffRoundedIcon sx={{ fontSize: 15, color: colors.danger }} />}
                                </Box>
                            ))}
                        </Box>
                    );
                })}
            </Sidebar>

            <Box sx={{ ...panelSx, flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <Outlet context={{ showMembers, toggleMembers: () => setShowMembers(!showMembers) } satisfies ServerOutletContext} />
            </Box>

            {showMembers && <MemberList />}

            {serverId && (
                <CreateChannelDialog
                    key={createType ?? "closed"}
                    serverId={serverId}
                    type={createType}
                    onClose={() => setCreateType(null)}
                />
            )}

            <ConfirmDialog
                open={!!channelToDelete}
                title="Delete channel"
                message={`Delete ${channelToDelete?.name}? All messages in it will be lost.`}
                confirmText="Delete"
                danger
                onConfirm={handleDeleteChannel}
                onClose={() => setChannelToDelete(null)}
            />
        </>
    );
});
