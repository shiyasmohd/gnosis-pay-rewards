// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

contract ForkTest is Test {
  uint256 fork;
  /// @dev set BASE_RPC_URL in .env to run mainnet tests
  string RPC_URL = vm.envString("GNOSIS_CHAIN_RPC_URL");

  function _forkSetupBefore() public {
    fork = vm.createFork(RPC_URL);
    vm.selectFork(fork);
  }
}
