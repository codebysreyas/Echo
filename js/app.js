import { generatePassphrase, deriveKeys, validatePassphrase } from "./identity.js";

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

document.getElementById("btn-save-profile").addEventListener("click", () => {
    const username = document.getElementById("input-username").value.trim();
    const displayname = document.getElementById("input-displayname").value.trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(username)) {
        document.getElementById("username-error").style.display = "block";
        return;
    }

    document.getElementById("username-error").style.display = "none";
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("displayname", displayname);
    renderHome();
    showScreen("home");
});

loadSession();