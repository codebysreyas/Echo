const RELAYER_URL = "https://echo-relayer.sreyasmurali150.workers.dev";

export async function storeOfflineMessage(recipientUsername, encryptedMessage, senderUsername) {
    const response = await fetch(`${RELAYER_URL}/store-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            recipientUsername,
            encryptedMessage,
            senderUsername,
            timestamp: Date.now()
        })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.ipfsHash;
}

export async function fetchOfflineMessages(recipientUsername) {
    const response = await fetch(`${RELAYER_URL}/get-messages/${recipientUsername}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const messages = [];
    for (const item of data.messages) {
        try {
            const msgResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${item.ipfsHash}`);
            const msgData = await msgResponse.json();
            messages.push({ ...msgData, ipfsHash: item.ipfsHash });
        } catch {
            continue;
        }
    }

    return messages.sort((a, b) => a.timestamp - b.timestamp);
}

export async function deleteOfflineMessage(ipfsHash) {
    const response = await fetch(`${RELAYER_URL}/delete-message/${ipfsHash}`, {
        method: "DELETE"
    });
    return await response.json();
}

export async function uploadFileToIPFS(file) {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) throw new Error("File too large. Maximum size is 10MB.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pinataMetadata", JSON.stringify({ name: `echo-file-${Date.now()}` }));

    const response = await fetch(`${RELAYER_URL}/upload-file`, {
        method: "POST",
        body: formData
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Upload failed");
    return data.ipfsHash;
}

export async function fetchFileFromIPFS(ipfsHash) {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    if (!response.ok) throw new Error("Failed to fetch file");
    return response;
}