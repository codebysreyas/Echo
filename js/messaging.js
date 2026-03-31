const SIGNALING_SERVER = "wss://echo-signaling.onrender.com";

let ws = null;
let peerConnection = null;
let dataChannel = null;
let currentUser = null;
let onMessageCallback = null;

const iceConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

export function connectToSignaling(username, onMessage) {
    currentUser = username;
    onMessageCallback = onMessage;
    ws = new WebSocket(SIGNALING_SERVER);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: "register", username }));
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "offer") {
            await handleOffer(data.offer, data.from);
        }

        if (data.type === "answer") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.type === "ice-candidate") {
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }

        if (data.type === "online-status") {
            return data.online;
        }
    };
}

export async function startCall(targetUsername) {
    peerConnection = new RTCPeerConnection(iceConfig);

    dataChannel = peerConnection.createDataChannel("echo-messages");
    setupDataChannel(dataChannel);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({
                type: "ice-candidate",
                candidate: event.candidate,
                target: targetUsername
            }));
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    ws.send(JSON.stringify({
        type: "offer",
        offer,
        target: targetUsername
    }));
}

async function handleOffer(offer, from) {
    peerConnection = new RTCPeerConnection(iceConfig);

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel(dataChannel);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({
                type: "ice-candidate",
                candidate: event.candidate,
                target: from
            }));
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    ws.send(JSON.stringify({
        type: "answer",
        answer,
        target: from
    }));
}

function setupDataChannel(channel) {
    channel.onopen = () => {
        console.log("WebRTC data channel open");
    };

    channel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (onMessageCallback) onMessageCallback(message);
    };

    channel.onclose = () => {
        console.log("WebRTC data channel closed");
    };
}

export function sendMessage(targetUsername, message) {
    const payload = JSON.stringify({
        from: currentUser,
        text: message,
        timestamp: Date.now()
    });

    if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(payload);
        return true;
    }
    return false;
}

export function checkOnline(username) {
    return new Promise((resolve) => {
        ws.send(JSON.stringify({ type: "check-online", username }));
        const handler = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "online-status" && data.username === username) {
                ws.removeEventListener("message", handler);
                resolve(data.online);
            }
        };
        ws.addEventListener("message", handler);
    });
}