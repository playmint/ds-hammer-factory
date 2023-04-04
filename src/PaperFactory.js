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
                    2
                ]
            },
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedSeeker.id, ds.encodeCall(
                    'function CRAFT_FUNCTION(uint64, uint64, uint8)',
                    [selectedBuilding.bags[0].bag.key, selectedSeeker.bags[0].bag.key, 1]
                )]
            }
        );
        ds.log('Paper Factory goes brrrrr');
    };

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'paper-factory',
                title: 'Paper Mill',
                summary: 'Pulp your wood to paper. Put 2 wood into your 1st bag slot',
                content: [
                    {
                        id: 'default',
                        type: 'popout',
                        buttons: [{ text: 'Make Paper', type: 'action', action: craft }],
                    },
                ],
            },
        ],
    };
}
