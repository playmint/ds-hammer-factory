import ds from 'dawnseekers';

export default function update({ selected, world }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile?.building;
    const selectedEngineer = seeker;

    // fetch the expected inputs item kinds
    const requiredInputs = selectedBuilding?.kind?.inputs || [];
    const want0 = requiredInputs.find(inp => inp.key == 0);
    const want1 = requiredInputs.find(inp => inp.key == 1);
    const want2 = requiredInputs.find(inp => inp.key == 2);

    // fetch what is currently in the input slots
    const inputSlots = selectedBuilding?.bags.find(b => b.key == 0).bag?.slots || [];
    const got0 = inputSlots?.find(slot => slot.key == 0);
    const got1 = requiredInputs.find(inp => inp.key == 1);
    const got2 = requiredInputs.find(inp => inp.key == 2);

    // fetch our output item details
    const expectedOutputs = selectedBuilding?.kind?.outputs || [];
    const out0 = expectedOutputs?.find(slot => slot.key == 0);

    // try to detect if the input slots contain enough stuff to craft
    const canCraft = selectedEngineer
        && want0 && got0 && want0.balance == got0.balance
        && want1 && got1 && want1.balance == got1.balance
        && want2 && got2 && want2.balance == got2.balance;

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

        ds.log('Fission in progress');
    };

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'unobtanium-fabricator',
                title: 'Unobtanium Fabricator',
                summary: `Creates a powerful metal to make powerful stuff with`,
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        buttons: [{ text: 'Make It', type: 'action', action: craft, disabled: !canCraft }],
                    },
                ],
            },
        ],
    };
}

