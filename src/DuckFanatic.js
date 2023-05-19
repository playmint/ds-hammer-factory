import ds from 'dawnseekers'

export default function update({ selected }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedEngineer = seeker;
    const engineerBagOwner = selectedEngineer.id;


    /* //This doesn't work. Need to work out how to get the Seeker's tile
    if (selectedTile !== selectedEngineer.tile) {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'duck-fanatic',
                    title: 'Rubber Duck Fanatic',
                    summary: 'Bring a duck when you visit... else don\'t bother coming at all!'
                },
            ],
        };
    }
    */

    var hasRubberDuck = false

    //just checks for wood for now
    for (var j = 0; j < selectedEngineer.bags.length; j++) {
        for (var i = 0; i < 4; i++) {
            if (selectedEngineer.bags[j].bag.slots[i]) {
                var slot = selectedEngineer.bags[j].bag.slots[i];

                if (slot.item && slot.item.id === '0x37f9b55d0000000000000000000000000000000000000001' && slot.balance >= 1) {
                    hasRubberDuck = true;
                }
            }
        }
    }




    if (hasRubberDuck) {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'duck-fanatic',
                    title: 'Rubber Duck Fanatic',
                    summary: 'I love your duck!'                 
                },
            ],
        };
    }

    else {
        return {
            version: 1,
            components: [
                {
                    type: 'building',
                    id: 'duck-fanatic',
                    title: 'Rubber Duck Fanatic',
                    summary: 'You have no duck. Leave me alone!'
                },
            ],
        };
    }

}
