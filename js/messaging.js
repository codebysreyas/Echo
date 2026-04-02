const SIGNALING_SERVER = "wss://echo-signaling.onrender.com";

let ws = null;
let peerConnection = null;
let dataChannel = null;
let currentUser = null;
let onMessageCallback = null;
let recipientPublicKey = null;

const iceConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

function hexToBytes(hex) {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function encryptMessage(text, theirPublicKeyHex) {
    const myPrivateKeyHex = sessionStorage.getItem("privateKey");
    const myPrivateKeyBytes = hexToBytes(myPrivateKeyHex);
    const theirPublicKeyBytes = hexToBytes(theirPublicKeyHex.slice(4, 68));

    const myKeyPair = await crypto.subtle.importKey(
        "raw", myPrivateKeyBytes.slice(0, 32),
        { name: "AES-GCM" }, false, ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, myKeyPair, encoded);

    return bytesToHex(iv) + "." + bytesToHex(new Uint8Array(encrypted));
}

async function decryptMessage(encryptedText, theirPublicKeyHex) {
    const myPrivateKeyHex = sessionStorage.getItem("privateKey");
    const myPrivateKeyBytes = hexToBytes(myPrivateKeyHex);

    const myKeyPair = await crypto.subtle.importKey(
        "raw", myPrivateKeyBytes.slice(0, 32),
        { name: "AES-GCM" }, false, ["decrypt"]
    );

    const parts = encryptedText.split(".");
    const iv = hexToBytes(parts[0]);
    const encrypted = hexToBytes(parts[1]);

    try {
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, myKeyPair, encrypted);
        return new TextDecoder().decode(decrypted);
    } catch {
        return null;
    }
}

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

export async function startCall(targetUsername, targetPublicKey) {
    recipientPublicKey = targetPublicKey;
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

    channel.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        if (message.encrypted && recipientPublicKey) {
            const decrypted = await decryptMessage(message.text, recipientPublicKey);
            if (decrypted && onMessageCallback) {
                onMessageCallback({ from: message.from, text: decrypted, timestamp: message.timestamp });
            }
        } else {
            if (onMessageCallback) onMessageCallback(message);
        }
    };

    channel.onclose = () => {
        console.log("WebRTC data channel closed");
    };
}

export async function sendMessage(targetUsername, text) {
    let payload;

   if (recipientPublicKey) {
        const encrypted = await encryptMessage(text, recipientPublicKey);
        payload = JSON.stringify({
            from: currentUser,
            text: encrypted,
            timestamp: Date.now(),
            encrypted: true
        });
    } else {
        payload = JSON.stringify({
            from: currentUser,
            text,
            timestamp: Date.now(),
            encrypted: false
        });
    }

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