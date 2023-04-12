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
        if (!selectedSeeker.bags[0].bag.slots) {
            ds.log('no items in Seekers first bag');
            return;
        }

        //ds.log(JSON.stringify(selectedSeeker.bags[0].bag));   //Helpful for debugging

        var slotToTakeFrom = -1;
        var slotToGiveTo = -1;

        for (var i = 0; i < selectedSeeker.bags[0].bag.slots.length; i++) {

            if (selectedSeeker.bags[0].bag.slots[i].item && selectedSeeker.bags[0].bag.slots[i].item.id === '0x37f9b55d0000000000000000000000000000000000000001' && selectedSeeker.bags[0].bag.slots[i].balance >= 2) {

                slotToTakeFrom = i;

                if (slotToGiveTo < 0 && selectedSeeker.bags[0].bag.slots[i].balance === 2) {
                    slotToGiveTo = i;
                }
            }
            else if (slotToGiveTo < 0 && selectedSeeker.bags[0].bag.slots[i].balance === 0) {
                slotToGiveTo = i;
            }
        }


        if (slotToTakeFrom < 0) {
            ds.log('Not enough wood');
            return;
        }

        if (slotToGiveTo < 0) {
            ds.log('No empty slot to receive item');
            return;
        }





        ds.dispatch(
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedSeeker.id,
                    [selectedSeeker.id, selectedBuilding.id],
                    [0, 0],
                    [slotToTakeFrom, 0],
                    2
                ]
            },
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedSeeker.id, ds.encodeCall(
                    'function CRAFT_FUNCTION(uint64, uint64, uint8)',
                    [selectedBuilding.bags[0].bag.key, selectedSeeker.bags[0].bag.key, slotToGiveTo]
                )]
            }
        );
        ds.log('Paper Factory goes brrrr...');
    };

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'paper-factory',
                title: 'Paper Mill',
                summary: 'Pulp your wood to paper. This costs 2 wood.',
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
