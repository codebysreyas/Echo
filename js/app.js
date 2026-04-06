import { generatePassphrase, deriveKeys, validatePassphrase, registerOnChain, lookupUsername, isUsernameTaken } from "./identity.js";
import { connectToSignaling, startCall, sendMessage } from "./messaging.js";
import { fetchOfflineMessages, deleteOfflineMessage } from "./ipfs.js";

const screens = {
    welcome: document.getElementById("screen-welcome"),
    passphrase: document.getElementById("screen-passphrase"),
    restore: document.getElementById("screen-restore"),
    profile: document.getElementById("screen-profile"),
    home: document.getElementById("screen-home")
};

let activeChat = null;
let chatHistory = {};

function loadChatHistory() {
    const username = sessionStorage.getItem("username");
    if (!username) return;
    chatHistory = JSON.parse(localStorage.getItem(`echo_chat_history_${username}`) || "{}");
}

function saveChatHistory() {
    const username = sessionStorage.getItem("username");
    if (!username) return;
    localStorage.setItem(`echo_chat_history_${username}`, JSON.stringify(chatHistory));
}

function showScreen(name) {
    Object.values(screens).forEach(s => s.style.display = "none");
    screens[name].style.display = "flex";
    if (name !== "home") {
        screens[name].style.flexDirection = "column";
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute("data-theme") === "dark";
    html.setAttribute("data-theme", isDark ? "light" : "dark");
    const icon = isDark ? "☀️" : "🌙";
    document.getElementById("theme-toggle").innerText = icon;
    const chatToggle = document.getElementById("theme-toggle-chat");
    if (chatToggle) chatToggle.innerText = icon;
}

document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

function loadSession() {
    const username = sessionStorage.getItem("username");
    const publicKey = sessionStorage.getItem("publicKey");
    if (username && publicKey) {
        loadChatHistory();
        renderHome();
        showScreen("home");
        initMessaging();
        restoreChatList();
    }
}

function restoreChatList() {
    Object.keys(chatHistory).forEach(username => {
        const msgs = chatHistory[username];
        if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            addChatToList(username, last.text);
        }
    });
}

function renderHome() {
    const username = sessionStorage.getItem("username");
    const displayname = sessionStorage.getItem("displayname") || username;
    const avatar = sessionStorage.getItem("avatar") || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=00a884&color=fff`;
    document.getElementById("sidebar-avatar").src = avatar;
    document.getElementById("sidebar-name").innerText = displayname;
}

function addChatToList(username, lastMessage) {
    const existing = document.getElementById(`chat-item-${username}`);
    if (existing) {
        existing.querySelector(".chat-item-preview").innerText = lastMessage || "Connected";
        return;
    }

    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2a3942&color=fff`;
    const item = document.createElement("div");
    item.className = "chat-item";
    item.id = `chat-item-${username}`;
    item.innerHTML = `
        <img class="chat-item-avatar" src="${avatar}" alt="${username}">
        <div class="chat-item-info">
            <div class="chat-item-name">${username}</div>
            <div class="chat-item-preview">${lastMessage || "Connected"}</div>
        </div>
    `;
    item.addEventListener("click", () => openChat(username));
    document.getElementById("chat-list").prepend(item);
}

