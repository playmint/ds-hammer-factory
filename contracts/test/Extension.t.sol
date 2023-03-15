// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {Dispatcher} from "cog/Dispatcher.sol";
import {Game} from "@ds/Game.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, BiomeKind, ResourceKind, AtomKind, DEFAULT_ZONE} from "@ds/schema/Schema.sol";
import {HammerFactory} from "extension/Extension.sol";
import {BUILDING_COST} from "@ds/rules/BuildingRule.sol";

uint64 constant HAMMER_WOOD_QTY = 20;
uint64 constant HAMMER_IRON_QTY = 12;
string constant HAMMER_NAME = "Hammer";

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

    bytes24 buildingInstance;

    // accounts
    address bobAccount;
    bytes24 bobSeeker;
    address aliceAccount;
    bytes24 aliceSeeker;

    function setUp() public {
        // setup dawnseekers
        ds = new Game();
        // state = ds.getState();
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
        // PROBLEM:
        // There is no init for a building so how do I register an item type?

        // -- Setup users

        uint256 alicePrivateKey = 0xA11CE;
        aliceAccount = vm.addr(alicePrivateKey);
        aliceSeeker = _spawnSeeker(aliceAccount, PLAYER_SEEKER_ID, 0, 0, 0);

        uint256 bobPrivateKey = 0xB0B;
        bobAccount = vm.addr(bobPrivateKey);
        bobSeeker = _spawnSeeker(bobAccount, BUILDER_SEEKER_ID, 0, 0, 0);
        // equip the seeker with a bag with enough wood
        _spawnBagWithWood(1, bobAccount, bobSeeker, EQUIP_SLOT_0, BUILDING_COST);

        // -- Construct the building

        // discover an adjacent tile for our building site
        (int16 q, int16 r, int16 s) = (1, -1, 0);
        _discover(q, r, s);

        // construct with bob the builder
        vm.startPrank(bobAccount);
        buildingInstance = _constructBuilding(bobSeeker, hammerFactoryKind, q, r, s);
        vm.stopPrank();

        // Get hammer ID

        // Need to know item recipe to get the ID for the item
        // bytes24[4] memory inputItems;
        // uint64[4] memory inputQty;
        // inputItems[0] = Node.Resource(DSResourceKind.WOOD);
        // inputQty[0] = HAMMER_WOOD_QTY;
        // inputItems[1] = Node.Resource(DSResourceKind.IRON);
        // inputQty[1] = HAMMER_IRON_QTY;
        // bool stackable = false;

        // hammerID = Node.Item(inputItems, inputQty, stackable, HAMMER_NAME);
    }

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

    function testUseFunction() public {
        bytes memory payload = new bytes(0);
        ext.use(ds, buildingInstance, aliceSeeker, payload);
    }

    // -- Helper functions

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
}
