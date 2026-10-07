import { Box, Chip, IconButton, InputBase, Tooltip } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { useRef, useState } from "react";
import { colors } from "../theme/theme";
import { useStore } from "../stores/store";
import { getErrorMessage } from "../utils/helpers";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface Props {
    placeholder: string;
    onSend: (content: string, files: File[]) => Promise<void>;
    allowFiles?: boolean;
    disabled?: boolean;
}

export default function ChatComposer({ placeholder, onSend, allowFiles = false, disabled = false }: Props) {
    const { commonStore } = useStore();
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSend = !disabled && !sending && (text.trim().length > 0 || files.length > 0);

    const handleSend = async () => {
        if (!canSend) return;
        setSending(true);
        try {
            await onSend(text.trim(), files);
            setText("");
            setFiles([]);
        } catch (error) {
            commonStore.showError(getErrorMessage(error, "Message was not sent"));
        } finally {
            setSending(false);
        }
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        e.target.value = "";

        const tooBig = selected.find(f => f.size > MAX_FILE_SIZE);
        if (tooBig) {
            commonStore.showError(`${tooBig.name} is bigger than 10 MB`);
            return;
        }

        const all = [...files, ...selected];
        if (all.length > MAX_FILES) {
            commonStore.showError(`You can attach max ${MAX_FILES} files`);
        }
        setFiles(all.slice(0, MAX_FILES));
    };

    return (
        <Box sx={{ px: 2, pb: 2, pt: 0.5, flexShrink: 0 }}>
            <Box
                sx={{
                    bgcolor: colors.input,
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                    "&:focus-within": { borderColor: colors.accent },
                    transition: "border-color 0.15s",
                }}
            >
                {files.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, px: 1.5, pt: 1.5 }}>
                        {files.map((file, index) => (
                            <Chip
                                key={`${file.name}-${index}`}
                                icon={<InsertDriveFileOutlinedIcon />}
                                label={file.name}
                                onDelete={() => setFiles(files.filter((_, i) => i !== index))}
                                sx={{ maxWidth: 220, bgcolor: colors.elevated }}
                            />
                        ))}
                    </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, px: 1, py: 0.75 }}>
                    {allowFiles && (
                        <>
                            <Tooltip title="Attach files">
                                <span>
                                    <IconButton
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={disabled}
                                        sx={{ color: "text.secondary", "&:hover": { color: colors.accent } }}
                                    >
                                        <AddCircleIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilesSelected} />
                        </>
                    )}

                    <InputBase
                        multiline
                        maxRows={8}
                        fullWidth
                        value={text}
                        disabled={disabled}
                        placeholder={placeholder}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        sx={{ px: 1, py: 1, fontSize: "0.95rem", color: "text.primary" }}
                    />

                    <Tooltip title="Send">
                        <span>
                            <IconButton
                                onClick={handleSend}
                                disabled={!canSend}
                                sx={{
                                    color: canSend ? colors.accent : "text.disabled",
                                }}
                            >
                                <SendRoundedIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
}
