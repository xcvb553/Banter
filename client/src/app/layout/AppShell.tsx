import { Box } from "@mui/material";
import { Outlet } from "react-router";
import TopBar from "./TopBar";
import IncomingCallDialog from "../../features/calls/IncomingCallDialog";
import { colors } from "../theme/theme";

export default function AppShell() {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", bgcolor: colors.rail, overflow: "hidden" }}>
            <TopBar />
            <Box sx={{ flexGrow: 1, display: "flex", minHeight: 0 }}>
                <Outlet />
            </Box>
            <IncomingCallDialog />
        </Box>
    );
}
