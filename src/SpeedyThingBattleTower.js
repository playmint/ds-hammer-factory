import ds from 'dawnseekers';

export default function update({ selected, world }) {


    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'speedything-battle-tower',
                title: 'SpeedyThing\'s Battle Tower',
                summary: "YOUR FRIENDLY, NEIGHBOURLY, KILL YOU TOWER!!",
                content: [
                    {
                        id: 'default',
                        type: 'inline'
                    },
                ],
            },
        ],
    };
}

