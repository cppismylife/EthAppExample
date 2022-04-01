// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";

contract WavePortal {
    uint256 totalWaves;
    mapping(address => uint256) public lastWavedAt;

    event NewWave(address indexed from, uint256 timestamp, string message);

    struct Wave {
        address waver; // The address of the user who waved.
        string message; // The message the user sent.
        uint256 timestamp; // The timestamp when the user waved.
    }

    uint256 private seed;
    Wave[] waves;

    constructor() payable {
        console.log("I am simple contract that have just been deployed");
        seed = (block.timestamp + block.difficulty) % 100;
    }

    function wave(string memory _message) public {
        require(
            lastWavedAt[msg.sender] + 15 minutes < block.timestamp,
            "Wait 15m"
        );
        lastWavedAt[msg.sender] = block.timestamp;
        totalWaves += 1;
        console.log("%s has waved! w/ message %s", msg.sender, _message);
        waves.push(Wave(msg.sender, _message, block.timestamp));
        seed = (block.difficulty + block.timestamp + seed) % 100;
        console.log("Random # generated: %d", seed);
        if (seed <= 50) {
            console.log("%s won!", msg.sender);
            uint256 prizeAmount = 0.0001 ether;
            require(
                prizeAmount <= address(this).balance,
                "Trying to withdraw more money than the contract has."
            );
            payable(msg.sender).transfer(prizeAmount);
        }
        emit NewWave(msg.sender, block.timestamp, _message);
    }

    function getTotalWaves() public view returns (uint256) {
        console.log("We have %d total waves!", totalWaves);
        return totalWaves;
    }

    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }
}
