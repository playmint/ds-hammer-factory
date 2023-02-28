/** @format */

import { FunctionComponent } from 'react';
import styled from '@emotion/styled';
import { ComponentProps } from '@app/types/component-props';
import { useSessionContext } from '@app/contexts/cog-session-provider';
import { BigNumber, utils } from 'ethers';
import { Text, Heading, Alert, AlertIcon, Flex } from '@chakra-ui/react';
import { useGetStateQuery } from '@app/types/queries';
import { Crafting } from '@app/components/organisms/crafting';
import { keccak256 } from 'ethers/lib/utils';
import { Resource } from '@app/types/resource';
import { useCogPlugin } from '@app/contexts/cog-plugin-provider';

type TileCoords = [number, number, number] | null;

const tileDistance = (a: TileCoords, b: TileCoords) => {
    if (!a || !b) {
        return -1;
    }
    return Math.floor((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 2);
};

type Seeker = Required<NonNullable<ReturnType<typeof useGetStateQuery>['data']>['game']>['state']['seekers'][number];
type Extension = NonNullable<ReturnType<typeof useGetStateQuery>['data']>['extension'];
type DawnseekersState = Required<NonNullable<ReturnType<typeof useGetStateQuery>['data']>['game']>['state'];

export interface PluginProps extends ComponentProps {
    account: string;
    extension: Extension;
    dawnseekers: DawnseekersState;
    selectedTile?: TileCoords;
    selectedSeeker?: Seeker;
}

const StyledPlugin = styled.div`
    height: 100vh;
    padding: 10px;

    > .content {
        height: 100%;

        header {
        }

        main {
            flex-grow: 1;
        }
    }

    .help {
        margin-top: 10px;
    }
`;

export const Plugin: FunctionComponent<PluginProps> = (props: PluginProps) => {
    const { account, extension, dawnseekers, selectedSeeker, selectedTile } = props;
    const { dispatch: dispatchActionPlugin } = useSessionContext();
    const { dispatchAction: dispatchActionShell } = useCogPlugin();

    const selectedSeekerCurrentLocation = ((): TileCoords => {
        if (!selectedSeeker) {
            return [0, 0, 0];
        }
        const next = selectedSeeker.location.find((l) => l.key == 1);
        if (!next) {
            console.warn('no next location found for seeker');
            return [0, 0, 0];
        }
        return [
            BigNumber.from(next.tile.keys[1]).fromTwos(16).toNumber(),
            BigNumber.from(next.tile.keys[2]).fromTwos(16).toNumber(),
            BigNumber.from(next.tile.keys[3]).fromTwos(16).toNumber()
        ];
    })();

    const selectedSeekerIsOnTile =
        selectedSeeker && selectedTile ? tileDistance(selectedTile, selectedSeekerCurrentLocation) == 0 : false;

    const selectedBuilding = (() => {
        if (!selectedTile) {
            return;
        }
        return dawnseekers.buildings.find((b) => {
            if (!b.location) {
                return false;
            }
            return (
                BigNumber.from(b.location.tile.keys[1]).fromTwos(16).toNumber() == selectedTile[0] &&
                BigNumber.from(b.location.tile.keys[2]).fromTwos(16).toNumber() == selectedTile[1] &&
                BigNumber.from(b.location.tile.keys[3]).fromTwos(16).toNumber() == selectedTile[2]
            );
        });
    })();

    const selectedTileHasBuildingOfExpectedKind = (() => {
        if (!selectedBuilding) {
            return false;
        }
        return selectedBuilding.kind?.addr.toLowerCase() === extension.id.toLowerCase();
    })();

    const handleCraft = () => {
        if (!selectedTile) {
            console.error('plugin: no selectedTile');
            return;
        }
        if (!selectedSeeker) {
            console.error('plugin: no selectedSeeker');
            return;
        }
        if (!selectedBuilding) {
            console.error('plugin: no selectedBuilding');
            return;
        }
        if (!extension) {
            console.error('plugin: no extension');
            return;
        }

        // todo make sure we have an empty slot to add the hammer to
        // todo fix transferring so that balance edges are cleanup up
        // const nextEmptySlot = selectedSeeker.bags[0].slots.find((slot) => slot.balance === 0);
        //
        // if (!nextEmptySlot) {
        //     console.error('No inventory space for the hammer!');
        //     return;
        // }

        // make item id from inputs

        // create a bag
        // bag id is keccak tile coords + building id + seeker id?
        const abi = utils.defaultAbiCoder;
        const bagId =
            '0x' +
            (
                BigInt(
                    keccak256(
                        abi.encode(
                            ['int16', 'int16', 'int16', 'bytes24', 'bytes24'],
                            [...selectedTile, selectedSeeker.id, selectedBuilding.id]
                        )
                    )
                ) & BigInt('0xFFFFFFFFFFFFFFFF')
            ).toString(16);

        const equipSlot = 1; // todo get next empty equip slot
        dispatchActionShell('DAWNSEEKERS', 'DEV_SPAWN_BAG', bagId, account, selectedSeeker.id, equipSlot, [], []);

        // transfer things into it
        const fromId = selectedSeeker.id;
        const toId = selectedSeeker.id;
        const fromEquipIndex = 0;
        const toEquipIndex = 1;

        // wood
        dispatchActionShell(
            'DAWNSEEKERS',
            'TRANSFER_ITEM_SEEKER',
            selectedSeeker.id,
            [fromId, toId],
            [fromEquipIndex, toEquipIndex],
            [0, 0],
            20
        );

        // iron
        dispatchActionShell(
            'DAWNSEEKERS',
            'TRANSFER_ITEM_SEEKER',
            selectedSeeker.id,
            [fromId, toId],
            [fromEquipIndex, toEquipIndex],
            [1, 1],
            12
        );

        // transfer ownership of the bag to the building??

        // craft!
        const targetSlotIndex = 3;
        const destinationBagId = '0x' + (BigInt(selectedSeeker.bags[0].id) & BigInt('0xFFFFFFFFFFFFFFFF')).toString(16);
        dispatchActionPlugin(
            extension.name,
            'CRAFT_HAMMER',
            selectedSeeker.id,
            selectedBuilding.id,
            bagId,
            destinationBagId,
            targetSlotIndex
        );
    };

    const showContent = selectedTile && selectedSeeker && selectedTileHasBuildingOfExpectedKind;

    const help = (() => {
        if (!selectedTile) {
            // player has not selected a tile yet
            return (
                <Alert status="info" variant="solid">
                    <AlertIcon />
                    No tile selected
                </Alert>
            );
        } else if (!selectedSeeker) {
            // we don't know who the seeker is
            return (
                <Alert status="info" variant="solid">
                    <AlertIcon />
                    No active seeker
                </Alert>
            );
        } else if (!selectedTileHasBuildingOfExpectedKind) {
            // the selected tile is not one we care about
            return (
                <Alert status="info" variant="solid">
                    <AlertIcon />
                    Selected tile is not a {extension.name}
                </Alert>
            );
        } else {
            return undefined;
        }
    })();

    const subtitle = (() => {
        if (selectedSeekerIsOnTile && selectedTileHasBuildingOfExpectedKind) {
            return <Text>Welcome to {extension.name}: The hammer factory!</Text>;
        } else if (selectedTileHasBuildingOfExpectedKind) {
            return <Text>Move your seeker onto this tile to enable crafting</Text>;
        } else {
            return <Text>Select a {extension.name} building to see crafting options</Text>;
        }
    })();

    return (
        <StyledPlugin>
            <Flex direction="column" className="content">
                <header className="crafting-header">
                    <Heading size="md">{extension.name}</Heading>
                    {subtitle}
                    <div className="help">{help}</div>
                </header>
                <main>
                    {showContent && (
                        <Crafting
                            onCraft={handleCraft}
                            recipe={[
                                { id: Resource.Wood, amount: 20 },
                                { id: Resource.Iron, amount: 12 }
                            ]}
                        />
                    )}
                </main>
            </Flex>
        </StyledPlugin>
    );
};
