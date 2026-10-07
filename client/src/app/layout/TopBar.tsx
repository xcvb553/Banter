import { Badge, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { observer } from "mobx-react-lite";
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useStore } from "../stores/store";
import { colors } from "../theme/theme";
import { colorFromString } from "../utils/helpers";
import Logo from "./Logo";
import UserAvatar from "../common/UserAvatar";
import JoinServerDialog from "../../features/server/JoinServerDialog";

export default observer(function TopBar() {
    const { serverStore, friendStore, chatStore, userStore } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const user = userStore.user;

    const homeBadge = chatStore.totalUnread + friendStore.requests.length;

    const handleLogout = () => {
        setMenuAnchor(null);
        userStore.logout();
        navigate("/");
    };

    return (
        <Box sx={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: 2, px: 2, bgcolor: colors.main, borderBottom: `1px solid ${colors.border}` }}>
            <Box
                onClick={() => navigate("/home")}
                sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flexShrink: 0, pr: 1 }}
            >
                <Logo size={26} />
                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>Banter</Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flexGrow: 1,
                    minWidth: 0,
                    overflowX: "auto",
                    py: 1,
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                <NavPill
                    active={location.pathname.startsWith("/home")}
                    onClick={() => navigate("/home")}
                    icon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
                    label="Home"
                    badge={homeBadge}
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

                {serverStore.servers.map(server => (
                    <NavPill
                        key={server.serverId}
                        active={location.pathname.startsWith(`/server/${server.serverId}`)}
                        onClick={() => navigate(`/server/${server.serverId}`)}
                        icon={
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "5px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    color: "#fff",
                                    bgcolor: colorFromString(server.serverId),
                                }}
                            >
                                {server.name[0]?.toUpperCase()}
                            </Box>
                        }
                        label={server.name}
                    />
                ))}

                <Tooltip title="Create or join a server">
                    <IconButton
                        onClick={() => setDialogOpen(true)}
                        size="small" sx={{ flexShrink: 0, color: "text.secondary", "&:hover": { color: colors.accent } }}
                    >
                        <AddRoundedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {userStore.isAdmin && (
                <Tooltip title="Admin panel">
                    <IconButton
                        onClick={() => navigate("/admin")}
                        sx={{ color: location.pathname.startsWith("/admin") ? colors.accent : "text.secondary" }}
                    >
                        <AdminPanelSettingsRoundedIcon />
                    </IconButton>
                </Tooltip>
            )}

            {user && (
                <Box
                    onClick={e => setMenuAnchor(e.currentTarget)}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1,
                        py: 0.5,
                        borderRadius: "6px",
                        cursor: "pointer",
                        flexShrink: 0,
                        "&:hover": { bgcolor: colors.hover },
                    }}
                >
                    <UserAvatar id={user.id} name={user.username} image={user.image} size={28} online={chatStore.isConnected} dotBorderColor={colors.main} />
                    <Typography sx={{ fontWeight: 500, fontSize: "0.88rem" }}>{user.username}</Typography>
                </Box>
            )}

            <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { width: 220, mt: 1 } } }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{user?.username}</Typography>
                    <Typography noWrap sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{user?.email}</Typography>
                </Box>
                <Divider />
                <MenuItem
                    onClick={() => {
                        setMenuAnchor(null);
                        navigate("/settings");
                    }}
                >
                    <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
                    Settings
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: colors.danger }}>
                    <ListItemIcon sx={{ color: "inherit" }}><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                    Log out
                </MenuItem>
            </Menu>

            <JoinServerDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </Box>
    );
});

interface NavPillProps {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
    badge?: number;
}

function NavPill({ active, onClick, icon, label, badge = 0 }: NavPillProps) {
    return (
        <Badge badgeContent={badge > 99 ? "99+" : badge} color="error" invisible={badge === 0} sx={{ flexShrink: 0, "& .MuiBadge-badge": { fontWeight: 700 } }}>
            <Box
                onClick={onClick}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    height: 32,
                    borderRadius: "6px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                    fontSize: "0.88rem",
                    color: active ? colors.text : colors.textMuted,
                    bgcolor: active ? colors.input : "transparent",
                    "&:hover": { bgcolor: active ? colors.input : colors.hover, color: colors.text },
                }}
            >
                {icon}
                <Box component="span" sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</Box>
            </Box>
        </Badge>
    );
}
