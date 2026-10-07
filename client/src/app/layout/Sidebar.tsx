import { Box } from "@mui/material";
import type { ReactNode } from "react";
import UserPanel from "./UserPanel";
import { colors, panelSx } from "../theme/theme";

interface Props {
    header: ReactNode;
    children: ReactNode;
}

export default function Sidebar({ header, children }: Props) {
    return (
        <Box
            sx={{
                ...panelSx,
                bgcolor: colors.sidebar,
                borderRight: `1px solid ${colors.border}`,
                width: 260,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box
                sx={{
                    height: 56,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    borderBottom: `1px solid ${colors.border}`,
                }}
            >
                {header}
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1, py: 1.5 }}>{children}</Box>
            <UserPanel />
        </Box>
    );
}

export function SidebarItem({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 1.25,
                py: 0.85,
                mb: 0.25,
                borderRadius: "6px",
                cursor: "pointer",
                color: selected ? colors.accentDark : "text.secondary",
                fontWeight: selected ? 600 : 500,
                bgcolor: selected ? colors.selected : "transparent",
                "&:hover": { bgcolor: selected ? colors.selected : colors.hover, color: "text.primary" },
                "&:hover .row-actions": { opacity: 1 },
                minWidth: 0,
            }}
        >
            {children}
        </Box>
    );
}

export function SidebarSection({ title, action }: { title: string; action?: ReactNode }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.25, pt: 1.5, pb: 0.5 }}>
            <Box
                component="span"
                sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary" }}
            >
                {title}
            </Box>
            {action}
        </Box>
    );
}
