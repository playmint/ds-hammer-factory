// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {State} from "cog/State.sol";
import {Dispatcher} from "cog/Dispatcher.sol";
import {Game} from "cog/Game.sol";

import {Game as DawnseekersGame, Actions as DSActions} from "ds-contracts/Game.sol";
import {
    BiomeKind,
    Node as DSKinds,
    Schema as DSUtils,
    ResourceKind as DSResourceKind,
    Rel as DSRel,
    AtomKind as DSAtomKind
} from "ds-contracts/schema/Schema.sol";
import {Actions as DawnseekersActions} from "ds-contracts/actions/Actions.sol";

import {Extension as ExtensionGame, Actions as ExtensionActions} from "extension/Game.sol";

uint64 constant HAMMER_WOOD_QTY = 20;
uint64 constant HAMMER_IRON_QTY = 12;
string constant HAMMER_NAME = "Hammer";

contract ExtensionTest is Test {
    Game internal dsGame;
    Game internal extGame;
    State internal dsState;
    State internal extState;
    bytes24 internal hammerID;

    // accounts
    address aliceAccount;

    function setUp() public {
        // setup dawnseekers
        dsGame = new DawnseekersGame();
        dsState = dsGame.getState();

        extGame = new ExtensionGame(dsGame);
        extState = extGame.getState();

        // setup users
        uint256 alicePrivateKey = 0xA11CE;
        aliceAccount = vm.addr(alicePrivateKey);

        // Get hammer ID

        // Need to know item recipe to get the ID for the item
        bytes24[4] memory inputItems;
        uint64[4] memory inputQty;
        inputItems[0] = DSKinds.Resource(DSResourceKind.WOOD);
        inputQty[0] = HAMMER_WOOD_QTY;
        inputItems[1] = DSKinds.Resource(DSResourceKind.IRON);
        inputQty[1] = HAMMER_IRON_QTY;
        bool stackable = false;

        hammerID = DSKinds.Item(inputItems, inputQty, stackable, HAMMER_NAME);
    }

    function testBuildingKindRegistered() public {
        // expect our building type to already have been registered
        // with our game addr as owner during contract creation
        bytes24 owner = DSUtils.getOwner(dsState, DSKinds.BuildingKind(address(extGame)));
        assertEq(
            owner,
            DSKinds.Player(address(extGame)),
            "expect the owner of the building kind to be the extension contract"
        );
    }

    function testItemRegistered() public {
        uint64[] memory numAtoms = DSUtils.getAtoms(dsState, hammerID);

        assertGt(numAtoms[uint8(DSAtomKind.LIFE)], 0, "Expected LIFE atoms to be greater than 0");
        assertGt(numAtoms[uint8(DSAtomKind.ATK)], 0, "Expected ATK atoms to be greater than 0");
    }

    function testBuildingAction() public {
        // act as the player "alice"
        vm.startPrank(aliceAccount);

        // force tile 0,1,-1 DISCOVERED
        dsGame.getDispatcher().dispatch(
            abi.encodeCall(
                DawnseekersActions.DEV_SPAWN_TILE,
                (
                    BiomeKind.DISCOVERED,
                    0,
                    1,
                    -1 // q,r,s coords
                )
            )
        );

        // create a seeker for alice
        dsGame.getDispatcher().dispatch(
            abi.encodeCall(
                DawnseekersActions.DEV_SPAWN_SEEKER,
                (
                    aliceAccount, // owner
                    1, // seeker id (sid)
                    0,
                    1,
                    -1 // q, r, s coords
                )
            )
        );

        // spawn building instance at location
        // TODO: add a DEV_ action to do this to avoid direct state access
        DSUtils.setFixedLocation(dsState, DSKinds.Building(0, 0, 1, -1), DSKinds.Tile(0, 0, 1, -1));

        bytes24 seekerID = DSKinds.Seeker(1);
        bytes24 destBag = _spawnBagEmpty(1, aliceAccount, seekerID, 0);
        bytes24 inBag = _spawnBagWithResources(
            2, // bagID
            aliceAccount,
            seekerID,
            1, // equip slot 1
            [HAMMER_WOOD_QTY, 0, HAMMER_IRON_QTY]
        );

        // send action to our dispatcher
        extGame.getDispatcher().dispatch(
            abi.encodeCall(
                ExtensionActions.CRAFT_HAMMER,
                (
                    seekerID, // seeker id (sid)
                    DSKinds.Building(0, 0, 1, -1), // building id
                    inBag,
                    destBag,
                    0 // destination slot
                )
            )
        );

        // check that the "balance" relationship exists between seeker's Bag --> Item
        (bytes24 itemID, uint64 bal) = dsState.get(DSRel.Balance.selector, 0, destBag);
        assertEq(itemID, hammerID, "Expected item at slot 0 to be hammer");
        assertEq(bal, 1, "Expected hammer item to have a balance of 1");

        // stop acting as alice
        vm.stopPrank();
    }

    // --  BAG SPAWNING

    function _spawnBagEmpty(uint64 bagID, address owner, bytes24 equipNode, uint8 equipSlot)
        private
        returns (bytes24)
    {
        bytes24[] memory items = new bytes24[](0);
        uint64[] memory balances = new uint64[](0);
        return _spawnBag(bagID, owner, equipNode, equipSlot, items, balances);
    }

    function _spawnBagWithResources(
        uint64 bagID,
        address owner,
        bytes24 equipNode,
        uint8 equipSlot,
        uint64[3] memory resourceQty
    ) private returns (bytes24) {
        bytes24[] memory items = new bytes24[](3);
        uint64[] memory balances = new uint64[](3);

        uint8 slotId = 0;
        for (uint8 i = 0; i < 3; i++) {
            if (resourceQty[i] > 0) {
                items[slotId] = DSKinds.Resource(DSResourceKind(i + 1));
                balances[slotId] = resourceQty[i];
                slotId++;
            }
        }

        return _spawnBag(bagID, owner, equipNode, equipSlot, items, balances);
    }

    function _spawnBag(
        uint64 bagID,
        address owner,
        bytes24 equipNode,
        uint8 equipSlot,
        bytes24[] memory resources,
        uint64[] memory qty
    ) private returns (bytes24) {
        dsGame.getDispatcher().dispatch(
            abi.encodeCall(DSActions.DEV_SPAWN_BAG, (bagID, owner, equipNode, equipSlot, resources, qty))
        );
        return DSKinds.Bag(bagID);
    }
}
