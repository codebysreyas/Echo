import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract.js";

export function generatePassphrase() {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic.phrase;
}

export function deriveKeys(phrase) {
    const wallet = ethers.Wallet.fromPhrase(phrase);
    return {
        address: wallet.address,
        publicKey: wallet.signingKey.publicKey,
        privateKey: wallet.privateKey
    };
}

export function validatePassphrase(phrase) {
    try {
        ethers.Wallet.fromPhrase(phrase);
        return true;
    } catch {
        return false;
    }
}

export async function registerOnChain(phrase, username, publicKey) {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const wallet = ethers.Wallet.fromPhrase(phrase).connect(provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    const tx = await contract.registerUser(username, publicKey);
    await tx.wait();
    return tx.hash;
}

export async function lookupUsername(username) {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const result = await contract.getUserByUsername(username);
    return {
        username: result[0],
        publicKey: result[1]
    };
}

export async function isUsernameTaken(username) {
    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    return await contract.isUsernameTaken(username);
}