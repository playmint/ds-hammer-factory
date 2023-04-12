// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Game} from "cog/Game.sol";
import {Node, ResourceKind, AtomKind} from "@ds/schema/Schema.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {BuildingKind} from "@ds/ext/BuildingKind.sol";
import {console} from "forge-std/console.sol";


uint8 constant MAX_CRAFT_INPUT_ITEMS = 4; // TODO: move this into crafting rule


string constant ITEM_NAME = "Paper";




interface ExtensionActions {
    function CRAFT_FUNCTION(
        uint64 inBag,
        uint64 destBag,
        uint8 destItemSlot // empty slot
    ) external;
}

contract PaperFactoryV2 is BuildingKind {
    bytes24 public itemID;

    constructor(Game ds) {
        // -- Register the Item
        bytes24[MAX_CRAFT_INPUT_ITEMS] memory inputItems;
        uint64[MAX_CRAFT_INPUT_ITEMS] memory inputQty;

        inputItems[0] = Node.Resource(ResourceKind.WOOD);
        inputQty[0] = 2;


        // Boolean is the 'stackable' flag
        ds.getDispatcher().dispatch(abi.encodeCall(Actions.REGISTER_ITEM, (inputItems, inputQty, true, ITEM_NAME)));

        itemID = Node.Item(inputItems, inputQty, true, ITEM_NAME);
    }


    function use(Game ds, bytes24, /*buildingInstance*/ bytes24, /*seeker*/ bytes calldata payload) public {
        console.log("PaperFactoryV2::use()");
        if (bytes4(payload) == ExtensionActions.CRAFT_FUNCTION.selector) {
            console.log("PaperFactoryV2::use(): ExtensionActions.CRAFT_FUNCTION");

            // decode extension action
            (uint64 inBag, uint64 destBag, uint8 destItemSlot) = abi.decode(payload[4:], (uint64, uint64, uint8));

            // console.log("inBag: ", _toHexString(uint192(inBag), 24));
            // console.log("destBag: ", _toHexString(uint192(destBag), 24));

            ds.getDispatcher().dispatch(
                abi.encodeCall(Actions.CRAFT_STACKABLE, (Node.Bag(inBag), itemID, 1, Node.Bag(destBag), destItemSlot))
            );
        }
    }

    // For debugging
    // bytes16 private constant _SYMBOLS = "0123456789abcdef";
    // function _toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
    //     bytes memory buffer = new bytes(2 * length + 2);
    //     buffer[0] = "0";
    //     buffer[1] = "x";
    //     for (uint256 i = 2 * length + 1; i > 1; --i) {
    //         buffer[i] = _SYMBOLS[value & 0xf];
    //         value >>= 4;
    //     }
    //     require(value == 0, "Strings: hex length insufficient");
    //     return string(buffer);
    // }
}
