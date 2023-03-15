// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Game} from "cog/Game.sol";
// import {Node, ResourceKind, AtomKind} from "@ds/schema/Schema.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {BuildingKind} from "@ds/ext/BuildingKind.sol";
import {console} from "forge-std/console.sol";

contract HammerFactory is BuildingKind {
    // function onRegister(Game ds) public {
    //     // Get hammer ID

    //     // Need to know item recipe to get the ID for the item
    //     bytes24[4] memory inputItems;
    //     uint64[4] memory inputQty;
    //     inputItems[0] = Node.Resource(DSResourceKind.WOOD);
    //     inputQty[0] = HAMMER_WOOD_QTY;
    //     inputItems[1] = Node.Resource(DSResourceKind.IRON);
    //     inputQty[1] = HAMMER_IRON_QTY;
    //     bool stackable = false;

    //     hammerID = Node.Item(inputItems, inputQty, stackable, HAMMER_NAME);
    // }

    function use(Game ds, bytes24 buildingInstance, bytes24 seeker, bytes memory payload) public {
        console.log("HammerFactory::use()");
    }
}

// error SeekerMustBeLocatedAtBuilding();

// uint64 constant HAMMER_WOOD_QTY = 20;
// uint64 constant HAMMER_IRON_QTY = 12;
// string constant HAMMER_NAME = "Hammer";

// // define an action that seekers can perform at our building

// interface Actions {
//     function CRAFT_HAMMER(
//         bytes24 seekerID,
//         bytes24 buildingID,
//         uint64 inBag,
//         uint64 destBag,
//         uint8 destItemSlot // empty slot
//     ) external;
// }

// // define a rule that implements what happens when the action is executed

// contract CraftRule is Rule {
//     Game dawnseekers;
//     bytes24 hammerID;

//     constructor(Game dawnseekersAddr, bytes24 _hammerID) {
//         dawnseekers = dawnseekersAddr;
//         hammerID = _hammerID;
//     }

//     function reduce(State ourState, bytes calldata action, Context calldata ctx) public returns (State) {
//         console.log("CraftRule::reduce() ", uint32(bytes4(action)));
//         // log which seeker said hello
//         if (bytes4(action) == Actions.CRAFT_HAMMER.selector) {
//             console.log("CraftRule::reduce(): Actions.CRAFT_HAMMER");
//             // decode action
//             (bytes24 seekerID, bytes24 buildingID, uint64 inBag, uint64 destBag, uint8 destItemSlot) =
//                 abi.decode(action[4:], (bytes24, bytes24, uint64, uint64, uint8));

//             // we only want to allow a seeker to "craft" at our building if they are
//             // standing on the same tile as the building.
//             // so check that seeker and building location are the same by talking to dawnseekers' state
//             State ds = dawnseekers.getState();
//             bytes24 seekerTile = DSUtils.getCurrentLocation(ds, seekerID, ctx.clock);
//             bytes24 buildingTile = DSUtils.getFixedLocation(ds, buildingID);
//             if (seekerTile != buildingTile) {
//                 console.log("CraftRule::reduce(): Seeker not at building");
//                 revert SeekerMustBeLocatedAtBuilding();
//             }

//             // store that the seeker is now "checked in" to the building
//             // each seeker can only be "checked in" to one of our buildings at a time
//             craftHammer(DSNode.Bag(inBag), DSNode.Bag(destBag), destItemSlot);
//         }

//         return ourState;
//     }

//     function craftHammer(bytes24 inBag, bytes24 destBag, uint8 destItemSlot) public {
//         console.log("CraftRule::craftHammer(): dispatching CRAFT_EQUIPABLE action");
//         console.log("inBag: ", toHexString(uint192(inBag), 24));
//         console.log("destBag: ", toHexString(uint192(destBag), 24));
//         dawnseekers.getDispatcher().dispatch(
//             abi.encodeCall(DSActions.CRAFT_EQUIPABLE, (inBag, hammerID, destBag, destItemSlot))
//         );
//     }

//     bytes16 private constant _SYMBOLS = "0123456789abcdef";

//     function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
//         bytes memory buffer = new bytes(2 * length + 2);
//         buffer[0] = "0";
//         buffer[1] = "x";
//         for (uint256 i = 2 * length + 1; i > 1; --i) {
//             buffer[i] = _SYMBOLS[value & 0xf];
//             value >>= 4;
//         }
//         require(value == 0, "Strings: hex length insufficient");
//         return string(buffer);
//     }
// }

// // define a Game to advertise our game's state to be indexed, session routing endpoint, and action handlers

// contract Extension is BaseGame {
//     constructor(Game dawnseekers) BaseGame("HammerFactory", "") {
//         console.log("Hammer Factory constructor");
//         // create a state
//         StateGraph state = new StateGraph();

//         // create a session router
//         SessionRouter router = new SessionRouter();

//         bytes24 hammerID = registerItem(dawnseekers);
//         Rule craftRule = new CraftRule(dawnseekers, hammerID);

//         // set plugin URL with our address as a param
//         // FIXME: we probably should not be using the game url for this
//         url = string(abi.encodePacked("http://localhost:3011/", toHexString(uint256(uint160(address(this))), 20)));

//         // configure our dispatcher with state, rules and trust the router
//         BaseDispatcher dispatcher = new BaseDispatcher();
//         dispatcher.registerState(state);
//         dispatcher.registerRule(craftRule);
//         dispatcher.registerRouter(router);

//         // update the game with this config
//         _registerState(state);
//         _registerRouter(router);
//         _registerDispatcher(dispatcher);

//         // register our extension as a building kind
//         dawnseekers.getDispatcher().dispatch(
//             abi.encodeCall(
//                 DSActions.REGISTER_BUILDING_KIND,
//                 (address(this)) // address of thing that will act as building
//             )
//         );
//     }

//     uint8 constant MAX_CRAFT_INPUT_ITEMS = 4;

//     function registerItem(Game dawnseekers) internal returns (bytes24) {
//         bytes24[MAX_CRAFT_INPUT_ITEMS] memory inputItems;
//         uint64[MAX_CRAFT_INPUT_ITEMS] memory inputQty;

//         // Recipe
//         inputItems[0] = DSNode.Resource(DSResourceKind.WOOD);
//         inputQty[0] = HAMMER_WOOD_QTY;
//         inputItems[1] = DSNode.Resource(DSResourceKind.IRON);
//         inputQty[1] = HAMMER_IRON_QTY;

//         // Boolean is the 'stackable' flag
//         dawnseekers.getDispatcher().dispatch(
//             abi.encodeCall(DSActions.REGISTER_ITEM, (inputItems, inputQty, false, HAMMER_NAME))
//         );

//         return DSNode.Item(inputItems, inputQty, false, HAMMER_NAME);
//     }

//     bytes16 private constant _SYMBOLS = "0123456789abcdef";

//     function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
//         bytes memory buffer = new bytes(2 * length + 2);
//         buffer[0] = "0";
//         buffer[1] = "x";
//         for (uint256 i = 2 * length + 1; i > 1; --i) {
//             buffer[i] = _SYMBOLS[value & 0xf];
//             value >>= 4;
//         }
//         require(value == 0, "Strings: hex length insufficient");
//         return string(buffer);
//     }
// }
