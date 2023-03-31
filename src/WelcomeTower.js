import ds from 'dawnseekers';

export default function update({ selected }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile && selectedTile.building ? selectedTile.building : undefined;
    const selectedSeeker = seeker;



    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'welcome-tower',
                title: 'Welcome To DawnSeekers',
                summary: 'Go create! Go have fun! Let us know if something goes horribly horribly wrong.',
                content: [
                    {
                        id: 'default',
                        type: 'popout'
                    },
                ],
            },
        ],
    };
}
