// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {Game} from "@ds/Game.sol";
import {Dispatcher} from "cog/Dispatcher.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, Schema, State} from "@ds/schema/Schema.sol";
import {HammerFactory} from "../src/HammerFactory.sol";

using Schema for State;

contract Deployer is Script {
    function setUp() public {}

    function run() public {
        // configure our deployment by fetch environment variables...

        // PLAYER_DEPLOYMENT_KEY is the private key of a dawnseekers player
        // session to execute the commands as.
        //
        // When deploying to local testnet instances of the game (localhost)
        // you can leave this as the default well-known-and-totally-insecure
        // development key DO NOT ACTUALLY SET THIS TO A _REAL_ KEY UNLESS YOU
        // KNOW WHAT YOU ARE DOING.
        uint256 playerDeploymentKey = vm.envOr(
            "PLAYER_DEPLOYMENT_KEY", uint256(0x24941b1db84a65ded87773081c700c22f50fe26c8f9d471dc480207d96610ffd)
        );

        // GAME_ADDRESS is the address of the dawnseeker's game instance to deploy
        // to. You can find this within the game client by clicking on the
        // version number or about screen.
        //
        // When deploying to local testnet instances of the game (localhost)
        // you may be able to leave this as the default. But if it fails find
        // the game address from the client as mentioned above
        address gameAddr = vm.envOr("GAME_ADDRESS", address(0x1D8e3A7Dc250633C192AC1bC9D141E1f95C419AB));
        Game ds = Game(gameAddr);

        // BUILDING_KIND_NAME sets the name of the building kind that can be seen in the game UI
        // Pick something unique.
        string memory defaultBuildingKindName = "Hammer Factory";
        string memory buildingKindName = vm.envOr("BUILDING_KIND_NAME", defaultBuildingKindName);

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
        uint64 buildingKindExtensionID = uint64(vm.envUint("BUILDING_KIND_EXTENSION_ID"));
        bytes24 buildingKind = Node.BuildingKind(buildingKindExtensionID);

        // BUILDING_KIND_PLUGIN_ID is the unique identifier for your building kind's frontend plugin
        // this can be the same as your building kind extension id if you like
        // (the default), but doesn't have to be, can be any number 1 to 9223372036854775807
        //
        uint64 buildingKindPluginID = uint64(vm.envOr("BUILDING_KIND_PLUGIN_ID", buildingKindExtensionID));
        bytes24 clientPlugin = Node.ClientPlugin(buildingKindPluginID);

        // connect as the player...
        vm.startBroadcast(playerDeploymentKey);

        // connect to the game contract so we can send it commands...
        Game dawnseekers = Game(gameAddr);
        Dispatcher dispatcher = dawnseekers.getDispatcher();

        // set (or update) the building kind
        if (ds.getState().getImplementation(buildingKind) == address(0)) {
            dispatcher.dispatch(abi.encodeCall(Actions.REGISTER_BUILDING_KIND, (buildingKind, buildingKindName)));
        }

        // deploy the extension contract and set as implementation of building kind...
        HammerFactory extensionContract = new HammerFactory(ds);
        dispatcher.dispatch(
            abi.encodeCall(Actions.REGISTER_BUILDING_CONTRACT, (buildingKind, address(extensionContract)))
        );

        // deploy and register the BuildingKind client plugin...
        string memory clientPluginSrc = vm.readFile("src/HammerFactory.js");
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.REGISTER_CLIENT_PLUGIN, (clientPlugin, buildingKind, buildingKindName, clientPluginSrc)
            )
        );

        vm.stopBroadcast();
    }
}
