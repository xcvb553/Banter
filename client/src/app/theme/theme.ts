import { createTheme } from "@mui/material";

export const colors = {
    rail: "#f6f7f9",
    sidebar: "#f6f7f9",
    main: "#ffffff",
    elevated: "#ffffff",
    input: "#f1f3f5",
    hover: "rgba(20,24,35,0.05)",
    selected: "rgba(46,99,201,0.10)",
    border: "#e2e5ea",

    text: "#1d2330",
    textMuted: "#5c6473",
    textFaint: "#9ba2ae",

    accent: "#2e63c9",
    accentHover: "#3d72d8",
    accentDark: "#2552a8",
    teal: "#2f8f83",
    online: "#2e9d5b",
    danger: "#d0393e",
    warning: "#b7791f",

    bubbleMine: "#2e63c9",
    bubbleOther: "#f0f2f5",
    shadow: "0 1px 3px rgba(20,24,35,0.08)",
};

export const panelSx = {
    bgcolor: colors.main,
    overflow: "hidden",
};

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: colors.accent,
            dark: colors.accentDark,
            light: colors.accentHover,
            contrastText: "#ffffff",
        },
        secondary: {
            main: colors.teal,
        },
        error: {
            main: colors.danger,
        },
        success: {
            main: colors.online,
        },
        background: {
            default: colors.main,
            paper: colors.elevated,
        },
        text: {
            primary: colors.text,
            secondary: colors.textMuted,
            disabled: colors.textFaint,
        },
        divider: colors.border,
    },
    shape: {
        borderRadius: 6,
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        button: {
            textTransform: "none",
            fontWeight: 500,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: colors.rail,
                    scrollbarColor: `${colors.border} transparent`,
                },
                "*::-webkit-scrollbar": { width: 8, height: 8 },
                "*::-webkit-scrollbar-thumb": { backgroundColor: "#d3d7de", borderRadius: 8 },
                "*::-webkit-scrollbar-track": { background: "transparent" },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    paddingInline: 14,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    boxShadow: "0 10px 30px rgba(20,24,35,0.15)",
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: colors.elevated,
                    border: `1px solid ${colors.border}`,
                    boxShadow: colors.shadow,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: "outlined",
                size: "small",
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.input,
                    borderRadius: 6,
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.border,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: colors.textFaint,
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: "#1d2330",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    padding: "6px 10px",
                },
            },
        },
    },
});

export default theme;
