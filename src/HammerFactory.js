import ds from 'dawnseekers';

export default function update({ selected }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedSeeker = seeker;

    // TODO: stop assuming the things to xfer are in seeker's bag[0].slot[0/1], allow player to select where to xfer from
    // TODO: stop assuming bag[0].slot[2] is empty, find an empty one or allow selecting
    // TODO: validate that the player has enough resources to pay
    // TODO: validate that the player is actually at the location before showing craft button
    // TODO:
    const craft = () => {
        if (!selectedSeeker) {
            ds.log('no selected seeker');
            return;
        }
        if (!selectedBuilding) {
            ds.log('no selected building');
            return;
        }
        if (!selectedSeeker.bags[0] || !selectedBuilding.bags[0].bag) {
            ds.log('no source bag found');
            return;
        }
        if (!selectedBuilding.bags[0] || !selectedBuilding.bags[0].bag) {
            ds.log('no target bag found');
            return;
        }
        ds.dispatch(
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedSeeker.id,
                    [selectedSeeker.id, selectedBuilding.id],
                    [0, 0],
                    [0, 0],
                    20
                ]
            },
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedSeeker.id,
                    [selectedSeeker.id, selectedBuilding.id],
                    [0, 0],
                    [1, 1],
                    12
                ]
            },
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedSeeker.id, ds.encodeCall(
                    'function CRAFT_ITEM(uint64, uint64, uint8)',
                    [selectedBuilding.bags[0].bag.key, selectedSeeker.bags[0].bag.key, 2]
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
