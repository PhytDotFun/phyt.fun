// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std-1.9.7/src/Script.sol";
import "../src/Contract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        Contract deployedContract = new Contract("Phyt Contract");

        console.log("Contract deployed at:", address(deployedContract));

        vm.stopBroadcast();
    }
}
