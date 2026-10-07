import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { observer } from "mobx-react-lite";
import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import UserAvatar from "../../app/common/UserAvatar";
import { getErrorMessage } from "../../app/utils/helpers";

export default observer(function SettingsPage() {
    const { userStore, commonStore } = useStore();
    const navigate = useNavigate();
    const user = userStore.user!;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState({ username: user.username, email: user.email, bio: user.bio ?? "" });
    const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [busy, setBusy] = useState(false);

    const profileChanged = profile.username !== user.username || profile.email !== user.email || profile.bio !== (user.bio ?? "");

    const run = async (action: () => Promise<void>, successText?: string) => {
        setBusy(true);
        try {
            await action();
            if (successText) commonStore.showSuccess(successText);
        } catch (error) {
            commonStore.showError(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            commonStore.showError("Avatar can have max 2 MB");
            return;
        }
        run(() => userStore.uploadAvatar(file), "Avatar updated");
    };

    const handleChangePassword = () => {
        if (passwords.next !== passwords.confirm) {
            commonStore.showError("New passwords do not match");
            return;
        }
        run(async () => {
            await userStore.changePassword(passwords.current, passwords.next);
            setPasswords({ current: "", next: "", confirm: "" });
        }, "Password changed");
    };

    const handleLogout = () => {
        userStore.logout();
        navigate("/");
    };

    const handleDeleteAccount = () => {
        run(async () => {
            await userStore.deleteAccount(deletePassword);
            navigate("/");
        });
    };

    return (
        <Box sx={{ height: "100vh", overflowY: "auto", bgcolor: colors.rail }}>
            <Box sx={{ maxWidth: 720, mx: "auto", px: 3, py: 5, position: "relative" }}>
                <Tooltip title="Close">
                    <IconButton onClick={() => navigate(-1)} sx={{ position: "absolute", right: 16, top: 32, border: `1px solid ${colors.border}` }}>
                        <CloseRoundedIcon />
                    </IconButton>
                </Tooltip>

                <Typography sx={{ fontWeight: 700, fontSize: "1.4rem", mb: 3 }}>My account</Typography>

                <Box sx={{ borderRadius: "8px", overflow: "hidden", bgcolor: colors.main, border: `1px solid ${colors.border}` }}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Box sx={{ position: "relative", borderRadius: "50%" }}>
                                <UserAvatar id={user.id} name={user.username} image={user.image} size={72} />
                                <Tooltip title="Change avatar">
                                    <IconButton
                                        size="small"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={busy}
                                        sx={{ position: "absolute", right: -4, bottom: -4, bgcolor: colors.accent, color: "#fff", "&:hover": { bgcolor: colors.accentHover } }}
                                    >
                                        <PhotoCameraRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={handleAvatarSelected} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: "1.15rem" }}>{user.username}</Typography>
                                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{user.role === "Admin" ? "Administrator" : "Member"}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField label="Username" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} />
                            <TextField label="Email" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                            <TextField
                                label="About me"
                                multiline
                                minRows={2}
                                value={profile.bio}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                slotProps={{ htmlInput: { maxLength: 190 } }}
                                helperText={`${profile.bio.length}/190`}
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                                <Button
                                    color="inherit"
                                    disabled={!profileChanged}
                                    onClick={() => setProfile({ username: user.username, email: user.email, bio: user.bio ?? "" })}
                                >
                                    Reset
                                </Button>
                                <Button
                                    variant="contained"
                                    disabled={!profileChanged || busy}
                                    onClick={() => run(() => userStore.updateProfile(profile), "Profile saved")}
                                >
                                    Save changes
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <Section title="Password">
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="Current password"
                            type="password"
                            autoComplete="current-password"
                            value={passwords.current}
                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        />
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                fullWidth
                                label="New password"
                                type="password"
                                autoComplete="new-password"
                                value={passwords.next}
                                onChange={e => setPasswords({ ...passwords, next: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="Repeat new password"
                                type="password"
                                autoComplete="new-password"
                                value={passwords.confirm}
                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                            />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                variant="contained"
                                disabled={!passwords.current || passwords.next.length < 6 || busy}
                                onClick={handleChangePassword}
                            >
                                Change password
                            </Button>
                        </Box>
                    </Box>
                </Section>

                <Section title="Session">
                    <Button variant="outlined" color="inherit" startIcon={<LogoutRoundedIcon />} onClick={handleLogout}>
                        Log out
                    </Button>
                </Section>

                <Section title="Danger zone" danger>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography sx={{ fontWeight: 700 }}>Delete account</Typography>
                            <Typography sx={{ color: "text.secondary", fontSize: "0.88rem" }}>
                                Your servers, messages and friends will be removed. This can't be undone.
                            </Typography>
                        </Box>
                        <Button variant="contained" color="error" onClick={() => setDeleteOpen(true)}>
                            Delete account
                        </Button>
                    </Box>
                </Section>
            </Box>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete account</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "text.secondary", mb: 2 }}>Type your password to confirm.</Typography>
                    <TextField
                        fullWidth
                        autoFocus
                        type="password"
                        label="Password"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" disabled={!deletePassword || busy} onClick={handleDeleteAccount}>
                        Delete forever
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

function Section({ title, danger, children }: { title: string; danger?: boolean; children: ReactNode }) {
    return (
        <>
            <Divider sx={{ my: 4 }} />
            <Typography sx={{ fontWeight: 700, mb: 2, color: danger ? colors.danger : "text.primary" }}>{title}</Typography>
            <Box sx={{ p: 2.5, borderRadius: "8px", bgcolor: colors.main, border: `1px solid ${danger ? colors.danger : colors.border}` }}>
                {children}
            </Box>
        </>
    );
}
