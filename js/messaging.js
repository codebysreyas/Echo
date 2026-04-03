const SIGNALING_SERVER = "wss://echo-signaling.onrender.com";

let ws = null;
let peerConnection = null;
let dataChannel = null;
let currentUser = null;
let onMessageCallback = null;
let sharedKey = null;

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

function deriveSharedKey(myPublicKeyHex, theirPublicKeyHex) {
    const myBytes = hexToBytes(myPublicKeyHex.slice(4, 68));
    const theirBytes = hexToBytes(theirPublicKeyHex.slice(4, 68));
    const myHex = bytesToHex(myBytes);
    const theirHex = bytesToHex(theirBytes);
    const first = myHex < theirHex ? myBytes : theirBytes;
    const second = myHex < theirHex ? theirBytes : myBytes;
    const key = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        key[i] = first[i] ^ second[i];
    }
    return key;
}

function encryptMessage(text, key) {
    const textBytes = new TextEncoder().encode(text);
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);
    const encrypted = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
        encrypted[i] = textBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    return bytesToHex(iv) + "." + bytesToHex(encrypted);
}

function decryptMessage(encryptedText, key) {
    const parts = encryptedText.split(".");
    const iv = hexToBytes(parts[0]);
    const encrypted = hexToBytes(parts[1]);
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    return new TextDecoder().decode(decrypted);
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
    };
}

export async function startCall(targetUsername, targetPublicKey) {
    const myPublicKey = sessionStorage.getItem("publicKey");
    sharedKey = deriveSharedKey(myPublicKey, targetPublicKey);

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
    try {
        const response = await fetch(`https://echo-relayer.sreyasmurali150.workers.dev/lookup/${from}`);
        const userData = await response.json();
        const myPublicKey = sessionStorage.getItem("publicKey");
        sharedKey = deriveSharedKey(myPublicKey, userData.publicKey);
    } catch {
        sharedKey = null;
    }

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
        if (message.encrypted && sharedKey) {
            const decrypted = decryptMessage(message.text, sharedKey);
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

export function sendMessage(targetUsername, text) {
    let payload;

    if (sharedKey) {
        const encrypted = encryptMessage(text, sharedKey);
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