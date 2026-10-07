import { observer } from "mobx-react-lite";
import { Navigate } from "react-router";
import TagRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { useStore } from "../../app/stores/store";
import EmptyState from "../../app/common/EmptyState";

export default observer(function ServerIndex() {
    const { serverStore } = useStore();
    const firstChannel = serverStore.textChannels[0];

    if (firstChannel) {
        return <Navigate to={`/server/${firstChannel.serverId}/${firstChannel.channelId}`} replace />;
    }

    if (serverStore.loadingServer) return null;

    return <EmptyState icon={<TagRoundedIcon fontSize="inherit" />} title="No text channels" text="This server doesn't have any text channels yet." />;
});
