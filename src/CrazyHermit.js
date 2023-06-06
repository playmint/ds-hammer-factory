import ds from 'dawnseekers';

export default function update({ selected, world }) {



    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile?.building;
    const selectedEngineer = seeker;


    //Show this if the engineer is not on the building's tile
    if (selectedEngineer.nextLocation.tile.id !== selectedTile.id) {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'crazy-hermit',
                    title: 'Crazy Hermit',
                    summary: 'A sign outside gives some simple instructions: \"LEAVE ME ALONE!\"'
                },
            ],
        };
    }

    //Look for a rubber duck in their bags
    var hasRubberDuck = false
    for (var j = 0; j < selectedEngineer.bags.length; j++) {
        for (var i = 0; i < 4; i++) {
            if (selectedEngineer.bags[j].bag.slots[i]) {
                var slot = selectedEngineer.bags[j].bag.slots[i];

                if (slot.item && slot.item.id === '0x6a7a67f00005c49200000000000000050000000500000005' && slot.balance >= 1) {
                    hasRubberDuck = true;
                }
            }
        }
    }

    //Show this if there's no rubber duck
    if (!hasRubberDuck) {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'crazy-hermit',
                    title: 'Crazy Hermit',
                    summary: 'The crazy hermit shouts \"GO AWAY!\".\nBefore he shuts the door in your face you briefly catch a glimpse of what you presume to be an extensive rubber duck collection'
                },
            ],
        };
    }
    

    // fetch the expected inputs item kinds
    const requiredInputs = selectedBuilding?.kind?.inputs || [];
    const want0 = requiredInputs.find(inp => inp.key == 0);
    const want1 = requiredInputs.find(inp => inp.key == 1);
    const want2 = requiredInputs.find(inp => inp.key == 2);
    const want3 = requiredInputs.find(inp => inp.key == 3);

    // fetch what is currently in the input slots
    const inputSlots = selectedBuilding?.bags.find(b => b.key == 0).bag?.slots || [];
    const got0 = inputSlots?.find(slot => slot.key == 0);
    const got1 = inputSlots?.find(slot => slot.key == 1);
    const got2 = inputSlots?.find(slot => slot.key == 2);
    const got3 = inputSlots?.find(slot => slot.key == 3);

    // fetch our output item details
    const expectedOutputs = selectedBuilding?.kind?.outputs || [];
    const out0 = expectedOutputs?.find(slot => slot.key == 0);

    // try to detect if the input slots contain enough stuff to craft
    const canCraft = selectedEngineer
        && want0 && got0 && want0.balance == got0.balance
        && want1 && got1 && want1.balance == got1.balance
        && want2 && got2 && want2.balance == got2.balance
        && want3 && got3 && want3.balance == got3.balance;

    const craft = () => {
        if (!selectedEngineer) {
            ds.log('no selected engineer');
            return;
        }
        if (!selectedBuilding) {
            ds.log('no selected building');
            return;
        }

        ds.dispatch(
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedEngineer.id, []]
            },
        );

        ds.log('The hermit cuts off his hand and gives it to you.');
    };

    //Show this if there's a rubber duck
    if (hasRubberDuck) {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'crazy-hermit',
                    title: 'Crazy Hermit',
                    summary: 'The crazy hermit looks in wonder at your rubber duck.\n"GIVE DUCK AND KIKIS?\" he asks.\nHe holds his hand out as if to offer a trade.',
                    content: [
                        {
                            id: 'default',
                            type: 'inline',
                            buttons: [{ text: 'It\'s a deal!', type: 'action', action: craft, disabled: !canCraft }],
                        },
                    ],
                },
            ],
        };
    }
}

