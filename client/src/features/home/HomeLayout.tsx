import { Badge, Box, IconButton, Tooltip, Typography } from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { useStore } from "../../app/stores/store";
import { panelSx } from "../../app/theme/theme";
import Sidebar, { SidebarItem, SidebarSection } from "../../app/layout/Sidebar";
import UserAvatar from "../../app/common/UserAvatar";
import { colorFromString } from "../../app/utils/helpers";
import CreateGroupDialog from "./CreateGroupDialog";

export default observer(function HomeLayout() {
    const { friendStore, chatStore } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { friendId, groupId } = useParams();
    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    return (
        <>
            <Sidebar header={<Typography sx={{ fontWeight: 700 }}>Home</Typography>}>
                <SidebarItem selected={location.pathname === "/home"} onClick={() => navigate("/home")}>
                    <PeopleAltRoundedIcon fontSize="small" />
                    <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>Friends</Typography>
                    <UnreadBadge count={friendStore.requests.length} />
                </SidebarItem>

                <SidebarSection
                    title="Group chats"
                    action={
                        <Tooltip title="Create group">
                            <IconButton size="small" onClick={() => setCreateGroupOpen(true)} sx={{ color: "text.secondary" }}>
                                <AddRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    }
                />
                {friendStore.groups.length === 0 && <EmptyHint text="No groups yet" />}
                {friendStore.groups.map(group => (
                    <SidebarItem key={group.id} selected={group.id === groupId} onClick={() => navigate(`/home/group/${group.id}`)}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "6px",
                                flexShrink: 0,
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
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.92rem" }}>{group.name}</Typography>
                            <Typography noWrap sx={{ fontSize: "0.72rem", color: "text.disabled" }}>
                                {group.members.length} members
                            </Typography>
                        </Box>
                        <UnreadBadge count={chatStore.unreadGroups.get(group.id) ?? 0} />
                    </SidebarItem>
                ))}

                <SidebarSection title="Direct messages" />
                {friendStore.friends.length === 0 && <EmptyHint text="Add some friends to start chatting" />}
                {friendStore.friends.map(friend => (
                    <SidebarItem key={friend.id} selected={friend.id === friendId} onClick={() => navigate(`/home/dm/${friend.id}`)}>
                        <UserAvatar id={friend.id} name={friend.username} image={friend.image} size={32} online={friend.isOnline} />
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.92rem", flexGrow: 1 }}>{friend.username}</Typography>
                        <UnreadBadge count={chatStore.unreadPrivate.get(friend.id) ?? 0} />
                    </SidebarItem>
                ))}
            </Sidebar>

            <Box sx={{ ...panelSx, flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <Outlet />
            </Box>

            <CreateGroupDialog open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} />
        </>
    );
});

function UnreadBadge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <Badge
            badgeContent={count > 99 ? "99+" : count}
            color="error"
            sx={{ mr: 1.5, "& .MuiBadge-badge": { fontWeight: 700 } }}
        />
    );
}

function EmptyHint({ text }: { text: string }) {
    return <Typography sx={{ px: 1.25, py: 0.5, fontSize: "0.8rem", color: "text.disabled" }}>{text}</Typography>;
}
