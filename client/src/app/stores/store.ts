import { createContext, useContext } from "react";
import CommonStore from "./commonStore";
import UserStore from "./userStore";
import ServerStore from "./serverStore";
import FriendStore from "./friendStore";
import ChatStore from "./chatStore";
import VoiceStore from "./voiceStore";

const commonStore = new CommonStore();
const userStore = new UserStore();
const serverStore = new ServerStore();
const friendStore = new FriendStore();
const chatStore = new ChatStore(userStore, serverStore, friendStore, commonStore);
const voiceStore = new VoiceStore(userStore, serverStore, commonStore);

export const store = {
    commonStore,
    userStore,
    serverStore,
    friendStore,
    chatStore,
    voiceStore,
};

export function resetStores() {
    serverStore.reset();
    friendStore.reset();
    chatStore.reset();
    voiceStore.reset();
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}
