import ds from 'dawnseekers'

export default function update({ selected }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedEngineer = seeker;


    const craft = () => {


        if (!selectedEngineer) {
            ds.log('no selected engineer');
            return;
        }
        if (!selectedBuilding) {
            ds.log('no selected building');
            return;
        }

        //We need the IDs of the Engineer and building
        const engineerBagOwner = selectedEngineer.id;
        const buildingBagOwner = selectedBuilding.id;

        //We use this to create a bag for the building if there isn't one to receive the items
        const dummyBagIdIncaseToBagDoesNotExist = `0x${'00'.repeat(24)}`;


        var bagInputSlot0 = -1;
        var bagInputSlot1 = -1;
        var bagOutputSlot = -1;


        var bagInput0 = -1;
        var bagInput1 = -1;
        var bagOutput = -1;


        for (var j = 0; j < selectedEngineer.bags.length; j++) {
            for (var i = 0; i < 4; i++) {
                if (selectedEngineer.bags[j].bag.slots[i]) {
                    var slot = selectedEngineer.bags[j].bag.slots[i];

                    if (slot.item && slot.item.id === '0x37f9b55d0000000000000000000000000000000000000003' && slot.balance >= 50) {
                        bagInputSlot0 = i;
                        bagInput0 = j;
                    }
                    else if (slot.item && slot.item.id === '0x37f9b55d0000000000000000000000000000000000000001' && slot.balance >= 10) {
                        bagInputSlot1 = i;
                        bagInput1 = j;
                    }
                    else if (!slot.item || slot.balance <= 0) {
                        bagOutputSlot = i;
                        bagOutput = j;
                    }
                }

                else {
                    bagOutputSlot = i;
                    bagOutput = j;
                }
            }
        }




        if (bagInputSlot0 === -1 || bagInputSlot1 === -1) {
            ds.log('Not enough crafting items');
            return;
        }
        else if (bagOutputSlot === -1) {
            ds.log('No empty slot to receive sword');
            return;
        }



        ds.dispatch(
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedEngineer.id,
                    [engineerBagOwner, buildingBagOwner],
                    [bagInput0, 0],
                    [bagInputSlot0, 0],
                    dummyBagIdIncaseToBagDoesNotExist,
                    50,
                ]
            },
            {
                name: 'TRANSFER_ITEM_SEEKER',
                args: [
                    selectedEngineer.id,
                    [engineerBagOwner, buildingBagOwner],
                    [bagInput1, 0],
                    [bagInputSlot1, 1],
                    dummyBagIdIncaseToBagDoesNotExist,
                    10,
                ]
            },
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedEngineer.id, ds.encodeCall(
                    'function CRAFT_ITEM(uint64, uint64, uint8)',
                    [selectedBuilding.bags[0].bag.key, selectedEngineer.bags[bagOutput].bag.key, bagOutputSlot]
                )]
            },
        );

        ds.log('SwordSmith goes brrRRRR!');
    };



    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'swordsmith-tutorial',
                title: 'Tutorial SwordSmith',
                summary: 'Sword requires 50 Iron, 10 Wood, and an empty slot for the crafted sword.',
                content: [
                    {
                        id: 'default',
                        type: 'popout',
                        buttons: [{ text: 'Craft Sword', type: 'action', action: craft }],
                    },
                ],
            },
        ],
    };
}
