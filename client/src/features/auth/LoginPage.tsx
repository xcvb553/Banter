import { Box, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useStore } from "../../app/stores/store";
import { colors } from "../../app/theme/theme";
import Logo from "../../app/layout/Logo";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default observer(function LoginPage() {
    const { userStore } = useStore();
    const location = useLocation();
    const [showLogin, setShowLogin] = useState(!(location.state as { register?: boolean } | null)?.register);

    if (userStore.isLoggedIn) {
        const from = (location.state as { from?: string } | null)?.from;
        return <Navigate to={from ?? "/home"} replace />;
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                bgcolor: colors.rail,
            }}
        >
            <Box
                sx={{
                    width: 380,
                    maxWidth: "100%",
                    p: 4,
                    borderRadius: "8px",
                    bgcolor: colors.main,
                    border: `1px solid ${colors.border}`,
                }}
            >
                <Box component={Link} to="/" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, textDecoration: "none" }}>
                    <Logo size={28} />
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>Banter</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: "1.3rem", mb: 3 }}>
                    {showLogin ? "Log in" : "Create an account"}
                </Typography>

                {showLogin ? <LoginForm /> : <RegisterForm />}

                <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mt: 3 }}>
                    {showLogin ? "Need an account? " : "Already have an account? "}
                    <Box
                        component="span"
                        onClick={() => setShowLogin(!showLogin)}
                        sx={{ color: colors.accent, fontWeight: 500, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                    >
                        {showLogin ? "Register" : "Log in"}
                    </Box>
                </Typography>
            </Box>
        </Box>
    );
});
