import { Alert, Box, Button, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useStore } from "../../app/stores/store";
import { getErrorMessage } from "../../app/utils/helpers";

export default observer(function RegisterForm() {
    const { userStore } = useStore();
    const [form, setForm] = useState({ email: "", username: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (form.password.length < 6) {
            setError("Password must have at least 6 characters.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await userStore.register({ email: form.email, username: form.username, password: form.password });
        } catch (err) {
            setError(getErrorMessage(err, "Registration failed"));
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth autoFocus />
            <TextField
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                helperText="Letters, numbers and _ . -"
                required
                fullWidth
            />
            <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                fullWidth
            />
            <TextField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={userStore.loading}>
                Create account
            </Button>
        </Box>
    );
});
