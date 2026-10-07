import { Box, Chip, IconButton, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tooltip, Typography } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { useStore } from "../../app/stores/store";
import { colors, panelSx } from "../../app/theme/theme";
import ChatHeader from "../../app/common/ChatHeader";
import UserAvatar from "../../app/common/UserAvatar";
import ConfirmDialog from "../../app/common/ConfirmDialog";
import type { AdminServer, AdminStats, AdminUser } from "../../app/models/admin";
import { getErrorMessage } from "../../app/utils/helpers";

type ToDelete = { kind: "user"; item: AdminUser } | { kind: "server"; item: AdminServer };

export default observer(function AdminPanel() {
    const { commonStore, serverStore } = useStore();
    const [tab, setTab] = useState<"users" | "servers">("users");
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [servers, setServers] = useState<AdminServer[]>([]);
    const [toDelete, setToDelete] = useState<ToDelete | null>(null);

    const load = useCallback(async () => {
        try {
            const [statsData, usersData, serversData] = await Promise.all([
                agent.Admin.stats(),
                agent.Admin.users(),
                agent.Admin.servers(),
            ]);
            setStats(statsData);
            setUsers(usersData);
            setServers(serversData);
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    }, [commonStore]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async () => {
        if (!toDelete) return;
        try {
            if (toDelete.kind === "user") {
                await agent.Admin.deleteUser(toDelete.item.id);
                commonStore.showSuccess(`User ${toDelete.item.username} deleted`);
            } else {
                await agent.Admin.deleteServer(toDelete.item.serverId);
                serverStore.removeServer(toDelete.item.serverId);
                commonStore.showSuccess(`Server ${toDelete.item.name} deleted`);
            }
            await load();
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        }
    };

    return (
        <Box sx={{ ...panelSx, flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <ChatHeader>
                <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>Admin panel</Typography>
                <Tooltip title="Refresh">
                    <IconButton onClick={load} sx={{ color: "text.secondary" }}>
                        <RefreshRoundedIcon />
                    </IconButton>
                </Tooltip>
            </ChatHeader>

            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
                    <StatCard label="Users" value={stats?.users} />
                    <StatCard label="Online now" value={stats?.onlineUsers} color={colors.online} />
                    <StatCard label="Servers" value={stats?.servers} />
                    <StatCard label="Messages" value={stats?.messages} />
                </Box>

                <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
                    <Tab value="users" label={`Users (${users.length})`} sx={{ fontWeight: 700 }} />
                    <Tab value="servers" label={`Servers (${servers.length})`} sx={{ fontWeight: 700 }} />
                </Tabs>

                <TableContainer sx={{ bgcolor: colors.sidebar, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                    {tab === "users" ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Joined</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right" />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <UserAvatar id={user.id} name={user.username} image={user.image} size={28} />
                                                <Typography sx={{ fontWeight: 600 }}>{user.username}</Typography>
                                                {user.isAdmin && <Chip label="Admin" size="small" color="primary" />}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: "text.secondary" }}>{user.email}</TableCell>
                                        <TableCell sx={{ color: "text.secondary" }}>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={user.isOnline ? "Online" : "Offline"}
                                                sx={{ bgcolor: user.isOnline ? "rgba(16,185,129,0.12)" : colors.input, color: user.isOnline ? colors.online : "text.secondary" }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {!user.isAdmin && (
                                                <IconButton size="small" onClick={() => setToDelete({ kind: "user", item: user })} sx={{ color: "text.secondary", "&:hover": { color: colors.danger } }}>
                                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Server</TableCell>
                                    <TableCell>Owner</TableCell>
                                    <TableCell>Members</TableCell>
                                    <TableCell>Channels</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell align="right" />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {servers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ color: "text.secondary", textAlign: "center", py: 3 }}>No servers yet</TableCell>
                                    </TableRow>
                                )}
                                {servers.map(server => (
                                    <TableRow key={server.serverId} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{server.name}</TableCell>
                                        <TableCell sx={{ color: "text.secondary" }}>{server.ownerName}</TableCell>
                                        <TableCell>{server.memberCount}</TableCell>
                                        <TableCell>{server.channelCount}</TableCell>
                                        <TableCell sx={{ color: "text.secondary" }}>{new Date(server.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => setToDelete({ kind: "server", item: server })} sx={{ color: "text.secondary", "&:hover": { color: colors.danger } }}>
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
            </Box>

            <ConfirmDialog
                open={!!toDelete}
                title={toDelete?.kind === "user" ? "Delete user" : "Delete server"}
                message={
                    toDelete?.kind === "user"
                        ? `Delete ${toDelete.item.username}? Their servers and messages will be removed too.`
                        : `Delete the server "${toDelete?.item.name}" with all its messages?`
                }
                confirmText="Delete"
                danger
                onConfirm={handleDelete}
                onClose={() => setToDelete(null)}
            />
        </Box>
    );
});

function StatCard({ label, value, color }: { label: string; value?: number; color?: string }) {
    return (
        <Box sx={{ p: 2.5, borderRadius: "8px", bgcolor: colors.sidebar, border: `1px solid ${colors.border}` }}>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", fontWeight: 600 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: "1.6rem", color: color ?? "text.primary" }}>{value ?? "–"}</Typography>
        </Box>
    );
}
