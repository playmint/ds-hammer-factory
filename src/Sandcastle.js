import ds from 'dawnseekers';

export default function update({ selected, world }) {

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'main',
                title: 'Sandcastle',
                summary: `A castle made of sand`,
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        html: `
                            <p>Congrats on getting all that sand!</p>
                        `,
                        buttons: [{ text: 'Claim Castle', type: 'toggle', content: 'castle' }],
                    },
                    {
                        id: 'castle',
                        type: 'inline',
                        html: `
                            <p>Enjoy this picture of a sandcastle</p>
                            <img src="https://static.wixstatic.com/media/05a6f5_b7a5bff7db984c0d941eddc6808ad906~mv2.png/v1/fill/w_578,h_492,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/sandcastle%20(new%20colour).png" width="200" />
                        `,
                        buttons: [{ text: 'Thanks, I hate it', type: 'toggle', content: 'castle' }],
                    },
                ],
            },
        ],
    };
}

