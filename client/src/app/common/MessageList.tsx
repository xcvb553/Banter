import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

interface Props {
    firstKey?: string;
    lastKey?: string;
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
    beginningText?: string;
    children: ReactNode;
}

export default function MessageList({ firstKey, lastKey, hasMore, loading, onLoadMore, beginningText, children }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const nearBottom = useRef(true);
    const lastHeight = useRef(0);
    const prevFirst = useRef<string | undefined>(undefined);
    const prevLast = useRef<string | undefined>(undefined);

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const olderWereAdded = prevFirst.current !== undefined && firstKey !== prevFirst.current && lastKey === prevLast.current;
        if (olderWereAdded) {
            el.scrollTop += el.scrollHeight - lastHeight.current;
        } else if (nearBottom.current) {
            el.scrollTop = el.scrollHeight;
        }

        prevFirst.current = firstKey;
        prevLast.current = lastKey;
        lastHeight.current = el.scrollHeight;
    }, [firstKey, lastKey]);

    useEffect(() => {
        const el = scrollRef.current;
        const content = contentRef.current;
        if (!el || !content) return;

        const observer = new ResizeObserver(() => {
            if (nearBottom.current) el.scrollTop = el.scrollHeight;
            lastHeight.current = el.scrollHeight;
        });
        observer.observe(content);
        return () => observer.disconnect();
    }, []);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        lastHeight.current = el.scrollHeight;

        if (el.scrollTop < 80 && hasMore && !loading) {
            onLoadMore();
        }
    };

    return (
        <Box ref={scrollRef} onScroll={handleScroll} sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0 }}>
            <Box ref={contentRef} sx={{ display: "flex", flexDirection: "column", minHeight: "100%", pb: 2 }}>
                <Box sx={{ flexGrow: 1 }} />
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                        <CircularProgress size={22} />
                    </Box>
                )}
                {!hasMore && !loading && beginningText && (
                    <Typography sx={{ px: 3, pt: 4, pb: 2, color: "text.secondary", fontSize: "0.9rem" }}>
                        {beginningText}
                    </Typography>
                )}
                {children}
            </Box>
        </Box>
    );
}
