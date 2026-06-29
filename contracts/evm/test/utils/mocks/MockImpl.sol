// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import { UUPS } from "../../../src/lib/proxy/UUPS.sol";

contract MockImpl is UUPS {
    function _authorizeUpgrade(address _newImpl) internal view override {}
}

