import { Box, Button } from "@mui/material";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { Link } from "react-router";
import EmptyState from "../common/EmptyState";
import { colors } from "../theme/theme";

export default function NotFound() {
    return (
        <Box sx={{ height: "100vh", display: "flex", bgcolor: colors.main }}>
            <EmptyState icon={<SearchOffRoundedIcon fontSize="inherit" />} title="Page not found" text="This page doesn't exist (anymore).">
                <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>Go home</Button>
            </EmptyState>
        </Box>
    );
}
