import { observer } from "mobx-react-lite";
import MessageShell, { MessageText } from "../../app/common/MessageShell";
import { isSameAuthorGroup } from "../../app/utils/helpers";
import { useStore } from "../../app/stores/store";

export interface SimpleMessage {
    messageId: string;
    senderId: string;
    senderName: string;
    senderImage: string | null;
    content: string;
    date: string;
}

export default observer(function TextMessageList({ messages, searching }: { messages: SimpleMessage[]; searching: boolean }) {
    const { userStore } = useStore();

    return (
        <>
            {messages.map((message, index) => (
                <MessageShell
                    key={message.messageId}
                    senderId={message.senderId}
                    senderName={message.senderName}
                    senderImage={message.senderImage}
                    date={message.date}
                    compact={!searching && isSameAuthorGroup(messages[index - 1], message)}
                    isMine={message.senderId === userStore.user?.id}
                >
                    <MessageText text={message.content} />
                </MessageShell>
            ))}
        </>
    );
});
