import { Box, Button, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import { useStore } from "../stores/store";
import { colors } from "../theme/theme";
import Logo from "./Logo";

const features = [
    {
        title: "Servers and channels",
        text: "Create a server, invite people with a link and split the conversation into text and voice channels. Owners can kick and ban members.",
    },
    {
        title: "Friends and direct messages",
        text: "Send friend requests, chat one on one or start a group chat. You can see who is online and get unread counters.",
    },
    {
        title: "Voice",
        text: "Join a voice channel or call a friend straight from the browser. Audio goes peer to peer over WebRTC.",
    },
    {
        title: "Messages",
        text: "Edit and delete messages, react with emoji, attach images and files, search through the history.",
    },
];

const stack = [
    { label: "Backend", items: "ASP.NET Core (.NET 10), Entity Framework Core, SQLite, ASP.NET Identity, JWT" },
    { label: "Real-time", items: "SignalR for messages, presence and call signaling, WebRTC for audio" },
    { label: "Frontend", items: "React 19, TypeScript, Vite, MobX, React Router, Material UI" },
    { label: "Deployment", items: "Docker, single container serving the API and the built client" },
];

export default observer(function LandingPage() {
    const { userStore } = useStore();
    const appLink = userStore.isLoggedIn ? "/home" : "/login";

    return (
        <Box sx={{ height: "100vh", overflowY: "auto", bgcolor: colors.main }}>
            <Box component="header" sx={{ borderBottom: `1px solid ${colors.border}` }}>
                <Box sx={{ maxWidth: 960, mx: "auto", px: 3, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Logo size={28} />
                        <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Banter</Typography>
                    </Box>
                    <Button component={Link} to={appLink} variant="outlined" color="inherit" sx={{ borderColor: colors.border }}>
                        {userStore.isLoggedIn ? "Open app" : "Log in"}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ maxWidth: 960, mx: "auto", px: 3 }}>
                <Box component="section" sx={{ pt: { xs: 6, md: 9 }, pb: 6, maxWidth: 640 }}>
                    <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "2.6rem" }, lineHeight: 1.2 }}>
                        A chat app for small groups of friends
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "1.1rem", lineHeight: 1.6, mt: 2 }}>
                        Banter is a browser chat with servers, text and voice channels, direct messages and calls.
                        It's a project I built to learn how real-time apps work end to end, from the database
                        to WebSockets and WebRTC.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5, mt: 4, flexWrap: "wrap" }}>
                        <Button component={Link} to={appLink} state={{ register: true }} variant="contained" size="large">
                            {userStore.isLoggedIn ? "Open Banter" : "Create an account"}
                        </Button>
                        {!userStore.isLoggedIn && (
                            <Button component={Link} to="/login" size="large" color="inherit">
                                I already have one
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box
                    component="img"
                    src="/screenshot.jpg"
                    alt="Banter server view with channels, messages and member list"
                    sx={{
                        display: "block",
                        width: "100%",
                        borderRadius: "8px",
                        border: `1px solid ${colors.border}`,
                        boxShadow: "0 8px 24px rgba(20,24,35,0.08)",
                    }}
                />

                <Box component="section" sx={{ py: 8 }}>
                    <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1.4rem", mb: 3 }}>
                        What you can do
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 6, rowGap: 3.5 }}>
                        {features.map(feature => (
                            <Box key={feature.title}>
                                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{feature.title}</Typography>
                                <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>{feature.text}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box component="section" sx={{ pb: 8 }}>
                    <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1.4rem", mb: 3 }}>
                        How it's built
                    </Typography>
                    <Box sx={{ border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
                        {stack.map((row, index) => (
                            <Box
                                key={row.label}
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: { xs: 0.25, sm: 2 },
                                    px: 2.5,
                                    py: 1.75,
                                    borderTop: index === 0 ? "none" : `1px solid ${colors.border}`,
                                }}
                            >
                                <Typography sx={{ fontWeight: 600, width: { sm: 140 }, flexShrink: 0 }}>{row.label}</Typography>
                                <Typography sx={{ color: "text.secondary" }}>{row.items}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            <Box component="footer" sx={{ borderTop: `1px solid ${colors.border}`, bgcolor: colors.rail }}>
                <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 3 }}>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
                        Banter is a portfolio project. Data you put here may be reset at any time.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
});
