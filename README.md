# Echo

Decentralized Peer-to-Peer Messaging

Echo is a messaging application where no company owns your data, no central server stores your conversations, and no one — including the developer — can read your messages.

Communication happens directly between devices using peer-to-peer technology and strong end-to-end encryption.

Built using WebRTC, IPFS and Ethereum.

---

## Key Properties

* No phone number login
* No email or account registration
* Passphrase-based identity
* Direct device-to-device messaging
* End-to-end encrypted communication
* Offline message delivery via IPFS
* No centralized message servers
* Works in any modern browser

---

## Project Status

Echo is currently in active development.

Completed

* Passphrase identity system
* Profile setup with username
* Smart contract for username registry

In Progress

* WebRTC peer-to-peer messaging
* IPFS offline message delivery

Planned

* Image and file sharing
* GitHub Pages deployment
* Mobile browser optimization

---

## The Problem

Modern messaging platforms are controlled by corporations.

Examples include WhatsApp, Telegram and Instagram. Messages pass through centralized servers where they can be stored, analyzed or handed over to governments.

Service outages also affect millions of people simultaneously.

In October 2021, Facebook infrastructure went down for nearly 6 hours, disconnecting about 3.5 billion users worldwide.

There is currently no widely accessible messaging platform that is fully decentralized, censorship-resistant and simple enough for everyday users.

---

## The Solution

Echo removes the central server completely.

Three decentralized technologies work together to achieve this.

Identity
A 12-word passphrase is generated when the user opens Echo for the first time. This passphrase derives a public and private key pair using BIP-39 cryptography.

Messaging
If two users are online, messages travel directly between their devices using WebRTC.

Offline delivery
If a recipient is offline, the encrypted message is stored on IPFS. When the recipient reconnects, the message is fetched and decrypted locally.

Discovery
The blockchain is used only for storing username to public key mappings so users can find each other.

Messages themselves never touch the blockchain.

---

## How It Works

```
User opens Echo
→ Generates 12 word passphrase (identity)
→ Sets a username
→ Username registered on Ethereum blockchain
→ User searches another username
→ Messages travel directly device-to-device via WebRTC

If recipient is offline

→ Message encrypted locally
→ Stored on IPFS
→ Recipient retrieves and decrypts on login
```

Nobody in the middle can read the messages.

---

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
      |---- Username → Public Key mapping
```

Messages travel directly between devices whenever possible.
IPFS acts as encrypted storage for offline delivery.

---

## Tech Stack

| Layer          | Technology                  |
| -------------- | --------------------------- |
| Frontend       | HTML, CSS, JavaScript       |
| Identity       | BIP-39 Mnemonics, ethers.js |
| Encryption     | TweetNaCl.js                |
| Smart Contract | Solidity                    |
| Blockchain     | Ethereum Sepolia Testnet    |
| Messaging      | WebRTC                      |
| Storage        | IPFS via web3.storage       |
| Hosting        | GitHub Pages                |

---

## Roadmap

Phase 1
Identity and username system

Phase 2
Peer-to-peer encrypted messaging

Phase 3
Offline message delivery via IPFS

Phase 4
File and image sharing

Phase 5
Mobile optimization and performance improvements

---

## Contributing

Echo is an experimental decentralized messaging project and contributions are welcome.

Ways to contribute:

* report bugs
* suggest improvements
* improve documentation
* test the application

Open an issue before submitting a pull request.

---

## Developer

Sreyas VM
BCA Final Year Student

Echo is being developed as both a thesis project and an open decentralized messaging experiment.

---

## License

MIT License
