// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Game} from "cog/Game.sol";
import {Node, ResourceKind, AtomKind} from "@ds/schema/Schema.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {BuildingKind} from "@ds/ext/BuildingKind.sol";
import {console} from "forge-std/console.sol";



contract DuckFanatic is BuildingKind {
    bytes24 public itemID;

    constructor(Game ds) {

    }

    function use(Game ds, bytes24, /*buildingInstance*/ bytes24, /*seeker*/ bytes calldata payload) public {
       
    }
}
