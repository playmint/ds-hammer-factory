// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {Game} from "@ds/Game.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, Schema, State} from "@ds/schema/Schema.sol";
import {ItemUtils, ItemConfig} from "@ds/utils/ItemUtils.sol";
import {BuildingUtils, BuildingConfig, Material, Input, Output} from "@ds/utils/BuildingUtils.sol";
import {BottleBank} from "../src/BottleBank.sol";

using Schema for State;

contract Deployer is Script {
    function setUp() public {}

    function run() public {
        // configure our deployment by fetch environment variables...

        // PLAYER_DEPLOYMENT_KEY is the private key of a ds player
        uint256 playerDeploymentKey = vm.envOr(
            "PLAYER_DEPLOYMENT_KEY", uint256(0x24941b1db84a65ded87773081c700c22f50fe26c8f9d471dc480207d96610ffd)
        );

        // GAME_ADDRESS is the address of the game instance to deploy to. You
        address gameAddr = vm.envOr("GAME_ADDRESS", address(0x1D8e3A7Dc250633C192AC1bC9D141E1f95C419AB));
        Game ds = Game(gameAddr);

        // BUILDING_KIND_EXTENSION_ID is the unique identifier for your building
        uint64 extensionID = uint64(uint256(keccak256(abi.encode("farms-bottle-bank"))));

        // connect as the player...
        vm.startBroadcast(playerDeploymentKey);

        // deploy
        bytes24 bottleBank = registerBottleBank(ds, extensionID);

        // dump deployed ids
        console2.log("BuildingKind", uint256(bytes32(bottleBank)));

        vm.stopBroadcast();
    }


    // register a new
    function registerBottleBank(Game ds, uint64 extensionID) public returns (bytes24 buildingKind) {
        bytes24 none = 0x0;
        bytes24 glassGreenGoo = ItemUtils.GlassGreenGoo();
        bytes24 beakerBlueGoo = ItemUtils.BeakerBlueGoo();
        bytes24 flaskRedGoo = ItemUtils.FlaskRedGoo();

        // register a new building kind
        return BuildingUtils.register(
            ds,
            BuildingConfig({
                id: extensionID,
                name: "Saftey Deposit Box",
                materials: [
                    Material({quantity: 100, item: glassGreenGoo}),
                    Material({quantity: 100, item: beakerBlueGoo}),
                    Material({quantity: 100, item: flaskRedGoo}),
                    Material({quantity: 0, item: none})
                ],
                inputs: [
                    Input({quantity: 0, item: none}),
                    Input({quantity: 0, item: none}),
                    Input({quantity: 0, item: none}),
                    Input({quantity: 0, item: none})
                ],
                outputs: [
                    Output({quantity: 0, item: none})
                ],
                implementation: address(new BottleBank()),
                plugin: vm.readFile("src/BottleBank.js")
            })
        );
    }
}
