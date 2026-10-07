import { Avatar, Badge } from "@mui/material";
import { colors } from "../theme/theme";
import { colorFromString, fileUrl } from "../utils/helpers";

interface Props {
    id?: string;
    name?: string;
    image?: string | null;
    size?: number;
    online?: boolean;
    dotBorderColor?: string;
}

export default function UserAvatar({ id, name, image, size = 36, online, dotBorderColor = colors.sidebar }: Props) {
    const avatar = (
        <Avatar
            src={fileUrl(image)}
            alt={name}
            sx={{
                width: size,
                height: size,
                fontSize: size * 0.42,
                fontWeight: 700,
                bgcolor: colorFromString(id ?? name),
                color: "#fff",
            }}
        >
            {(name?.[0] ?? "?").toUpperCase()}
        </Avatar>
    );

    if (online === undefined) return avatar;

    const dotSize = Math.max(8, size * 0.26);
    return (
        <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
                "& .MuiBadge-badge": {
                    width: dotSize,
                    height: dotSize,
                    minWidth: dotSize,
                    borderRadius: "50%",
                    backgroundColor: online ? colors.online : colors.textFaint,
                    border: `2px solid ${dotBorderColor}`,
                    boxSizing: "content-box",
                    transform: "translate(25%, 25%)",
                },
            }}
        >
            {avatar}
        </Badge>
    );
}
