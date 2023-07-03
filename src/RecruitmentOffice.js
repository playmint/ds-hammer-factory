import ds from 'dawnseekers';

export default function update({ selected, world }) {

    //Function to test the distance between two tiles
    function distance(a, b) {
        return (
            (Math.abs(Number(BigInt.asIntN(16, a.coords[1])) - Number(BigInt.asIntN(16, b.coords[1]))) +
                Math.abs(Number(BigInt.asIntN(16, a.coords[2])) - Number(BigInt.asIntN(16, b.coords[2]))) +
                Math.abs(Number(BigInt.asIntN(16, a.coords[3])) - Number(BigInt.asIntN(16, b.coords[3])))) /
            2
        );
    }

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedMobileUnit = seeker;
    const selectedBuilding = selectedTile?.building;








    //craft function - can be called if the unit is powerful enough
    const craft = () => {
        if (!selectedMobileUnit) {
            ds.log('no selected unit');
            return;
        }
        if (!selectedBuilding) {
            ds.log('no selected building');
            return;
        }

        ds.dispatch(
            {
                name: 'BUILDING_USE',
                args: [selectedBuilding.id, selectedMobileUnit.id, []]
            },
        );
    };


    var mobileUnitDistance = 0;
    if (selectedMobileUnit) {
        mobileUnitDistance = distance(selectedMobileUnit.nextLocation.tile, selectedTile);
    }


    //Show this if there is no selected engineer OR the engineer is not adjacent to the building's tile
    if (!selectedMobileUnit || mobileUnitDistance > 1) {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'recruitment-office',
                    title: 'Recruitment Office',
                    summary: "We only recruit the best! Show us what you're made of soldier!!"
                },
            ],
        };
    }

    //Add up the goo on their equipable items
    var totalGreenGoo = 0;
    var totalBlueGoo = 0;
    var totalRedGoo = 0;


    for (var j = 0; j < selectedMobileUnit.bags.length; j++) {
        for (var i = 0; i < 4; i++) {
            if (selectedMobileUnit.bags[j].bag.slots[i]) {
                var slot = selectedMobileUnit.bags[j].bag.slots[i];

                if (slot.item && slot.balance > 0) {

                    var id = slot.item.id;

                    var [stackable, greenGoo, blueGoo, redGoo] = [...id]
                        .slice(2)
                        .reduce((bs, b, idx) => {
                            if (idx % 8 === 0) {
                                bs.push('0x');
                            }
                            bs[bs.length - 1] += b;
                            return bs;
                        }, [])
                        .map((n) => BigInt(n))
                        .slice(-4);

                    if (!stackable) {
                        totalGreenGoo += parseInt(greenGoo, 10);
                        totalBlueGoo += parseInt(blueGoo, 10);
                        totalRedGoo += parseInt(redGoo, 10);
                    }               
                }
            }
        }
    }

    var statsHtml = "<p>Your equipment has:<br>" +
        "<ul style=\"padding-left: 35px\">" +
        "<li>Green Goo: " + totalGreenGoo +
        "<li>Blue Goo: " + totalBlueGoo +
        "<li>Red Goo: " + totalRedGoo +
        "</ul>";

    var totalGoo = totalGreenGoo + totalBlueGoo + totalRedGoo;

    if (totalGoo < 100) {
        statsHtml += "<br>PUNY WEAKLING!! You need to be at least " + (100 - totalGoo) + " goo stronger!</p>";

        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'recruitment-office',
                    title: 'Recruitment Office',
                    summary: 'USE me and we\'ll see if you\'re strong enough to join our team',
                    content: [
                        {
                            id: 'default',
                            type: 'inline',
                            html: statsHtml
                        },
                    ],
                },
            ],
        };

    }
    else {        
        statsHtml += "<br>You are tough enough to join us!</p>";

        // fetch the expected inputs item kinds
        const requiredInputs = selectedBuilding?.kind?.inputs || [];
        const want0 = requiredInputs.find(inp => inp.key == 0);

        // fetch what is currently in the input slots
        const inputSlots = selectedBuilding?.bags.find(b => b.key == 0).bag?.slots || [];
        const got0 = inputSlots?.find(slot => slot.key == 0);

        // fetch our output item details
        const expectedOutputs = selectedBuilding?.kind?.outputs || [];
        const out0 = expectedOutputs?.find(slot => slot.key == 0);

        // try to detect if the input slots contain enough stuff to craft
        const canCraft = selectedMobileUnit && want0 && got0 && want0.balance == got0.balance;

        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'recruitment-office',
                    title: 'Recruitment Office',
                    summary: 'You are STRONG like us! You may craft your badge of allegiance',
                    content: [
                        {
                            //id: 'default',
                            //type: 'inline',
                            //html: statsHtml
                            
                            id: 'default',
                            type: 'inline',
                            buttons: [{ text: 'Join the Team', type: 'action', action: craft, disabled: !canCraft }],
                            //html: statsHtml                       
                        },
                    ],
                },
            ],
        };
    }


    
}
