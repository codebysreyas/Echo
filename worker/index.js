import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x2902cfa226e9F54C1310F9195a78928508eaA99C";
const CONTRACT_ABI = [
    "function registerUser(address userAddress, string memory username, string memory publicKey) public",
    "function isUsernameTaken(string memory username) public view returns (bool)",
    "function getUserByUsername(string memory username) public view returns (string memory, string memory)",
    "function isAddressRegistered(address userAddress) public view returns (bool)"
];

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        if (path === "/") {
            return Response.json({ status: "Echo Relayer is running" }, { headers: corsHeaders });
        }

        if (path.startsWith("/check/")) {
            const username = decodeURIComponent(path.split("/check/")[1]);
            try {
                const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                const taken = await contract.isUsernameTaken(username);
                return Response.json({ taken }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
            }
        }

        if (path.startsWith("/lookup/")) {
            const username = decodeURIComponent(path.split("/lookup/")[1]);
            try {
                const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                const result = await contract.getUserByUsername(username);
                return Response.json({ username: result[0], publicKey: result[1] }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ error: "User not found" }, { status: 404, headers: corsHeaders });
            }
        }

        if (path === "/register" && request.method === "POST") {
            const { username, publicKey, userAddress } = await request.json();
            

            if (!username || !publicKey || !userAddress) {
    return Response.json({ error: "Username, publicKey and userAddress required" }, { status: 400, headers: corsHeaders });
}

            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return Response.json({ error: "Invalid username format" }, { status: 400, headers: corsHeaders });
            }

            try {
                const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
                const wallet = new ethers.Wallet(env.RELAYER_PRIVATE_KEY, provider);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
                const taken = await contract.isUsernameTaken(username);
                if (taken) {
                    return Response.json({ error: "Username already taken" }, { status: 400, headers: corsHeaders });
                }
                const tx = await contract.registerUser(userAddress, username, publicKey);
                await tx.wait();
                return Response.json({ success: true, txHash: tx.hash }, { headers: corsHeaders });
            } catch (err) {
                return Response.json({ error: "Registration failed: " + err.message }, { status: 500, headers: corsHeaders });
            }
        }

        return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    }
};