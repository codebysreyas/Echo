import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CONTRACT_ADDRESS = "0x53eeacD39b98E1f973d8157d987f0d486c057eBA";
const CONTRACT_ABI = [
    "function registerUser(string memory username, string memory publicKey) public",
    "function isUsernameTaken(string memory username) public view returns (bool)",
    "function getUserByUsername(string memory username) public view returns (string memory, string memory)"
];

const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, relayerWallet);

app.get("/", (req, res) => {
    res.json({ status: "Echo Relayer is running" });
});

app.get("/check/:username", async (req, res) => {
    try {
        const taken = await contract.isUsernameTaken(req.params.username);
        res.json({ taken });
    } catch (err) {
        res.status(500).json({ error: "Failed to check username" });
    }
});

app.post("/register", async (req, res) => {
    try {
        const { username, publicKey } = req.body;

        if (!username || !publicKey) {
            return res.status(400).json({ error: "Username and publicKey are required" });
        }

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ error: "Invalid username format" });
        }

        const taken = await contract.isUsernameTaken(username);
        if (taken) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const tx = await contract.registerUser(username, publicKey);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.get("/lookup/:username", async (req, res) => {
    try {
        const result = await contract.getUserByUsername(req.params.username);
        res.json({ username: result[0], publicKey: result[1] });
    } catch (err) {
        res.status(500).json({ error: "User not found" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Echo Relayer running on port ${PORT}`);
});
```

Now open `relayer/.env` and paste this:
```
RELAYER_PRIVATE_KEY=your_private_key_here