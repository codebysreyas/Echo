const RELAYER_URL = "https://echo-relayer.sreyasmurali150.workers.dev";

export function generatePassphrase() {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic.phrase;
}

export function deriveKeys(phrase) {
    const cleaned = phrase.trim().replace(/\s+/g, " ");
    const wallet = ethers.Wallet.fromPhrase(cleaned);
    return {
        address: wallet.address,
        publicKey: wallet.signingKey.publicKey,
        privateKey: wallet.privateKey
    };
}

export function validatePassphrase(phrase) {
    try {
        const cleaned = phrase.trim().replace(/\s+/g, " ");
        ethers.Wallet.fromPhrase(cleaned);
        return true;
    } catch {
        return false;
    }
}

export async function isUsernameTaken(username) {
    const response = await fetch(`${RELAYER_URL}/check/${username}`);
    const data = await response.json();
    return data.taken;
}

export async function lookupUsername(username) {
    const response = await fetch(`${RELAYER_URL}/lookup/${username}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
}

export async function registerOnChain(username, publicKey, userAddress) {
    const response = await fetch(`${RELAYER_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, publicKey, userAddress })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.txHash;
}