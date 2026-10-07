import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import UserAvatar from "./UserAvatar";
import { colors } from "../theme/theme";
import { formatMessageTime, formatShortTime } from "../utils/helpers";

interface Props {
    senderId: string;
    senderName: string;
    senderImage: string | null;
    date: string;
    compact: boolean;
    isMine: boolean;
    edited?: boolean;
    actions?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
}

export default function MessageShell({ senderId, senderName, senderImage, date, compact, isMine, edited, actions, footer, children }: Props) {
    return (
        <Box
            sx={{
                position: "relative",
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                gap: 1.25,
                px: 3,
                pt: compact ? 0.35 : 1.75,
                "&:hover .message-actions": { opacity: 1, pointerEvents: "auto" },
                "&:hover .bubble-time": { opacity: 1 },
            }}
        >
            {!isMine && (
                <Box sx={{ width: 34, flexShrink: 0, alignSelf: "flex-end" }}>
                    {!compact && <UserAvatar id={senderId} name={senderName} image={senderImage} size={34} />}
                </Box>
            )}

            <Box
                sx={{
                    position: "relative",
                    maxWidth: "68%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMine ? "flex-end" : "flex-start",
                }}
            >
                {!compact && (
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5, px: 0.5 }}>
                        {!isMine && <Typography sx={{ fontWeight: 600, fontSize: "0.82rem" }}>{senderName}</Typography>}
                        <Typography sx={{ fontSize: "0.72rem", color: "text.disabled" }}>{formatMessageTime(date)}</Typography>
                    </Box>
                )}

                {children && (
                    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, flexDirection: isMine ? "row-reverse" : "row" }}>
                        <Box
                            sx={{
                                px: 1.5,
                                py: 0.85,
                                borderRadius: "12px",
                                bgcolor: isMine ? colors.bubbleMine : colors.bubbleOther,
                                color: isMine ? "#fff" : colors.text,
                                minWidth: 0,
                            }}
                        >
                            {children}
                        </Box>
                        {compact && (
                            <Typography className="bubble-time" sx={{ opacity: 0, transition: "opacity 0.1s", fontSize: "0.68rem", color: "text.disabled", whiteSpace: "nowrap", pb: 0.5 }}>
                                {formatShortTime(date)}
                            </Typography>
                        )}
                    </Box>
                )}

                {edited && <Typography sx={{ fontSize: "0.68rem", color: "text.disabled", px: 0.75, mt: 0.25 }}>edited</Typography>}
                {footer}

                {actions && (
                    <Box
                        className="message-actions"
                        sx={{
                            position: "absolute",
                            top: compact ? -18 : 6,
                            [isMine ? "right" : "left"]: "100%",
                            mx: 1,
                            opacity: 0,
                            pointerEvents: "none",
                            transition: "opacity 0.1s",
                            display: "flex",
                            bgcolor: colors.elevated,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "6px",
                            boxShadow: colors.shadow,
                            px: 0.5,
                            zIndex: 2,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {actions}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export function MessageText({ text }: { text: string }) {
    if (!text) return null;
    return (
        <Typography
            component="div"
            sx={{ color: "inherit", fontSize: "0.94rem", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
            {text}
        </Typography>
    );
}
