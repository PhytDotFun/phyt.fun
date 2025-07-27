// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "forge-std-1.9.7/src/Test.sol";

import "../src/Contract.sol";

contract TestContract is Test {
    Contract c;

    function setUp() public {
        c = new Contract();
    }

    function testBar() public pure {
        assertEq(uint256(1), uint256(1), "ok");
    }

    function testFoo(uint256 x) public pure {
        vm.assume(x < type(uint128).max);
        assertEq(x + x, x * 2);
    }
}
