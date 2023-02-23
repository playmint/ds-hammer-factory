// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { CompoundKeyKind, WeightKind, State } from "cog/State.sol";
import { SessionRouter } from "cog/SessionRouter.sol";
import { BaseDispatcher, Rule, Context } from "cog/Dispatcher.sol";
import { StateGraph } from "cog/StateGraph.sol";
import { Game, BaseGame } from "cog/Game.sol";

import { Schema as DawnseekersUtils, Kind as DawnseekersKind } from "ds-contracts/schema/Schema.sol";
import { Actions as DawnseekersActions } from "ds-contracts/actions/Actions.sol";

import { console } from "forge-std/console.sol";

error SeekerMustBeLocatedAtBuilding();

// define a relationship between two nodes

interface Rel {
    function CheckedIn() external;
}

// define some helpers for working with our state

library Utils {
    function checkInSeekerAtBuilding(State state, bytes24 seekerID, bytes24 buildingID) internal {
        return state.set(Rel.CheckedIn.selector, 0x0, seekerID, buildingID, 0);
    }
    function getWhereSeekerCheckedIn(State state, bytes24 seekerID) internal view returns (bytes24 buildingID) {
        (buildingID,) = state.get(Rel.CheckedIn.selector, 0x0, seekerID);
    }
}

// define an action that seekers can perform at our building

interface Actions {
    function CHECK_IN(bytes24 seekerID, bytes24 buildingID) external;
}

// define a rule that implements what happens when the action is executed

contract CheckInRule is Rule {

    Game dawnseekers;

    constructor(Game dawnseekersAddr) {
        dawnseekers = dawnseekersAddr;
    }

    function reduce(State ourState, bytes calldata action, Context calldata ctx) public returns (State) {

        // log which seeker said hello
        if (bytes4(action) == Actions.CHECK_IN.selector) {
            // decode action
            (bytes24 seekerID, bytes24 buildingID) = abi.decode(action[4:], (bytes24, bytes24));

            // we only want to allow a seeker to "check in" to our building if they are
            // standing on the same tile as the building.
            // so check that seeker and building location are the same by talking to dawnseekers' state
            State ds = dawnseekers.getState();
            bytes24 seekerTile = DawnseekersUtils.getCurrentLocation(ds, seekerID, ctx.clock);
            bytes24 buildingTile = DawnseekersUtils.getFixedLocation(ds, buildingID);
            if (seekerTile != buildingTile) {
                revert SeekerMustBeLocatedAtBuilding();
            }

            // store that the seeker is now "checked in" to the building
            // each seeker can only be "checked in" to one of our buildings at a time
            Utils.checkInSeekerAtBuilding(ourState, seekerID, buildingID);
        }

        return ourState;
    }

}

// define a Game to advertise our game's state to be indexed, session routing endpoint, and action handlers

contract Extension is BaseGame {

    constructor(Game dawnseekers) BaseGame("MyDawnseekersExtension", "") {
        // create a state
        StateGraph state = new StateGraph();

        // create a session router
        SessionRouter router = new SessionRouter();

        // create a rule to handle the SIGN_GUESTBOOK action
        Rule guestbookRule = new CheckInRule(dawnseekers);

        // set plugin URL with our address as a param
        // FIXME: we probably should not be using the game url for this
        url = string(abi.encodePacked("http://localhost:3011/", toHexString(uint256(uint160(address(this))), 20)));

        // configure our dispatcher with state, rules and trust the router
        BaseDispatcher dispatcher = new BaseDispatcher();
        dispatcher.registerState(state);
        dispatcher.registerRule(guestbookRule);
        dispatcher.registerRouter(router);

        // update the game with this config
        _registerState(state);
        _registerRouter(router);
        _registerDispatcher(dispatcher);

        // register the ds node types we are borrowing
        state.registerNodeType(DawnseekersKind.Seeker.selector, "Seeker", CompoundKeyKind.UINT160);
        state.registerNodeType(DawnseekersKind.Building.selector, "Building", CompoundKeyKind.INT16_ARRAY);

        // register our "CheckedIn" edge
        state.registerEdgeType(Rel.CheckedIn.selector, "CheckedIn", WeightKind.UINT64);

        // register our extension as a building kind
        dawnseekers.getDispatcher().dispatch(
            abi.encodeCall(DawnseekersActions.REGISTER_BUILDING_KIND, (
                address(this) // address of thing that will act as building
            ))
        );

    }

    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

}

