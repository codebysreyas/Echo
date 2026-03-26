// Deployed on Ethereum Sepolia Testnet: 0x2902cfa226e9F54C1310F9195a78928508eaA99C

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EchoIdentity {
    struct User {
        string username;
        string publicKey;
        bool exists;
    }

    address public relayer;
    mapping(string => address) private usernameToAddress;
    mapping(address => User) private addressToUser;

    event UserRegistered(string username, address userAddress, string publicKey);

    constructor() {
        relayer = msg.sender;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can call this");
        _;
    }

    function registerUser(address userAddress, string memory username, string memory publicKey) public onlyRelayer {
        require(!addressToUser[userAddress].exists, "Address already registered");
        require(usernameToAddress[username] == address(0), "Username already taken");
        require(bytes(username).length >= 3 && bytes(username).length <= 20, "Username must be 3 to 20 characters");

        addressToUser[userAddress] = User(username, publicKey, true);
        usernameToAddress[username] = userAddress;

        emit UserRegistered(username, userAddress, publicKey);
    }

    function getUserByUsername(string memory username) public view returns (string memory, string memory) {
        address userAddress = usernameToAddress[username];
        require(userAddress != address(0), "User not found");
        User memory user = addressToUser[userAddress];
        return (user.username, user.publicKey);
    }

    function getUserByAddress(address userAddress) public view returns (string memory, string memory) {
        require(addressToUser[userAddress].exists, "User not found");
        User memory user = addressToUser[userAddress];
        return (user.username, user.publicKey);
    }

    function isUsernameTaken(string memory username) public view returns (bool) {
        return usernameToAddress[username] != address(0);
    }

    function isAddressRegistered(address userAddress) public view returns (bool) {
        return addressToUser[userAddress].exists;
    }
}