import { InputBase } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { colors } from "../../app/theme/theme";

export default function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <InputBase
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Search"
            startAdornment={<SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled", mr: 0.75 }} />}
            sx={{ bgcolor: colors.input, borderRadius: "6px", px: 1.5, height: 32, width: 190, fontSize: "0.85rem" }}
        />
    );
}
