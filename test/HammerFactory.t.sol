// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {Dispatcher} from "cog/Dispatcher.sol";
import {State} from "cog/State.sol";
import {Game} from "@ds/Game.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, Rel, BiomeKind, DEFAULT_ZONE, Schema} from "@ds/schema/Schema.sol";
import {ItemUtils} from "@ds/utils/ItemUtils.sol";
import {Deployer} from '../script/Deploy.sol';

using Schema for State;

uint32 constant PLAYER_SEEKER_ID = 1;
uint32 constant BUILDER_SEEKER_ID = 2;

uint8 constant EQUIP_SLOT_0 = 0;
uint8 constant EQUIP_SLOT_1 = 1;

uint8 constant ITEM_SLOT_0 = 0;
uint8 constant ITEM_SLOT_1 = 1;

// randomly chosen id for our building kind and plugin ids
uint64 constant BUILDING_KIND_EXTENSION_ID = 45342312;
uint64 constant BUILDING_KIND_PLUGIN_ID = 45342312;


contract HammerFactoryTest is Test {
    Game internal ds;
    Dispatcher internal dispatcher;
    Deployer deployer;
    State internal state;
    uint64 sid;

    function setUp() public {
        ds = new Game();
        state = ds.getState();
        dispatcher = ds.getDispatcher();
        deployer = new Deployer();
    }

    function testConstructAndCraft() public {

        // alice is a player
        uint256 alicePrivateKey = 0xA11CE;
        address aliceAccount = vm.addr(alicePrivateKey);
        vm.startPrank(aliceAccount);

        // alice uses the deploy script to register her new item and building kinds
        bytes24 hammerItem    = deployer.registerHammerItem(ds, BUILDING_KIND_EXTENSION_ID);
        bytes24 hammerFactory = deployer.registerHammerFactory(ds, BUILDING_KIND_EXTENSION_ID, hammerItem);

        // ...she has a seeker at tile 0,0,0
        bytes24 seeker = _spawnSeekerWithResources();

        // ...her seeker constructs an instance of the building on an adjacent tile
        bytes24 buildingInstance = _constructBuilding(hammerFactory, seeker, -1, 1, 0);

        // ...the seeker places the required inputs into the input slots by transfering items
        _transferFromSeekerToInput(seeker, 0, 20, buildingInstance);
        _transferFromSeekerToInput(seeker, 1, 12, buildingInstance);

        // ...she then tells her seeker to "use" the building
        dispatcher.dispatch(abi.encodeCall(Actions.BUILDING_USE, (buildingInstance, seeker, bytes(""))));

        // the output slot should now contain a hammer
        bytes24 outputBag = state.getEquipSlot(buildingInstance, 1);
        (bytes24 outputItem, uint64 outputQty) = state.getItemSlot(outputBag, 0);
        assertEq(outputItem, hammerItem, "Expected item at output slot 0 to be hammer");
        assertEq(outputQty, 1, "Expected hammer item to have a balance of 1");

        // stop being alice
        vm.stopPrank();
    }

    // -- Helper functions

    function _spawnSeekerWithResources() private returns (bytes24) {
        sid++;
        bytes24 seeker = Node.Seeker(sid);
        _discover(0, 0, 0);
        dispatcher.dispatch(abi.encodeCall(Actions.SPAWN_SEEKER, (seeker)));
        bytes24[] memory items = new bytes24[](3);
        items[0] = ItemUtils.Kiki();
        items[1] = ItemUtils.Bouba();
        items[2] = ItemUtils.Semiote();

        uint64[] memory balances = new uint64[](3);
        balances[0] = 100;
        balances[1] = 100;
        balances[2] = 100;

        uint64 seekerBag = uint64(uint256(keccak256(abi.encode(seeker))));
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.DEV_SPAWN_BAG, (seekerBag, state.getOwnerAddress(seeker), seeker, 0, items, balances)
            )
        );

        return seeker;
    }

    function _transferFromSeekerToInput(bytes24 seeker, uint8 slot, uint64 qty, bytes24 buildingInstance) private {
        bytes24 inputBag = state.getEquipSlot(buildingInstance, 0);
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.TRANSFER_ITEM_SEEKER, (seeker, [seeker, buildingInstance], [0, 0], [slot, slot], inputBag, qty)
            )
        );
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

    function _constructBuilding(bytes24 buildingKind, bytes24 seeker, int16 q, int16 r, int16 s)
        private
        returns (bytes24 buildingInstance)
    {
        // force discover target tile
        _discover(q, r, s);
        // get our building and give it the resources to construct
        buildingInstance = Node.Building(0, q, r, s);
        // magic required construction materials into the construct slot
        bytes24 buildingBag = Node.Bag(uint64(uint256(keccak256(abi.encode(buildingInstance)))));
        state.setEquipSlot(buildingInstance, 0, buildingBag);
        state.setItemSlot(buildingBag, 0, ItemUtils.Kiki(), 25);
        state.setItemSlot(buildingBag, 1, ItemUtils.Bouba(), 25);
        state.setItemSlot(buildingBag, 2, ItemUtils.Semiote(), 25);
        // construct our building
        dispatcher.dispatch(abi.encodeCall(Actions.CONSTRUCT_BUILDING_SEEKER, (seeker, buildingKind, q, r, s)));
        return buildingInstance;
    }
}
