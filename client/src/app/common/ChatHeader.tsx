import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { colors } from "../theme/theme";

export default function ChatHeader({ children }: { children: ReactNode }) {
    return (
        <Box
            sx={{
                height: 56,
                flexShrink: 0,
                px: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderBottom: `1px solid ${colors.border}`,
                bgcolor: colors.main,
            }}
        >
            {children}
        </Box>
    );
}
