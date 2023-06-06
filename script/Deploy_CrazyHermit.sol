// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {Game} from "@ds/Game.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, Schema, State} from "@ds/schema/Schema.sol";
import {ItemUtils, ItemConfig} from "@ds/utils/ItemUtils.sol";
import {BuildingUtils, BuildingConfig, Material, Input, Output} from "@ds/utils/BuildingUtils.sol";
import {CrazyHermit} from "../src/CrazyHermit.sol";

using Schema for State;

contract Deployer is Script {
    function setUp() public {}

    function run() public {
        // configure our deployment by fetch environment variables...

        // PLAYER_DEPLOYMENT_KEY is the private key of a ds player
        // session to execute the commands as.
        //
        // When deploying to local testnet instances of the game (localhost)
        // you can leave this as the default well-known-and-totally-insecure
        // development key DO NOT ACTUALLY SET THIS TO A _REAL_ KEY UNLESS YOU
        // KNOW WHAT YOU ARE DOING.
        uint256 playerDeploymentKey = vm.envOr(
            "PLAYER_DEPLOYMENT_KEY", uint256(0x24941b1db84a65ded87773081c700c22f50fe26c8f9d471dc480207d96610ffd)
        );

        // GAME_ADDRESS is the address of the game instance to deploy to. You
        // can find this within the game client by clicking on the version
        // number or about screen.
        //
        // When deploying to local testnet instances of the game (localhost)
        // you may be able to leave this as the default. But if it fails find
        // the game address from the client as mentioned above
        address gameAddr = vm.envOr("GAME_ADDRESS", address(0x1D8e3A7Dc250633C192AC1bC9D141E1f95C419AB));
        Game ds = Game(gameAddr);

        // BUILDING_KIND_EXTENSION_ID is the unique identifier for your building
        // kind. Pick any number you like, use a random number generate or
        // choose your favourite number.
        //
        // The only rules for selecting a number are:
        //
        // * it must be between 1 and 9223372036854775807
        // * if someone else has already registered the number, then you can't have it
        //
        // When deploying to local testnet instances of the game (localhost)
        // you can probably leave this as the default of 45342312 as you are
        // unlikely to clash with yourself
        uint64 extensionID = uint64(vm.envUint("BUILDING_KIND_EXTENSION_ID"));

        // connect as the player...
        vm.startBroadcast(playerDeploymentKey);

        // deploy the new item and building
        bytes24 newItem = registerItem(ds, extensionID);
        bytes24 building = registerBuilding(ds, extensionID, newItem);

        // dump deployed ids
        console2.log("ItemKind", uint256(bytes32(newItem)));
        console2.log("BuildingKind", uint256(bytes32(building)));

        vm.stopBroadcast();
    }

    // register a new item id
    function registerItem(Game ds, uint64 extensionID) public returns (bytes24 itemKind) {
        return ItemUtils.register(ds, ItemConfig({
            id: extensionID,
            name: "Dismembered Hand",
            icon: "01-140",
            life: 100,
            defense: 1,
            attack: 1,
            stackable: false,
            implementation: address(0),
            plugin: ""
        }));
    }

    // register the new building
    function registerBuilding(Game ds, uint64 extensionID, bytes24 newItem) public returns (bytes24 buildingKind) {

        // find the base item ids we will use as inputs
        bytes24 none = 0x0;
        bytes24 kiki = ItemUtils.Kiki();
        bytes24 superKiki = 0x6a7a67f00005c49300000001000000140000000000000000;
        bytes24 megaKiki = 0x6a7a67f00005c49400000001000000c80000000000000000;
        bytes24 rubberDuck = 0x6a7a67f00005c49200000000000000050000000500000005;


        return BuildingUtils.register(ds, BuildingConfig({
            id: extensionID,
            name: "Crazy Hermit",
            materials: [
                Material({quantity: 10, item: kiki}), // these are what it costs to construct the factory
                Material({quantity: 10, item: ItemUtils.Semiote()}),
                Material({quantity: 10, item: ItemUtils.Bouba()}),
                Material({quantity: 0, item: none})
            ],
            inputs: [
                Input({quantity: 1, item: rubberDuck}), // these are required inputs to get the outpu
                Input({quantity: 1, item: kiki}),
                Input({quantity: 1, item: superKiki}),
                Input({quantity: 1, item: megaKiki})
            ],
            outputs: [
                Output({quantity: 1, item: newItem}) // this is the output that can be crafted given the inputs
            ],
            implementation: address(new CrazyHermit()),
            plugin: vm.readFile("src/CrazyHermit.js")
        }));
    }
}
