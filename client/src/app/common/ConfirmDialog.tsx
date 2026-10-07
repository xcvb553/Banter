import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useState } from "react";

interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmText = "Confirm", danger, onConfirm, onClose }: Props) {
    const [busy, setBusy] = useState(false);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                <Typography sx={{ color: "text.secondary" }}>{message}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={danger ? "error" : "primary"}
                    disabled={busy}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
