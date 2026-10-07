import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { router } from "./app/router/routes";
import theme from "./app/theme/theme";
import "./app/layout/styles.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <RouterProvider router={router} />
        </ThemeProvider>
    </StrictMode>
);