function openChat(username) {
    activeChat = username;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2a3942&color=fff`;
    document.getElementById("chat-with").innerText = username;
    document.getElementById("chat-header-avatar").src = avatar;
    document.getElementById("chat-status").innerText = "Connecting...";
    document.getElementById("chat-empty").style.display = "none";
    document.getElementById("chat-section").style.display = "flex";
    document.getElementById("chat-section").style.flexDirection = "column";
    document.getElementById("chat-section").style.height = "100%";

    document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active"));
    const item = document.getElementById(`chat-item-${username}`);
    if (item) item.classList.add("active");

    document.getElementById("chat-messages").innerHTML = "";
    if (chatHistory[username]) {
        chatHistory[username].forEach(m => displayMessage(m.from, m.text, m.timestamp, m.isSelf));
    }

    if (window.innerWidth <= 768) {
        document.getElementById("chat-main").classList.add("mobile-open");
    }
}

document.getElementById("btn-back").addEventListener("click", () => {
    document.getElementById("chat-main").classList.remove("mobile-open");
});

document.getElementById("btn-generate").addEventListener("click", () => {
    const phrase = generatePassphrase();
    document.getElementById("passphrase-display").innerText = phrase;
    sessionStorage.setItem("phrase", phrase);
    showScreen("passphrase");
});

document.getElementById("btn-copy").addEventListener("click", () => {
    navigator.clipboard.writeText(sessionStorage.getItem("phrase"));
    document.getElementById("btn-copy").innerText = "Copied!";
    setTimeout(() => document.getElementById("btn-copy").innerText = "Copy Passphrase", 2000);
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

document.getElementById("btn-restore-submit").addEventListener("click", async () => {
    const phrase = document.getElementById("restore-input").value.trim();
    if (!validatePassphrase(phrase)) {
        document.getElementById("restore-error").innerText = "Invalid passphrase. Please check your words and try again.";
        document.getElementById("restore-error").style.display = "block";
        return;
    }

    const keys = deriveKeys(phrase);
    sessionStorage.setItem("phrase", phrase);
    sessionStorage.setItem("publicKey", keys.publicKey);
    sessionStorage.setItem("privateKey", keys.privateKey);
    sessionStorage.setItem("address", keys.address);

    document.getElementById("btn-restore-submit").innerText = "Restoring...";

    try {
        const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/Ow9C77r8Zum7U-qVBNS2U");
        const CONTRACT_ADDRESS = "0x2902cfa226e9F54C1310F9195a78928508eaA99C";
        const CONTRACT_ABI = [
            "function getUserByAddress(address userAddress) public view returns (string memory, string memory)",
            "function isAddressRegistered(address userAddress) public view returns (bool)"
        ];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const isRegistered = await contract.isAddressRegistered(keys.address);

        if (isRegistered) {
            const result = await contract.getUserByAddress(keys.address);
            sessionStorage.setItem("username", result[0]);
            sessionStorage.setItem("displayname", result[0]);
            loadChatHistory();
            renderHome();
            showScreen("home");
            initMessaging();
            restoreChatList();
        } else {
            showScreen("profile");
        }
    } catch (err) {
        console.error(err);
        document.getElementById("btn-restore-submit").innerText = "Restore Identity";
        document.getElementById("restore-error").innerText = "Failed to restore. Check your connection and try again.";
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
        document.getElementById("username-error").innerText = "Username must be 3 to 20 characters. Letters, numbers and underscore only.";
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
        sessionStorage.setItem("displayname", displayname || username);
        loadChatHistory();
        renderHome();
        showScreen("home");
        initMessaging();
        restoreChatList();
    } catch (err) {
        document.getElementById("btn-save-profile").innerText = "Continue to Echo";
        alert("Registration failed. Please check your internet connection and try again.");
        console.error(err);
    }
});

async function deliverOfflineMessages(username) {
    try {
        const messages = await fetchOfflineMessages(username);
        for (const msg of messages) {
            if (!chatHistory[msg.from]) chatHistory[msg.from] = [];
            chatHistory[msg.from].push({ from: msg.from, text: msg.text, timestamp: msg.timestamp, isSelf: false });
            saveChatHistory();
            addChatToList(msg.from, msg.text);
            await deleteOfflineMessage(msg.ipfsHash);
        }
        if (messages.length > 0) {
            console.log(`Delivered ${messages.length} offline messages`);
        }
    } catch (err) {
        console.error("Offline message delivery failed:", err);
    }
}

async function initMessaging() {
    const username = sessionStorage.getItem("username");
    if (!username) return;

    await deliverOfflineMessages(username);

    document.getElementById("theme-toggle-chat").addEventListener("click", toggleTheme);

    connectToSignaling(username, (message) => {
        if (!chatHistory[message.from]) chatHistory[message.from] = [];
        chatHistory[message.from].push({ ...message, isSelf: false });
        saveChatHistory();
        if (activeChat === message.from) {
            displayMessage(message.from, message.text, message.timestamp, false);
        }
        addChatToList(message.from, message.text);
    });

    document.getElementById("btn-find-user").addEventListener("click", async () => {
        const targetUsername = document.getElementById("input-find-user").value.trim();
        if (!targetUsername) return;

        document.getElementById("btn-find-user").innerText = "Finding...";

        try {
            const userInfo = await lookupUsername(targetUsername);
            document.getElementById("find-user-error").style.display = "none";
            document.getElementById("input-find-user").value = "";
            addChatToList(targetUsername, "Connecting...");
            openChat(targetUsername);
            await startCall(targetUsername, userInfo.publicKey);
            setTimeout(() => {
                document.getElementById("chat-status").innerText = "Connected";
                addChatToList(targetUsername, "Connected");
            }, 3000);
        } catch {
            document.getElementById("find-user-error").style.display = "block";
        }

        document.getElementById("btn-find-user").innerText = "Start Chat";
    });

    document.getElementById("input-find-user").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("btn-find-user").click();
    });

    document.getElementById("btn-send").addEventListener("click", sendCurrentMessage);
    document.getElementById("chat-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendCurrentMessage();
    });
}

async function sendCurrentMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text || !activeChat) return;

    const result = await sendMessage(activeChat, text);

    if (result && result.sent) {
        if (!chatHistory[activeChat]) chatHistory[activeChat] = [];
        const msg = { from: sessionStorage.getItem("username"), text, timestamp: Date.now(), isSelf: true };
        chatHistory[activeChat].push(msg);
        saveChatHistory();
        displayMessage(msg.from, text, msg.timestamp, true);
        addChatToList(activeChat, result.method === "ipfs" ? text + " (delivered offline)" : text);
        input.value = "";
    }
}

function displayMessage(from, text, timestamp, isSelf) {
    const messages = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = `message ${isSelf ? "sent" : "received"}`;
    div.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${text}</div>
        </div>
        <div class="message-time">${new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

loadSession();