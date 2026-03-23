export const CONTRACT_ADDRESS = "0x53eeacD39b98E1f973d8157d987f0d486c057eBA";

export const CONTRACT_ABI = [
    "function registerUser(string memory username, string memory publicKey) public",
    "function getUserByUsername(string memory username) public view returns (string memory, string memory)",
    "function getUserByAddress(address userAddress) public view returns (string memory, string memory)",
    "function isUsernameTaken(string memory username) public view returns (bool)",
    "function isAddressRegistered(address userAddress) public view returns (bool)"
];