// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Game} from "cog/Game.sol";
import {Game as BaseGame} from "@ds/Game.sol";
import {State} from "cog/State.sol";
import {Dispatcher} from "cog/Dispatcher.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {BuildingKind} from "@ds/ext/BuildingKind.sol";
import {Schema, Node} from "@ds/schema/Schema.sol";
import {ItemUtils, ItemConfig} from "@ds/utils/ItemUtils.sol";

using Schema for State;

interface BuildingActions {
    function SendMessage(string memory message) external;
}

contract BuildingKindImplementation is BuildingKind {

    bytes24 entity;
    string[] messages;

    function use(Game ds, bytes24 /*buildingInstance*/, bytes24, /*seeker*/ bytes calldata payload ) public {

        // grab the dispatcher n state
        Dispatcher dispatcher = ds.getDispatcher();
        State state = ds.getState();

        // grab the incoming message
        string memory message = abi.decode(payload[4:], (string));

        // append message to the list
        messages.push(message);

        // build the chat
        string memory transcript = "";
        for (uint i=0; i<messages.length; i++) {
            transcript = string(abi.encodePacked(transcript, messages[i], "|"));
        }

        // we are using a item's "name" annotation as a place to store data that can be read by a client plugin
        // this is a horrible hack and probably makes no sence to look at... don't judge me, we need Books
        if (entity == 0) {
            bytes24 radioWave = 0x6a7a67f0211d1ae300000001000000640000006400000064;
            if (state.getOwner(radioWave) != 0) {
                entity = radioWave;
            } else {
                dispatcher.dispatch(abi.encodeCall(Actions.REGISTER_ITEM_KIND, (radioWave, "RadioWave", "")));
                bytes24[4] memory materialItem;
                materialItem[0] = 0x6a7a67f0cca240f900000001000000020000000000000000; // green goo
                materialItem[1] = 0x6a7a67f0e0f51af400000001000000000000000200000000; // blue goo
                materialItem[2] = 0x6a7a67f0006f223600000001000000000000000000000002; // red goo
                uint64[4] memory materialQty;
                materialQty[0] = 25;
                materialQty[1] = 25;
                materialQty[2] = 25;
                bytes24 buildingKind = 0xbe92755c000000000000000000000000b1f218e583f71672;
                dispatcher.dispatch(
                    abi.encodeCall(Actions.REGISTER_BUILDING_KIND, (buildingKind, "Transmission Tower", materialItem, materialQty))
                );
                bytes24[4] memory inputItem;
                inputItem[0] = 0x6a7a67f0cca240f900000001000000020000000000000000; // green goo
                inputItem[1] = 0x6a7a67f0e0f51af400000001000000000000000200000000; // blue goo
                inputItem[2] = 0x6a7a67f0006f223600000001000000000000000000000002; // red goo
                uint64[4] memory inputQty;
                inputQty[0] = 100;
                inputQty[1] = 100;
                inputQty[2] = 100;
                bytes24 outputItem = radioWave;
                uint64 outputQty = 1;
                dispatcher.dispatch(
                    abi.encodeCall(
                        Actions.REGISTER_CRAFT_RECIPE, (buildingKind, inputItem, inputQty, outputItem, outputQty)
                    )
                );
                entity = radioWave;
            }
        }

        // store the transcript in the name annotation of the entity we own ... again, don't judge me
        dispatcher.dispatch(abi.encodeCall(Actions.NAME_OWNED_ENTITY, (entity, transcript)));
    }

}
