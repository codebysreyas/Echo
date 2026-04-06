# Echo Devlog

A running log of daily progress building Echo — a decentralized peer-to-peer messaging application.

---

## Day 1 — Project Setup
Set up the development environment with VS Code, Node.js and Git. Created the project folder structure with HTML, CSS and JavaScript files. Installed core dependencies including ethers.js, bip39 and tweetnacl. Pushed the initial project to GitHub and enabled GitHub Pages.

---

## Day 2 — Passphrase Identity System
Built the complete passphrase based identity system using BIP-39 mnemonics and ethers.js. Users can generate a 12 word passphrase that derives a unique public and private key pair. Added a restore flow for existing users. Built the profile setup screen with username validation, optional display name and profile picture upload.

---

## Day 3 — Smart Contract
Wrote and tested the EchoIdentity smart contract in Remix IDE. The contract stores username to public key mappings on the Ethereum blockchain. Tested all functions — registerUser, getUserByUsername, isUsernameTaken — in the Remix VM before deployment. Wrote a professional README for the GitHub repo.

---

## Day 4 — Blockchain Deployment and Relayer
Deployed the EchoIdentity smart contract to Ethereum Sepolia Testnet. Built a gasless registration system using a Cloudflare Worker as a relayer — users pay zero ETH to register. The relayer wallet sponsors all gas fees. Updated the smart contract to accept user address as a parameter so each user gets their own on-chain identity even though the relayer submits the transaction. Full identity flow is now working end to end.

**Contract Address:** 0x2902cfa226e9F54C1310F9195a78928508eaA99C
**Relayer:** https://echo-relayer.sreyasmurali150.workers.dev

---

## Day 5 — WebRTC Peer-to-Peer Messaging
Built the WebSocket signaling server using Node.js and deployed it to Render. Implemented full WebRTC peer-to-peer messaging in the browser. Two users can now find each other by username, establish a direct encrypted connection and exchange messages in real time. No server carries the messages — they flow directly between devices.

**Signaling Server:** https://echo-signaling.onrender.com

---

## Day 6 — End-to-End Encryption
Added end-to-end encryption to all messages. Both users derive the same shared key using their public keys — sorted before XOR so the result is always identical on both sides regardless of who initiates the chat. Messages are encrypted before leaving the sender's device and decrypted only on the recipient's device.Fixed restore flow — returning users are now detected via blockchain lookup and taken directly to home screen without repeating profile setup.

---

## Day 7 — UI Redesign
Complete frontend redesign with a clean, responsive chat interface. Built with mobile-first approach — works on phones, tablets and desktops. Added dark and light mode toggle. Chat list sidebar on desktop, full screen chat on mobile. Message bubbles, timestamps, avatar generation, and smooth transitions throughout. Designed to feel familiar and easy to use for anyone.

---

## Day 8 — GitHub Pages Deployment
Echo is now live at https://codebysreyas.github.io/Echo. 
Full flow working on the live URL — passphrase generation, 
blockchain registration, WebRTC messaging, end-to-end encryption.
