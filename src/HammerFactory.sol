// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Game} from "cog/Game.sol";
import {Node, ResourceKind, AtomKind} from "@ds/schema/Schema.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {BuildingKind} from "@ds/ext/BuildingKind.sol";
import {console} from "forge-std/console.sol";


uint8 constant MAX_CRAFT_INPUT_ITEMS = 4; // TODO: move this into crafting rule

//CHANGE THESE

string constant ITEM_NAME = "Hammer";

ResourceKind constant INGREDIENT_0_TYPE = ResourceKind.WOOD;
uint64 constant INGREDIENT_0_QUANTITY = 5;

ResourceKind constant INGREDIENT_1_TYPE = ResourceKind.IRON;
uint64 constant INGREDIENT_1_QUANTITY = 6;

ResourceKind constant INGREDIENT_2_TYPE = ResourceKind.IRON;
uint64 constant INGREDIENT_2_QUANTITY = 0;

ResourceKind constant INGREDIENT_3_TYPE = ResourceKind.IRON;
uint64 constant INGREDIENT_3_QUANTITY = 0;

//




interface ExtensionActions {
    function CRAFT_FUNCTION(
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

        if (INGREDIENT_0_QUANTITY > 0)
        {
            inputItems[0] = Node.Resource(INGREDIENT_0_TYPE);
            inputQty[0] = INGREDIENT_0_QUANTITY;
        }
        if (INGREDIENT_1_QUANTITY > 0)
        {
            inputItems[1] = Node.Resource(INGREDIENT_1_TYPE);
            inputQty[1] = INGREDIENT_1_QUANTITY;
        }
        if (INGREDIENT_2_QUANTITY > 0)
        {
            inputItems[2] = Node.Resource(INGREDIENT_2_TYPE);
            inputQty[2] = INGREDIENT_2_QUANTITY;
        }
        if (INGREDIENT_3_QUANTITY > 0)
        {
            inputItems[3] = Node.Resource(INGREDIENT_3_TYPE);
            inputQty[3] = INGREDIENT_3_QUANTITY;
        }
        

        // Boolean is the 'stackable' flag
        ds.getDispatcher().dispatch(abi.encodeCall(Actions.REGISTER_ITEM, (inputItems, inputQty, false, ITEM_NAME)));

        itemID = Node.Item(inputItems, inputQty, false, ITEM_NAME);
    }


    function use(Game ds, bytes24, /*buildingInstance*/ bytes24, /*seeker*/ bytes calldata payload) public {
        console.log("HammerFactory::use()");
        if (bytes4(payload) == ExtensionActions.CRAFT_FUNCTION.selector) {
            console.log("HammerFactory::use(): ExtensionActions.CRAFT_FUNCTION");

            // decode extension action
            (uint64 inBag, uint64 destBag, uint8 destItemSlot) = abi.decode(payload[4:], (uint64, uint64, uint8));

            // console.log("inBag: ", _toHexString(uint192(inBag), 24));
            // console.log("destBag: ", _toHexString(uint192(destBag), 24));

            ds.getDispatcher().dispatch(
                abi.encodeCall(Actions.CRAFT_EQUIPABLE, (Node.Bag(inBag), itemID, Node.Bag(destBag), destItemSlot))
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
