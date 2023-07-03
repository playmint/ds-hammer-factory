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
    const selectedEngineer = seeker;


    var engineerDistance = 0;
    if (selectedEngineer) {
        engineerDistance = distance(selectedEngineer.nextLocation.tile, selectedTile);
    }


    //Show this if there is no selected engineer OR the engineer is not adjacent to the building's tile
    if (!selectedEngineer || engineerDistance > 1) {
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


    for (var j = 0; j < selectedEngineer.bags.length; j++) {
        for (var i = 0; i < 4; i++) {
            if (selectedEngineer.bags[j].bag.slots[i]) {
                var slot = selectedEngineer.bags[j].bag.slots[i];

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
                            buttons: [{ text: 'Join the Team', type: 'action', action: craft, disabled: false }],
                            html: statsHtml
                        },
                    ],
                },
            ],
        };
    }


    
}
