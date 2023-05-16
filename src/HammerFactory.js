import ds from 'dawnseekers';

export default function update({ selected }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedEngineer = seeker;

    // TODO: stop assuming the things to xfer are in seeker's bag[0].slot[0/1], allow player to select where to xfer from
    // TODO: stop assuming bag[0].slot[2] is empty, find an empty one or allow selecting
    // TODO: validate that the player has enough resources to pay
    // TODO: validate that the player is actually at the location before showing craft button
    // TODO:
    const craft = () => {
        if (!selectedEngineer) {
            ds.log('no selected engineer');
            return;
        }
        if (!selectedBuilding) {
            ds.log('no selected building');
            return;
        }
        if (!selectedEngineer.bags[0] || !selectedBuilding.bags[0].bag) {
            ds.log('no source bag found');
            return;
        }
        if (!selectedBuilding.bags[0] || !selectedBuilding.bags[0].bag) {
            ds.log('no target bag found');
            return;
        }

        //We need the IDs of the Engineer and building
        const engineerBagOwner = selectedEngineer.id;
        const buildingBagOwner = selectedBuilding.id;

        //The engineer's bag we are interacting with (0 = top bag, 1 = bottom bag)
        const engineerBag = 0;

        //The slot and quantity for the first Input item
        const bagInputSlot0 = 0;
        const inputQuantity0 = 20;

        //The slot and quantity for the second Input item
        const bagInputSlot1 = 1;
        const inputQuantity1 = 12;

        //The slot that will receive crafted item
        const bagOutputSlot = 2

        const dummyBagIdIncaseToBagDoesNotExist = `0x${'00'.repeat(24)}`;



        ds.dispatch(
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedEngineer.id,
                    [engineerBagOwner, buildingBagOwner],
                    [engineerBag, engineerBag],
                    [bagInputSlot0, bagInputSlot0],
                    dummyBagIdIncaseToBagDoesNotExist,
                    inputQuantity0,
                ]
            },
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedEngineer.id,
                    [engineerBagOwner, buildingBagOwner],
                    [engineerBag, engineerBag],
                    [bagInputSlot1, bagInputSlot1],
                    dummyBagIdIncaseToBagDoesNotExist,
                    inputQuantity1,
                ]
            },
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedEngineer.id, ds.encodeCall(
                    'function CRAFT_ITEM(uint64, uint64, uint8)',
                    [selectedBuilding.bags[0].bag.key, selectedEngineer.bags[0].bag.key, bagOutputSlot]
                )]
            },
        );
        ds.log('HammerFactory says: Hammer Time!');
    };

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'my-hammer-factory',
                title: 'Hammer Factory',
                summary: 'Arrange your bag with 20 Wood in first slot and 12 Iron in second slot then click craft to have a Hammer placed in an empty third slot.',
                content: [
                    {
                        id: 'default',
                        type: 'popout',
                        buttons: [{ text: 'Craft Hammer', type: 'action', action: craft }],
                    },
                ],
            },
        ],
    };
}
