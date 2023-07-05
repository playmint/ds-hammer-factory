// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {Dispatcher} from "cog/Dispatcher.sol";
import {State} from "cog/State.sol";
import {Game} from "@ds/Game.sol";
import {Actions} from "@ds/actions/Actions.sol";
import {Node, Rel, BiomeKind, DEFAULT_ZONE, Schema} from "@ds/schema/Schema.sol";
import {ItemUtils} from "@ds/utils/ItemUtils.sol";
import {Deployer} from "../script/Deploy.sol";

using Schema for State;

uint32 constant PLAYER_MOBILE_UNIT_ID = 1;
uint32 constant BUILDER_MOBILE_UNIT_ID = 2;

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

    // accounts
    uint256 alicePrivateKey;
    address aliceAccount;

    function setUp() public {
        // setup users
        alicePrivateKey = 0xA11CE;
        aliceAccount = vm.addr(alicePrivateKey);

        // setup allowlist
        address[] memory allowlist = new address[](1);
        allowlist[0] = aliceAccount;

        ds = new Game(allowlist);
        state = ds.getState();
        dispatcher = ds.getDispatcher();
        deployer = new Deployer();
    }

    function testConstructAndCraft() public {
        // alice is a player
        vm.startPrank(aliceAccount);

        // alice uses the deploy script to register her new item and building kinds
        bytes24 hammerItem = deployer.registerHammerItem(ds, BUILDING_KIND_EXTENSION_ID);
        bytes24 hammerFactory = deployer.registerHammerFactory(ds, BUILDING_KIND_EXTENSION_ID, hammerItem);

        // ...she has a mobileUnit at tile 0,0,0
        bytes24 mobileUnit = _spawnMobileUnitWithResources();

        // ...her mobileUnit constructs an instance of the building on an adjacent tile
        bytes24 buildingInstance = _constructBuilding(hammerFactory, mobileUnit, -1, 1, 0);

        // ...the mobileUnit places the required inputs into the input slots by transfering items
        _transferFromMobileUnitToInput(mobileUnit, 0, 20, buildingInstance);
        _transferFromMobileUnitToInput(mobileUnit, 1, 12, buildingInstance);

        // ...she then tells her mobileUnit to "use" the building
        dispatcher.dispatch(abi.encodeCall(Actions.BUILDING_USE, (buildingInstance, mobileUnit, bytes(""))));

        // the output slot should now contain a hammer
        bytes24 outputBag = state.getEquipSlot(buildingInstance, 1);
        (bytes24 outputItem, uint64 outputQty) = state.getItemSlot(outputBag, 0);
        assertEq(outputItem, hammerItem, "Expected item at output slot 0 to be hammer");
        assertEq(outputQty, 1, "Expected hammer item to have a balance of 1");

        // stop being alice
        vm.stopPrank();
    }

    // -- Helper functions

    function _spawnMobileUnitWithResources() private returns (bytes24) {
        sid++;
        bytes24 mobileUnit = Node.MobileUnit(sid);
        _discover(0, 0, 0);
        dispatcher.dispatch(abi.encodeCall(Actions.SPAWN_MOBILE_UNIT, (mobileUnit)));
        bytes24[] memory items = new bytes24[](3);
        items[0] = ItemUtils.GlassGreenGoo();
        items[1] = ItemUtils.FlaskRedGoo();
        items[2] = 0x0;

        uint64[] memory balances = new uint64[](3);
        balances[0] = 20;
        balances[1] = 12;
        balances[2] = 0;

        uint64 mobileUnitBag = uint64(uint256(keccak256(abi.encode(mobileUnit))));
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.DEV_SPAWN_BAG, (mobileUnitBag, state.getOwnerAddress(mobileUnit), mobileUnit, 0, items, balances)
            )
        );

        return mobileUnit;
    }

    function _transferFromMobileUnitToInput(bytes24 mobileUnit, uint8 slot, uint64 qty, bytes24 buildingInstance) private {
        bytes24 inputBag = state.getEquipSlot(buildingInstance, 0);
        dispatcher.dispatch(
            abi.encodeCall(
                Actions.TRANSFER_ITEM_MOBILE_UNIT, (mobileUnit, [mobileUnit, buildingInstance], [0, 0], [slot, slot], inputBag, qty)
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

    function _constructBuilding(bytes24 buildingKind, bytes24 mobileUnit, int16 q, int16 r, int16 s)
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
        state.setItemSlot(buildingBag, 0, ItemUtils.GlassGreenGoo(), 10);
        state.setItemSlot(buildingBag, 1, ItemUtils.BeakerBlueGoo(), 10);
        state.setItemSlot(buildingBag, 2, ItemUtils.FlaskRedGoo(), 10);

        // construct our building
        dispatcher.dispatch(abi.encodeCall(Actions.CONSTRUCT_BUILDING_MOBILE_UNIT, (mobileUnit, buildingKind, q, r, s)));
        return buildingInstance;
    }
}
