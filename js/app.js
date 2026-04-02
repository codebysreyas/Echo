import { generatePassphrase, deriveKeys, validatePassphrase, registerOnChain, lookupUsername, isUsernameTaken } from "./identity.js";
import { connectToSignaling, startCall, sendMessage } from "./messaging.js";

const screens = {
    welcome: document.getElementById("screen-welcome"),
    passphrase: document.getElementById("screen-passphrase"),
    restore: document.getElementById("screen-restore"),
    profile: document.getElementById("screen-profile"),
    home: document.getElementById("screen-home")
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.style.display = "none");
    screens[name].style.display = "block";
}

function loadSession() {
    const username = sessionStorage.getItem("username");
    const publicKey = sessionStorage.getItem("publicKey");
    if (username && publicKey) {
        renderHome();
        showScreen("home");
        initMessaging();
    }
}

function renderHome() {
    const username = sessionStorage.getItem("username");
    const displayname = sessionStorage.getItem("displayname") || username;
    const avatar = sessionStorage.getItem("avatar") || `https://ui-avatars.com/api/?name=${username}&background=random`;
    document.getElementById("home-username").innerText = "@" + username;
    document.getElementById("home-displayname").innerText = displayname;
    document.getElementById("home-avatar").src = avatar;
}

document.getElementById("btn-generate").addEventListener("click", () => {
    const phrase = generatePassphrase();
    document.getElementById("passphrase-display").innerText = phrase;
    sessionStorage.setItem("phrase", phrase);
    showScreen("passphrase");
});

document.getElementById("btn-copy").addEventListener("click", () => {
    navigator.clipboard.writeText(sessionStorage.getItem("phrase"));
    document.getElementById("btn-copy").innerText = "Copied";
});

document.getElementById("btn-continue").addEventListener("click", () => {
    const phrase = sessionStorage.getItem("phrase");
    const keys = deriveKeys(phrase);
    sessionStorage.setItem("publicKey", keys.publicKey);
    sessionStorage.setItem("privateKey", keys.privateKey);
    sessionStorage.setItem("address", keys.address);
    showScreen("profile");
});

document.getElementById("btn-restore").addEventListener("click", () => {
    showScreen("restore");
});

document.getElementById("btn-restore-submit").addEventListener("click", () => {
    const phrase = document.getElementById("restore-input").value.trim();
    if (validatePassphrase(phrase)) {
        const keys = deriveKeys(phrase);
        sessionStorage.setItem("phrase", phrase);
        sessionStorage.setItem("publicKey", keys.publicKey);
        sessionStorage.setItem("privateKey", keys.privateKey);
        sessionStorage.setItem("address", keys.address);
        showScreen("profile");
    } else {
        document.getElementById("restore-error").style.display = "block";
    }
});

document.getElementById("avatar-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById("avatar-preview").src = ev.target.result;
        sessionStorage.setItem("avatar", ev.target.result);
    };
    reader.readAsDataURL(file);
});

document.getElementById("btn-save-profile").addEventListener("click", async () => {
    const username = document.getElementById("input-username").value.trim();
    const displayname = document.getElementById("input-displayname").value.trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
        document.getElementById("username-error").style.display = "block";
        return;
    }

    document.getElementById("username-error").style.display = "none";
    document.getElementById("btn-save-profile").innerText = "Checking username...";

    const taken = await isUsernameTaken(username);
    if (taken) {
        document.getElementById("username-error").innerText = "This username is already taken. Please choose another.";
        document.getElementById("username-error").style.display = "block";
        document.getElementById("btn-save-profile").innerText = "Continue to Echo";
        return;
    }

    document.getElementById("btn-save-profile").innerText = "Registering on blockchain...";

    try {
        const publicKey = sessionStorage.getItem("publicKey");
        const userAddress = sessionStorage.getItem("address");
        await registerOnChain(username, publicKey, userAddress);
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("displayname", displayname);
        renderHome();
        showScreen("home");
        initMessaging();
    } catch (err) {
        document.getElementById("btn-save-profile").innerText = "Continue to Echo";
        alert("Registration failed. Please check your internet connection and try again.");
        console.error(err);
    }
});

function initMessaging() {
    const username = sessionStorage.getItem("username");
    if (!username) return;

    connectToSignaling(username, (message) => {
        displayMessage(message.from, message.text, message.timestamp, false);
    });

    document.getElementById("btn-find-user").addEventListener("click", async () => {
    const targetUsername = document.getElementById("input-find-user").value.trim();
    if (!targetUsername) return;

    try {
        const userInfo = await lookupUsername(targetUsername);
        document.getElementById("find-user-error").style.display = "none";
        document.getElementById("chat-with").innerText = targetUsername;
        document.getElementById("chat-section").style.display = "block";
        document.getElementById("chat-messages").innerHTML = "";
        await startCall(targetUsername, userInfo.publicKey);
        document.getElementById("chat-status").innerText = "Connecting...";
        setTimeout(() => {
            document.getElementById("chat-status").innerText = "Connected";
        }, 3000);
    } catch {
        document.getElementById("find-user-error").style.display = "block";
    }
});

    document.getElementById("btn-send").addEventListener("click", sendCurrentMessage);
    document.getElementById("chat-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendCurrentMessage();
    });
}

async function sendCurrentMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    const target = document.getElementById("chat-with").innerText;
    const sent = await sendMessage(target, text);
    if (sent) {
        displayMessage(sessionStorage.getItem("username"), text, Date.now(), true);
        input.value = "";
    }
}

function displayMessage(from, text, timestamp, isSelf) {
    const messages = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = isSelf ? "message sent" : "message received";
    div.innerHTML = `<p>${text}</p><span>${new Date(timestamp).toLocaleTimeString()}</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

loadSession();