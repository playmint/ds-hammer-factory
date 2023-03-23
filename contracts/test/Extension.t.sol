// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {Dispatcher} from "cog/Dispatcher.sol";
import {State} from "cog/State.sol";
import {Game} from "@ds/Game.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, Rel, BiomeKind, ResourceKind, AtomKind, DEFAULT_ZONE, Schema} from "@ds/schema/Schema.sol";
import {BUILDING_COST} from "@ds/rules/BuildingRule.sol";
import {HammerFactory, ExtensionActions, HAMMER_WOOD_QTY, HAMMER_IRON_QTY, HAMMER_NAME} from "extension/Extension.sol";

uint32 constant PLAYER_SEEKER_ID = 1;
uint32 constant BUILDER_SEEKER_ID = 2;

uint8 constant EQUIP_SLOT_0 = 0;
uint8 constant EQUIP_SLOT_1 = 1;

uint8 constant ITEM_SLOT_0 = 0;
uint8 constant ITEM_SLOT_1 = 1;

contract HammerFactoryTest is Test {
    HammerFactory internal ext;
    Game internal ds;
    Dispatcher internal dispatcher;
    State internal state;

    bytes24 buildingInstance;

    // accounts
    address bobAccount;
    bytes24 bobSeeker;
    address aliceAccount;
    bytes24 aliceSeeker;

    bytes24 hammerID;

    function setUp() public {
        // setup dawnseekers
        ds = new Game();
        state = ds.getState();
        dispatcher = ds.getDispatcher();

        ext = new HammerFactory(); // As the tets call `use()` directly I'm caching a ref to the extension

        // deploy and register the HammerFactory as a building kind
        bytes24 hammerFactoryKind = Node.BuildingKind(2);
        // vm.expectEmit(true, true, true, true, address(state));
        // emit AnnotationSet(hammerFactoryKind, AnnotationKind.CALLDATA, "name", keccak256(bytes(buildingName)), buildingName);
        dispatcher.dispatch(abi.encodeCall(Actions.REGISTER_BUILDING_KIND, (hammerFactoryKind, "hammerFactory")));
        dispatcher.dispatch(abi.encodeCall(Actions.REGISTER_BUILDING_CONTRACT, (hammerFactoryKind, address(ext))));
        dispatcher.dispatch(
            abi.encodeCall(Actions.REGISTER_BUILDING_PLUGIN, (hammerFactoryKind, Node.ClientPlugin(1), "{}"))
        );
        ext.onRegister(ds);

        hammerID = ext.hammerID();
        assertGt(uint192(hammerID), 0, "Bytes expected to be the hammer ID");

        // discover an adjacent tile for our building site
        (int16 q, int16 r, int16 s) = (1, -1, 0);
        _discover(q, r, s);

        // -- Setup users

        uint256 alicePrivateKey = 0xA11CE;
        aliceAccount = vm.addr(alicePrivateKey);
        // Spawn alice's seeker on the tile on which the building will be constructed
        aliceSeeker = _spawnSeeker(aliceAccount, PLAYER_SEEKER_ID, q, r, s);

        uint256 bobPrivateKey = 0xB0B;
        bobAccount = vm.addr(bobPrivateKey);
        bobSeeker = _spawnSeeker(bobAccount, BUILDER_SEEKER_ID, 0, 0, 0);
        // equip the seeker with a bag with enough wood
        _spawnBagWithWood(1, bobAccount, bobSeeker, EQUIP_SLOT_0, BUILDING_COST);

        // -- Construct the building with bob the builder

        vm.startPrank(bobAccount);
        buildingInstance = _constructBuilding(bobSeeker, hammerFactoryKind, q, r, s);
        assertGt(uint192(buildingInstance), 0, "Bytes expected to be the building instance");
        vm.stopPrank();
    }

    function testItemRegistered() public {
        uint64[] memory numAtoms = Schema.getAtoms(state, hammerID);

        assertGt(numAtoms[uint8(AtomKind.LIFE)], 0, "Expected LIFE atoms to be greater than 0");
        assertGt(numAtoms[uint8(AtomKind.ATK)], 0, "Expected ATK atoms to be greater than 0");
    }

    function testBuildingUse() public {
        uint64 destBagID = 1;
        bytes24 destBag = _spawnBagEmpty(destBagID, aliceAccount, aliceSeeker, 0);
        uint64 inBagID = 2;
        _spawnBagWithResources(
            inBagID,
            aliceAccount,
            aliceSeeker,
            1, // equip slot 1
            [HAMMER_WOOD_QTY, 0, HAMMER_IRON_QTY]
        );

        // TODO: Currently anyone can craft from anyone else bag! CraftingRule to check that inBag is owned by Alice
        bytes memory payload = abi.encodeCall(
            ExtensionActions.CRAFT_HAMMER,
            (
                inBagID,
                destBagID,
                0 // destination slot
            )
        );

        // act as the player "alice"
        vm.startPrank(aliceAccount);
        dispatcher.dispatch(abi.encodeCall(Actions.BUILDING_USE, (buildingInstance, aliceSeeker, payload)));

        // check that the "balance" relationship exists between seeker's Bag --> Item
        (bytes24 itemID, uint64 bal) = state.get(Rel.Balance.selector, 0, destBag);
        assertEq(itemID, hammerID, "Expected item at slot 0 to be hammer");
        assertEq(bal, 1, "Expected hammer item to have a balance of 1");

        // stop acting as alice
        vm.stopPrank();
    }

    // -- Helper functions

    function _constructBuilding(bytes24 seeker, bytes24 buildingKind, int16 q, int16 r, int16 s)
        private
        returns (bytes24 _buildingInstance)
    {
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.CONSTRUCT_BUILDING_SEEKER,
                (
                    seeker,
                    buildingKind,
                    seeker, // which thing is bag attached to
                    EQUIP_SLOT_0, // which equip slot on the thing
                    ITEM_SLOT_0, // which item slot contains resource
                    q,
                    r,
                    s
                )
            )
        );

        // make full building id
        _buildingInstance = Node.Building(DEFAULT_ZONE, q, r, s);
    }

    function _spawnSeeker(address owner, uint32 sid, int16 q, int16 r, int16 s) private returns (bytes24) {
        _discover(q, r, s); // discover the tile we place seeker on
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.DEV_SPAWN_SEEKER,
                (
                    owner, // owner
                    sid, // seeker id (sid)
                    q, // q
                    r, // r
                    s // s
                )
            )
        );
        return Node.Seeker(sid);
    }

    function _discover(int16 q, int16 r, int16 s) private {
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.DEV_SPAWN_TILE,
                (
                    BiomeKind.DISCOVERED,
                    q, // q
                    r, // r
                    s // s
                )
            )
        );
    }

    function _spawnBagWithWood(uint64 bagID, address owner, bytes24 equipNode, uint8 equipSlot, uint64 qty)
        private
        returns (bytes24)
    {
        bytes24[] memory items = new bytes24[](1);
        items[0] = Node.Resource(ResourceKind.WOOD);
        uint64[] memory balances = new uint64[](1);
        balances[0] = qty;
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
                items[slotId] = Node.Resource(ResourceKind(i + 1));
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
        dispatcher.dispatch(abi.encodeCall(Actions.DEV_SPAWN_BAG, (bagID, owner, equipNode, equipSlot, resources, qty)));
        return Node.Bag(bagID);
    }

    function _spawnBagEmpty(uint64 bagID, address owner, bytes24 equipNode, uint8 equipSlot)
        private
        returns (bytes24)
    {
        bytes24[] memory items = new bytes24[](0);
        uint64[] memory balances = new uint64[](0);
        return _spawnBag(bagID, owner, equipNode, equipSlot, items, balances);
    }
}
