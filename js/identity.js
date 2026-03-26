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

export async function isUsernameTaken(username) {
    const response = await fetch(`https://echo-relayer.sreyasmurali150.workers.dev/check/${username}`);
    const data = await response.json();
    return data.taken;
}

export async function lookupUsername(username) {
    const response = await fetch(`https://echo-relayer.sreyasmurali150.workers.dev/lookup/${username}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
}

export async function registerOnChain(username, publicKey, userAddress) {
    const response = await fetch(`https://echo-relayer.sreyasmurali150.workers.dev/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, publicKey, userAddress })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.txHash;
}