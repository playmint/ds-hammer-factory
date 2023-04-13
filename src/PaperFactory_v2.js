import ds from 'dawnseekers';

export default function update({ selected }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedSeeker = seeker;


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
        if (!selectedSeeker.bags) {
            ds.log('Seeker has no bags');
            return;
        }
        if (!selectedBuilding.bags[0].bag) {
            ds.log('Building has no bag available to craft');
        }


        ds.log(JSON.stringify(selectedSeeker.bags[0].bag));   //Helpful for debugging
        ds.log(JSON.stringify(selectedSeeker.bags[1].bag));   //Helpful for debugging


        var bagToTakeFrom = -1;
        var slotToTakeFrom = -1;

        var bagToGiveTo = -1;
        var slotToGiveTo = -1;

        var foundMatchingStack = false;



        //Paper ID
        //'0x6a7a67f0399c54b001506170657200000000000000000000'


        for (var bagIndex = 0; bagIndex < selectedSeeker.bags.length; bagIndex++)
        {
            if (selectedSeeker.bags[bagIndex].bag.slots)
            {
                for (var slotIndex = 0; slotIndex < selectedSeeker.bags[bagIndex].bag.slots.length; slotIndex++)
                {
                    var thisSlot = selectedSeeker.bags[bagIndex].bag.slots[slotIndex];

                    if (bagToTakeFrom < 0 && thisSlot.item && thisSlot.item.id === '0x37f9b55d0000000000000000000000000000000000000001' && thisSlot.balance >= 2)
                    {
                        bagToTakeFrom = bagIndex;
                        slotToTakeFrom = slotIndex;

                        if (bagToGiveTo < 0 && !foundMatchingStack && thisSlot.balance === 2)
                        {
                            bagToGiveTo = bagIndex;
                            slotToGiveTo = slotIndex;
                        }
                    }

                    if (bagToGiveTo < 0 && !foundMatchingStack && thisSlot.balance === 0)
                    {
                        bagToGiveTo = bagIndex;
                        slotToGiveTo = slotIndex;
                    }

                    if (!foundMatchingStack && thisSlot.item && thisSlot.item.id === '0x6a7a67f0399c54b001506170657200000000000000000000' && thisSlot.balance < 100)
                    {
                        bagToGiveTo = bagIndex;
                        slotToGiveTo = slotIndex;
                        foundMatchingStack = true;
                    }
                }
            }
        }

        //Check to use an unused slot if needed
        if (bagToGiveTo < 0 && selectedSeeker.bags[0].bag.slots.length < 4)
        {
            bagToGiveTo = 0;
            slotToGiveTo = selectedSeeker.bags[0].bag.slots.length;
        }
        else if (bagToGiveTo < 0 && selectedSeeker.bags[1].bag.slots.length < 4)
        {
            bagToGiveTo = 1;
            slotToGiveTo = selectedSeeker.bags[0].bag.slots.length;
        }




        if (bagToTakeFrom < 0) {
            ds.log('Not enough wood');
            return;
        }

        if (bagToGiveTo < 0) {
            ds.log('No empty slot to receive item');
            return;
        }




        ds.dispatch(
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedSeeker.id,
                    [selectedSeeker.id, selectedBuilding.id],
                    [bagToTakeFrom, 0],
                    [slotToTakeFrom, 0],
                    2
                ]
            },
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedSeeker.id, ds.encodeCall(
                    'function CRAFT_FUNCTION(uint64, uint64, uint8)',
                    [selectedBuilding.bags[0].bag.key, selectedSeeker.bags[bagToGiveTo].bag.key, slotToGiveTo]
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
