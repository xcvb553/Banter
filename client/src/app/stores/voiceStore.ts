import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { makeAutoObservable, runInAction } from "mobx";
import { API_URL } from "../api/agent";
import type { CallInfo, ChannelState, VoiceUser } from "../models/voice";
import type { Channel } from "../models/server";
import type CommonStore from "./commonStore";
import type ServerStore from "./serverStore";
import type UserStore from "./userStore";

const RTC_CONFIG: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const CALL_TIMEOUT_MS = 30_000;

export type CallStatus = "idle" | "outgoing" | "incoming" | "connecting" | "connected";

type PrivateFields =
    | "localStream" | "callPeer" | "callIceBuffer" | "callTimeout" | "peers" | "peerIceBuffers"
    | "audioElements" | "audioContainer" | "userStore" | "serverStore" | "commonStore";

export default class VoiceStore {
    connection: HubConnection | null = null;
    isConnected = false;

    isMuted = false;
    isDeafened = false;

    call: CallInfo | null = null;
    callStatus: CallStatus = "idle";

    currentChannelId: string | null = null;
    currentChannelName: string | null = null;
    currentServerId: string | null = null;

    private localStream: MediaStream | null = null;
    private callPeer: RTCPeerConnection | null = null;
    private callIceBuffer: RTCIceCandidateInit[] = [];
    private callTimeout: ReturnType<typeof setTimeout> | null = null;
    private peers = new Map<string, RTCPeerConnection>();
    private peerIceBuffers = new Map<string, RTCIceCandidateInit[]>();
    private audioElements = new Map<string, HTMLAudioElement>();
    private audioContainer: HTMLDivElement | null = null;

    private userStore: UserStore;
    private serverStore: ServerStore;
    private commonStore: CommonStore;

    constructor(userStore: UserStore, serverStore: ServerStore, commonStore: CommonStore) {
        makeAutoObservable<VoiceStore, PrivateFields>(this, {
            connection: false,
            localStream: false,
            callPeer: false,
            callIceBuffer: false,
            callTimeout: false,
            peers: false,
            peerIceBuffers: false,
            audioElements: false,
            audioContainer: false,
            userStore: false,
            serverStore: false,
            commonStore: false,
        });
        this.userStore = userStore;
        this.serverStore = serverStore;
        this.commonStore = commonStore;
    }

    get isInCall() {
        return this.callStatus !== "idle";
    }

    get otherCallUserId() {
        if (!this.call) return null;
        return this.call.isInitiator ? this.call.targetId : this.call.callerId;
    }

