// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin-contracts-5.0.2/access/Ownable.sol";

contract Contract is Ownable {
    string public name;
    uint256 public value;

    event ValueUpdated(uint256 oldValue, uint256 newValue);

    constructor(string memory _name) Ownable(msg.sender) {
        name = _name;
        value = 0;
    }

    function updateValue(uint256 _newValue) external onlyOwner {
        uint256 oldValue = value;
        value = _newValue;
        emit ValueUpdated(oldValue, _newValue);
    }

    function getName() external view returns (string memory) {
        return name;
    }

    function getValue() external view returns (uint256) {
        return value;
    }
}
