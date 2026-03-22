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