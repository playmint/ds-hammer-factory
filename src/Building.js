import ds from 'dawnseekers';

export default function update({ selected, world }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile?.building;
    const buildingKinds = world.buildings.map(b => b.kind).filter(k => !!k);
    const transmissionTowerKind = buildingKinds.find(kind => kind.id == '0xbe92755c000000000000000000000000b1f218e583f71672');
    const radioWave = transmissionTowerKind?.outputs.find(() => true)?.item;
    const messages = radioWave?.name?.value?.split('|') || [];

    const onSubmit = (values) => {
        const message = values.message ? `${seeker.name?.value || `0x${seeker.id.slice(-5)}`}: ${values.message || ''}` : '';
        ds.dispatch({
            name: 'BUILDING_USE',
            args: [selectedBuilding.id, seeker.id, ds.encodeCall('function SendMessage(string memory)', [message || ''])]
        })
    };

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'info',
                title: 'Telegraph Post',
                summary: 'Chat between telegraph posts. Better than discord',
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        html: transmissionTowerKind ? `
                            <div>
                                <div style="max-height:300px; overflow-y: scroll; font-size: 1rem;">
                                    ${messages.map(m => `<code>${m}</code>`).join('<br />')}
                                </div>
                                <div>
                                    <input style="width: 100%;" placeholder="message" type="text" name="message" />
                                    <button type="submit" style="width:100%; padding:5px; border-radius: 10px;">SEND</button>
                                </div>
                            </div>
                        ` : `
                            <div>
                                <p>You need to construct a transmission tower somewhere for the telegraph posts to work</p>
                                <button type="submit" style="width:100%; padding:5px; border-radius: 10px;">CONFIGURE TOWER</button>
                            </div>
                        `,
                        submit: onSubmit,
                        buttons: [],
                    },
                ],
            },
        ],
    };
}

