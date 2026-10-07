import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
    icon?: ReactNode;
    title: string;
    text?: string;
    children?: ReactNode;
}

export default function EmptyState({ icon, title, text, children }: Props) {
    return (
        <Box
            sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 1,
                p: 4,
                color: "text.secondary",
            }}
        >
            {icon && <Box sx={{ fontSize: 56, color: "text.disabled", display: "flex" }}>{icon}</Box>}
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>{title}</Typography>
            {text && <Typography sx={{ maxWidth: 420 }}>{text}</Typography>}
            {children}
        </Box>
    );
}
