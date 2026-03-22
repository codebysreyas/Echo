// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EchoIdentity {
    struct User {
        string username;
        string publicKey;
        bool exists;
    }

    mapping(string => address) private usernameToAddress;
    mapping(address => User) private addressToUser;

    event UserRegistered(string username, address userAddress, string publicKey);

    function registerUser(string memory username, string memory publicKey) public {
        require(!addressToUser[msg.sender].exists, "Address already registered");
        require(usernameToAddress[username] == address(0), "Username already taken");
        require(bytes(username).length >= 3 && bytes(username).length <= 20, "Username must be 3 to 20 characters");

        addressToUser[msg.sender] = User(username, publicKey, true);
        usernameToAddress[username] = msg.sender;

        emit UserRegistered(username, msg.sender, publicKey);
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