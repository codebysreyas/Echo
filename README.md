# Echo

A decentralized peer-to-peer messaging application where no company owns your data, no server stores your messages, and no one — not even the developer — can read your conversations.

## The Problem

Every popular messaging app today is owned by a corporation. WhatsApp is owned by Meta. Your messages pass through their servers, get stored, and can be accessed by the company or handed over to governments on request. In October 2021, WhatsApp, Instagram and Facebook went down for 6 hours and 3.5 billion people had no way to communicate. There is no messaging app today that regular people can use which is truly free from all of this.

## The Solution

Echo replaces the central server with three technologies working together.

When you open Echo for the first time, you generate a 12 word passphrase. This becomes your identity. No phone number. No email. No account registration. From this passphrase, a public and private key pair is derived — the same mathematics that powers Bitcoin and Ethereum.

When you send a message to someone online, it travels directly from your device to theirs using WebRTC — a direct encrypted tunnel with no server in the middle. If the recipient is offline, the message is encrypted and stored on IPFS, a decentralized storage network spread across thousands of computers worldwide. The blockchain is used only to store username to public key mappings so people can find each other — actual messages never touch the blockchain.

## How It Works
```
User opens Echo
→ Generates 12 word passphrase (their identity)
→ Sets a username (registered on Ethereum blockchain)
→ Finds another user by username
→ Messages travel directly device to device via WebRTC (encrypted)
→ If recipient offline → message stored on IPFS (encrypted)
→ Recipient comes online → message delivered and decrypted locally
```

Nobody in the middle can read anything. Ever.

## Features

- Passphrase based identity — no signup, no phone number, no email
- Username system for finding and messaging other users
- End to end encrypted text messaging via WebRTC
- Image and file sharing via IPFS
- Offline message delivery via IPFS
- Zero server cost — completely decentralized
- Works on any device in any browser

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript |
| Identity | BIP-39 Mnemonics, ethers.js |
| Encryption | TweetNaCl.js |
| Smart Contract | Solidity |
| Blockchain | Ethereum Sepolia Testnet |
| Real-time Messaging | WebRTC |
| Decentralized Storage | IPFS via web3.storage |
| Hosting | GitHub Pages |

## Architecture
```
[User A Device]                    [User B Device]
      |                                  |
      |-------- WebRTC Direct ---------->|   (both online)
      |                                  |
      |----> IPFS Storage                |   (User B offline)
                  |                      |
                  |<---- Fetch on login--|
                  
[Ethereum Sepolia]
      |
      |---- Username → Public Key mapping only
```

## Project Status

Currently in active development as a BCA final year thesis project at IZee Business School.

- [x] Passphrase identity system
- [x] Profile setup with username
- [x] Smart contract for username registry
- [ ] WebRTC peer to peer messaging
- [ ] IPFS offline message delivery
- [ ] File and image sharing
- [ ] GitHub Pages deployment

## Developer

Sreyas VM — BCA Final Year, IZee Business School  
Building Echo as a thesis project and a real product.

## License

MIT
```

Save it and commit with this message:
```
Add project README with architecture and feature overview
