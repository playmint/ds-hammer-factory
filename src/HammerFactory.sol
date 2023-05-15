// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Game} from "cog/Game.sol";
import {Node, ResourceKind, AtomKind} from "@ds/schema/Schema.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {BuildingKind} from "@ds/ext/BuildingKind.sol";
import {console} from "forge-std/console.sol";

uint8 constant MAX_CRAFT_INPUT_ITEMS = 4; // TODO: move this into crafting rule

string constant ITEM_NAME = "Hammer";

interface ExtensionActions {
    function CRAFT_ITEM(
        uint64 inBag,
        uint64 destBag,
        uint8 destItemSlot // empty slot
    ) external;
}

contract HammerFactory is BuildingKind {
    bytes24 public itemID;

    constructor(Game ds) {
        // -- Register the Item
        bytes24[MAX_CRAFT_INPUT_ITEMS] memory inputItems;
        uint64[MAX_CRAFT_INPUT_ITEMS] memory inputQty;

        // Recipe
        inputItems[0] = Node.Resource(ResourceKind.WOOD);
        inputQty[0] = 20;
        inputItems[1] = Node.Resource(ResourceKind.IRON);
        inputQty[1] = 12;

        // Boolean is the 'stackable' flag
        ds.getDispatcher().dispatch(abi.encodeCall(Actions.REGISTER_ITEM, (inputItems, inputQty, false, ITEM_NAME)));

        itemID = Node.Item(inputItems, inputQty, false, ITEM_NAME);
    }

    function use(Game ds, bytes24, /*buildingInstance*/ bytes24, /*seeker*/ bytes calldata payload) public {
        console.log("HammerFactory::use()");
        if (bytes4(payload) == ExtensionActions.CRAFT_ITEM.selector) {
            console.log("HammerFactory::use(): ExtensionActions.CRAFT_ITEM");

            // decode extension action
            (uint64 inBag, uint64 destBag, uint8 destItemSlot) = abi.decode(payload[4:], (uint64, uint64, uint8));

            // console.log("inBag: ", _toHexString(uint192(inBag), 24));
            // console.log("destBag: ", _toHexString(uint192(destBag), 24));

            ds.getDispatcher().dispatch(
                abi.encodeCall(Actions.CRAFT_EQUIPABLE, (Node.Bag(inBag), hammerID, Node.Bag(destBag), destItemSlot))
            );
        }
    }
}