    connect = async () => {
        if (this.connection) return;

        const connection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/hubs/voice`, {
                accessTokenFactory: () => localStorage.getItem("token") ?? "",
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        this.connection = connection;
        this.registerHandlers(connection);

        connection.onreconnecting(() => runInAction(() => (this.isConnected = false)));
        connection.onreconnected(async () => {
            runInAction(() => (this.isConnected = true));
            if (this.isInCall) this.cleanupCall();
            if (this.currentChannelId) {
                const channelId = this.currentChannelId;
                this.closeAllPeers();
                await connection.invoke("JoinVoiceChannel", channelId);
            }
        });
        connection.onclose(() => {
            runInAction(() => (this.isConnected = false));
            this.cleanupCall();
            this.cleanupChannel();
            if (this.connection === connection && this.userStore.isLoggedIn) {
                this.connection = null;
                setTimeout(() => this.connect(), 5000);
            }
        });

        try {
            await connection.start();
            runInAction(() => (this.isConnected = true));
        } catch (error) {
            if (this.connection === connection) {
                console.error("VoiceHub connection failed", error);
                this.connection = null;
                setTimeout(() => {
                    if (this.userStore.isLoggedIn) this.connect();
                }, 5000);
            }
        }
    };

    disconnect = async () => {
        if (this.isInCall) await this.endCall();
        if (this.currentChannelId) await this.leaveVoiceChannel();

        const connection = this.connection;
        this.connection = null;
        this.isConnected = false;
        if (connection && connection.state !== HubConnectionState.Disconnected) {
            await connection.stop();
        }
        this.releaseLocalStream();
    };

    private registerHandlers(connection: HubConnection) {
        connection.on("ReceiveCall", this.handleReceiveCall);
        connection.on("CallAccepted", this.handleCallAccepted);
        connection.on("CallDeclined", this.handleCallDeclined);
        connection.on("CallEnded", this.handleCallEnded);
        connection.on("CallUserFailed", this.handleCallFailed);
        connection.on("ReceiveSDP", this.handleCallSdp);
        connection.on("ReceiveIceCandidate", this.handleCallIceCandidate);

        connection.on("ChannelState", this.handleChannelState);
        connection.on("UserJoinedChannel", this.handleUserJoinedChannel);
        connection.on("UserLeftChannel", this.handleUserLeftChannel);
        connection.on("ReceiveChannelOffer", this.handleChannelOffer);
        connection.on("ReceiveChannelAnswer", this.handleChannelAnswer);
        connection.on("ReceiveChannelIceCandidate", this.handleChannelIceCandidate);
        connection.on("VoiceError", (message: string) => {
            this.commonStore.showError(message);
            this.cleanupChannel();
        });
    }

    private async ensureLocalStream() {
        if (this.localStream && this.localStream.active) return this.localStream;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            stream.getAudioTracks().forEach(track => (track.enabled = !this.isMuted));
            this.localStream = stream;
            return stream;
        } catch (error) {
            console.error("Could not get microphone", error);
            this.commonStore.showError("Could not access your microphone");
            return null;
        }
    }

    private releaseLocalStream() {
        if (!this.isInCall && !this.currentChannelId && this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    private playRemoteStream(id: string, stream: MediaStream) {
        if (!this.audioContainer) {
            this.audioContainer = document.createElement("div");
            this.audioContainer.style.display = "none";
            document.body.appendChild(this.audioContainer);
        }

        let audio = this.audioElements.get(id);
        if (!audio) {
            audio = document.createElement("audio");
            audio.autoplay = true;
            this.audioContainer.appendChild(audio);
            this.audioElements.set(id, audio);
        }
        audio.srcObject = stream;
        audio.muted = this.isDeafened;
        audio.play().catch(error => console.error("Could not play remote audio", error));
    }

    private stopRemoteStream(id: string) {
        const audio = this.audioElements.get(id);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            this.audioElements.delete(id);
        }
    }

    toggleMute = async () => {
        this.isMuted = !this.isMuted;
        this.localStream?.getAudioTracks().forEach(track => (track.enabled = !this.isMuted));
        await this.sendVoiceState();
    };

    toggleDeafen = async () => {
        this.isDeafened = !this.isDeafened;
        this.audioElements.forEach(audio => (audio.muted = this.isDeafened));
        await this.sendVoiceState();
    };

    private async sendVoiceState() {
        if (this.currentChannelId && this.connection?.state === HubConnectionState.Connected) {
            await this.connection.invoke("UpdateVoiceState", this.isMuted, this.isDeafened);
        }
    }

    makeCall = async (friendId: string) => {
        if (!this.connection || !this.isConnected) {
            this.commonStore.showError("Voice server is not connected");
            return;
        }
        if (this.isInCall) return;
        if (this.currentChannelId) {
            this.commonStore.showToast("Leave the voice channel first", "warning");
            return;
        }

        const stream = await this.ensureLocalStream();
        if (!stream) return;

        runInAction(() => {
            this.call = { callerId: this.userStore.user!.id, targetId: friendId, isInitiator: true };
            this.callStatus = "outgoing";
        });

        this.callTimeout = setTimeout(() => {
            if (this.callStatus === "outgoing") {
                this.commonStore.showToast("Nobody answered", "info");
                this.endCall();
            }
        }, CALL_TIMEOUT_MS);

        try {
            await this.connection.invoke("CallUser", friendId);
        } catch (error) {
            console.error(error);
            this.cleanupCall();
        }
    };

    acceptCall = async () => {
        if (!this.connection || !this.call || this.callStatus !== "incoming") return;
        const callerId = this.call.callerId;

        const stream = await this.ensureLocalStream();
        if (!stream) {
            await this.declineCall();
            return;
        }

        this.clearCallTimeout();
        runInAction(() => (this.callStatus = "connecting"));
        await this.connection.invoke("AcceptCall", callerId);
    };

    declineCall = async () => {
        if (!this.call) return;
        const callerId = this.call.callerId;
        this.cleanupCall();
        await this.connection?.invoke("DeclineCall", callerId).catch(console.error);
    };

    endCall = async () => {
        const otherId = this.otherCallUserId;
        this.cleanupCall();
        if (otherId) {
            await this.connection?.invoke("EndCall", otherId).catch(console.error);
        }
    };

    private createCallPeer(otherUserId: string) {
        const peer = new RTCPeerConnection(RTC_CONFIG);

        this.localStream?.getAudioTracks().forEach(track => peer.addTrack(track, this.localStream!));

        peer.onicecandidate = event => {
            if (event.candidate) {
                this.connection?.invoke("SendIceCandidate", otherUserId, JSON.stringify(event.candidate)).catch(console.error);
            }
        };
        peer.ontrack = event => {
            if (event.streams[0]) this.playRemoteStream("call", event.streams[0]);
        };
        peer.onconnectionstatechange = () => {
            if (peer.connectionState === "connected") {
                runInAction(() => (this.callStatus = "connected"));
            } else if (peer.connectionState === "failed") {
                this.commonStore.showError("Call connection failed");
                this.endCall();
            }
        };

        this.callPeer = peer;
        return peer;
    }

    private async flushCallIceBuffer() {
        if (!this.callPeer) return;
        for (const candidate of this.callIceBuffer) {
            await this.callPeer.addIceCandidate(candidate).catch(console.error);
        }
        this.callIceBuffer = [];
    }

    private handleReceiveCall = (data: { callerId: string; targetId: string }) => {
        if (this.isInCall || this.currentChannelId) {
            this.connection?.invoke("DeclineCall", data.callerId).catch(console.error);
            return;
        }

        this.call = { callerId: data.callerId, targetId: data.targetId, isInitiator: false };
        this.callStatus = "incoming";

        this.callTimeout = setTimeout(() => {
            if (this.callStatus === "incoming") this.cleanupCall();
        }, CALL_TIMEOUT_MS);
    };

    private handleCallAccepted = async (userId: string) => {
        if (!this.call?.isInitiator || this.call.targetId !== userId) return;

        this.clearCallTimeout();
        runInAction(() => (this.callStatus = "connecting"));

        const peer = this.createCallPeer(userId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await this.connection?.invoke("SendSDP", userId, JSON.stringify(offer));
    };

    private handleCallDeclined = (userId: string) => {
        if (this.otherCallUserId !== userId) return;
        this.commonStore.showToast("Call was declined", "info");
        this.cleanupCall();
    };

    private handleCallEnded = (userId: string) => {
        if (this.otherCallUserId !== userId) return;
        this.commonStore.showToast("Call ended", "info");
        this.cleanupCall();
    };

    private handleCallFailed = (_targetId: string, reason: string) => {
        this.commonStore.showError(reason);
        this.cleanupCall();
    };

    private handleCallSdp = async (senderId: string, sdpJson: string) => {
        if (this.otherCallUserId !== senderId) return;
        const sdp = JSON.parse(sdpJson) as RTCSessionDescriptionInit;

        try {
            if (sdp.type === "offer") {
                const peer = this.createCallPeer(senderId);
                await peer.setRemoteDescription(sdp);
                await this.flushCallIceBuffer();
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                await this.connection?.invoke("SendSDP", senderId, JSON.stringify(answer));
            } else if (sdp.type === "answer" && this.callPeer) {
                await this.callPeer.setRemoteDescription(sdp);
                await this.flushCallIceBuffer();
            }
        } catch (error) {
            console.error("Error handling call SDP", error);
        }
    };

    private handleCallIceCandidate = async (senderId: string, candidateJson: string) => {
        if (this.otherCallUserId !== senderId) return;
        const candidate = JSON.parse(candidateJson) as RTCIceCandidateInit;

        if (this.callPeer?.remoteDescription) {
            await this.callPeer.addIceCandidate(candidate).catch(console.error);
        } else {
            this.callIceBuffer.push(candidate);
        }
    };

    private clearCallTimeout() {
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }
    }

    private cleanupCall() {
        this.clearCallTimeout();
        this.callPeer?.close();
        this.callPeer = null;
        this.callIceBuffer = [];
        this.stopRemoteStream("call");
        runInAction(() => {
            this.call = null;
            this.callStatus = "idle";
        });
        this.releaseLocalStream();
    }

    joinVoiceChannel = async (channel: Channel) => {
        const { channelId, serverId } = channel;
        if (!this.connection || !this.isConnected) {
            this.commonStore.showError("Voice server is not connected");
            return;
        }
        if (this.isInCall) {
            this.commonStore.showToast("Hang up the call first", "warning");
            return;
        }
        if (this.currentChannelId === channelId) return;
        if (this.currentChannelId) await this.leaveVoiceChannel();

        const stream = await this.ensureLocalStream();
        if (!stream) return;

        runInAction(() => {
            this.currentChannelId = channelId;
            this.currentChannelName = channel.name;
            this.currentServerId = serverId;
        });

        try {
            await this.connection.invoke("JoinVoiceChannel", channelId);
            await this.sendVoiceState();
        } catch (error) {
            console.error(error);
            this.cleanupChannel();
        }
    };

    leaveVoiceChannel = async () => {
        if (!this.currentChannelId) return;
        this.cleanupChannel();
        await this.connection?.invoke("LeaveVoiceChannel").catch(console.error);
    };

    loadVoiceUsers = async (serverId: string) => {
        if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
        try {
            const data = await this.connection.invoke<Record<string, VoiceUser[]>>("GetVoiceChannelUsers", serverId);
            this.serverStore.setAllVoiceUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    private createChannelPeer(remoteUserId: string) {
        this.peers.get(remoteUserId)?.close();

        const peer = new RTCPeerConnection(RTC_CONFIG);
        this.localStream?.getAudioTracks().forEach(track => peer.addTrack(track, this.localStream!));

        peer.onicecandidate = event => {
            if (event.candidate) {
                this.connection?.invoke("SendChannelIceCandidate", remoteUserId, JSON.stringify(event.candidate)).catch(console.error);
            }
        };
        peer.ontrack = event => {
            if (event.streams[0]) this.playRemoteStream(remoteUserId, event.streams[0]);
        };
        peer.onconnectionstatechange = () => {
            if (peer.connectionState === "failed") this.closePeer(remoteUserId);
        };

        this.peers.set(remoteUserId, peer);
        this.peerIceBuffers.set(remoteUserId, []);
        return peer;
    }

    private closePeer(userId: string) {
        this.peers.get(userId)?.close();
        this.peers.delete(userId);
        this.peerIceBuffers.delete(userId);
        this.stopRemoteStream(userId);
    }

    private closeAllPeers() {
        Array.from(this.peers.keys()).forEach(userId => this.closePeer(userId));
    }

    private async flushPeerIceBuffer(userId: string) {
        const peer = this.peers.get(userId);
        const buffer = this.peerIceBuffers.get(userId) ?? [];
        for (const candidate of buffer) {
            await peer?.addIceCandidate(candidate).catch(console.error);
        }
        this.peerIceBuffers.set(userId, []);
    }

    private handleChannelState = (state: ChannelState) => {
        if (state.channelId !== this.currentChannelId) return;
        state.users.forEach(user => this.createChannelPeer(user.id));
    };

    private handleUserJoinedChannel = async (channelId: string, user: VoiceUser) => {
        if (channelId !== this.currentChannelId || user.id === this.userStore.user?.id) return;

        const peer = this.createChannelPeer(user.id);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await this.connection?.invoke("SendChannelOffer", user.id, JSON.stringify(offer));
    };

    private handleUserLeftChannel = (channelId: string, userId: string) => {
        if (channelId !== this.currentChannelId) return;
        this.closePeer(userId);
    };

    private handleChannelOffer = async (senderId: string, channelId: string, sdpJson: string) => {
        if (channelId !== this.currentChannelId) return;

        const peer = this.peers.get(senderId) ?? this.createChannelPeer(senderId);
        try {
            await peer.setRemoteDescription(JSON.parse(sdpJson));
            await this.flushPeerIceBuffer(senderId);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await this.connection?.invoke("SendChannelAnswer", senderId, JSON.stringify(answer));
        } catch (error) {
            console.error("Error handling channel offer", error);
        }
    };

    private handleChannelAnswer = async (senderId: string, channelId: string, sdpJson: string) => {
        if (channelId !== this.currentChannelId) return;
        const peer = this.peers.get(senderId);
        if (!peer) return;

        try {
            await peer.setRemoteDescription(JSON.parse(sdpJson));
            await this.flushPeerIceBuffer(senderId);
        } catch (error) {
            console.error("Error handling channel answer", error);
        }
    };

    private handleChannelIceCandidate = async (senderId: string, channelId: string, candidateJson: string) => {
        if (channelId !== this.currentChannelId) return;
        const candidate = JSON.parse(candidateJson) as RTCIceCandidateInit;
        const peer = this.peers.get(senderId);

        if (peer?.remoteDescription) {
            await peer.addIceCandidate(candidate).catch(console.error);
        } else {
            const buffer = this.peerIceBuffers.get(senderId) ?? [];
            buffer.push(candidate);
            this.peerIceBuffers.set(senderId, buffer);
        }
    };

    private cleanupChannel() {
        this.closeAllPeers();
        runInAction(() => {
            this.currentChannelId = null;
            this.currentChannelName = null;
            this.currentServerId = null;
        });
        this.releaseLocalStream();
    }

    reset = () => {
        this.isMuted = false;
        this.isDeafened = false;
    };
}
