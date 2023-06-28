import ds from 'dawnseekers';

export default function update({ selected, world }) {

    const { tiles, seeker } = selected || {};
    const selectedTile = tiles && tiles.length === 1 ? tiles[0] : undefined;
    const selectedBuilding = selectedTile?.building;


    const deposit = (bagId, keyId) => {
        const actions = (seeker?.bags || []).flatMap(b => b.bag.slots.filter(slot => slot.balance > 0).map(slot => ({
            name: 'TRANSFER_ITEM_SEEKER',
            args: [
                seeker.id,
                [seeker.id, selectedBuilding.id],
                [b.key, keyId + b.key],
                [slot.key, slot.key],
                [bagId,b.key.toString()].join(''),
                slot.balance
            ]
        })));
        ds.dispatch(...actions);
    };

    const restore = (keyId) => {
        const bag0 = selectedBuilding.bags?.find(bb => bb.key == (keyId + 0));
        const bag1 = selectedBuilding.bags?.find(bb => bb.key == (keyId + 1));
        const actions = [bag0, bag1].flatMap((b,seekerEquipSlot) => b ? b.bag.slots.filter(slot => slot.balance > 0).map(slot => ({
            name: 'TRANSFER_ITEM_SEEKER',
            args: [
                seeker.id,
                [selectedBuilding.id, seeker.id],
                [b.key, seekerEquipSlot],
                [slot.key, slot.key],
                "0x000000000000000000000000000000000000000000000000",
                slot.balance
            ]
        })) : null).filter(a => !!a);
        if (actions.length == 0) {
            ds.log('nothing to restore with that pin');
            ds.log('are you sure it was this branch?');
            return;
        }
        ds.dispatch(...actions);
    };

    const onSubmit = (values) => {
        const buildId = selectedBuilding.id.slice(-5);
        const bagId = ["0xb1c93f090000000",buildId,"0000000000eee2a52", [0,1,2,3,4].map(v => `a${values[`pin${v}`]}`).join('')].join('');
        const keyId = parseInt([0,1,2,3,4].map(v => values[`pin${v}`]).join(''), 10) % 254;
        if (values.deposit == 'true') {
            deposit(bagId, keyId);
        } else {
            restore(keyId);
        }
    };

    return {
        version: 1,
        components: [
            {
                type: 'building',
                id: 'info',
                title: 'Safety Deposit Box',
                summary: 'Store or restore entire inventory of items by secured by an impossible to guess 5 digit pin number.',
                content: [
                    {
                        id: 'default',
                        type: 'inline',
                        html: `
                            <div style="font-size: 2.5rem;">
                                <label>I WANT TO</label>
                                <div>
                                    <select name="deposit" style="width: 100%;">
                                        <option value="true">Deposit</option>
                                        <option value="false">Restore</option>
                                    </select>
                                </div>
                                <label>SELECT PIN CODE</label>
                                <div>
                                    <select name="pin0">
                                        <option>0</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                        <option>6</option>
                                        <option>7</option>
                                        <option>8</option>
                                        <option>9</option>
                                    </select>
                                    <select name="pin1">
                                        <option>0</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                        <option>6</option>
                                        <option>7</option>
                                        <option>8</option>
                                        <option>9</option>
                                    </select>
                                    <select name="pin2">
                                        <option>0</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                        <option>6</option>
                                        <option>7</option>
                                        <option>8</option>
                                        <option>9</option>
                                    </select>
                                    <select name="pin3">
                                        <option>0</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                        <option>6</option>
                                        <option>7</option>
                                        <option>8</option>
                                        <option>9</option>
                                    </select>
                                    <select name="pin4">
                                        <option>0</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                        <option>6</option>
                                        <option>7</option>
                                        <option>8</option>
                                        <option>9</option>
                                    </select>
                                </div>
                                <br/>
                                <div>
                                    <button type="submit" style="width:100%; padding:5px; border-radius: 10px;">SUBMIT</button>
                                </div>
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

