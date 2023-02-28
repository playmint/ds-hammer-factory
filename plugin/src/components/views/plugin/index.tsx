/** @format */

import { FunctionComponent, useState } from 'react';
import styled from '@emotion/styled';
import { ComponentProps } from '@app/types/component-props';
import { useSessionContext } from '@app/contexts/cog-session-provider';
import { BigNumber, utils } from 'ethers';
import { Text, Heading, Alert, AlertIcon, Flex } from '@chakra-ui/react';
import { useGetStateQuery } from '@app/types/queries';
import { Crafting } from '@app/components/organisms/crafting';
import { keccak256 } from 'ethers/lib/utils';
import { useCogPlugin } from '@app/contexts/cog-plugin-provider';

type TileCoords = [number, number, number] | null;

const tileDistance = (a: TileCoords, b: TileCoords) => {
    if (!a || !b) {
        return -1;
    }
    return Math.floor((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 2);
};

const DISPATCH_WAIT_TIME = 4000; // ms

type Seeker = Required<NonNullable<ReturnType<typeof useGetStateQuery>['data']>['game']>['state']['seekers'][number];
type Bag = Required<
    NonNullable<ReturnType<typeof useGetStateQuery>['data']>['game']
>['state']['seekers'][number]['bags'][number];
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

// TODO: Don't use the hardcoded hex. NOTE: 1 = Wood, 3 = Iron
const recipe = [
    { id: '0x37f9b55d0000000000000000000000000000000000000001', amount: 20 },
    { id: '0x37f9b55d0000000000000000000000000000000000000003', amount: 12 }
];

export const Plugin: FunctionComponent<PluginProps> = (props: PluginProps) => {
    const { account, extension, dawnseekers, selectedSeeker, selectedTile } = props;
    const { dispatch: dispatchActionPlugin } = useSessionContext();
    const { dispatchAction: dispatchActionShell } = useCogPlugin();
    const [isWaitingToCraft, setIsWaitingToCraft] = useState(false);
    const [craftFailed, setCraftFailed] = useState(false);

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

    // TODO: Don't have `any` types
    const createBag = async (selectedTile: any, selectedSeeker: any, selectedBuilding: any, equipSlot: number) => {
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

        // DEBUG: Use these as last two params of `DEV_SPAWN_BAG` to crate a bag with the Hammer recipe
        // const itemIds = recipe.map((ingredient) => ingredient.id);
        // const quantities = recipe.map((ingredient) => ingredient.amount);
        dispatchActionShell('DAWNSEEKERS', 'DEV_SPAWN_BAG', bagId, account, selectedSeeker.id, equipSlot, [], []);

        // TODO: Get message from shell if the dispatch was a success and poll state for bag creation
        return new Promise<string>((resolve, reject) => {
            setTimeout(() => {
                resolve(bagId);
            }, DISPATCH_WAIT_TIME);
        });
    };

    const bagHasSufficientIngredients = (bag: Bag) => {
        for (let i = 0; i < recipe.length; i++) {
            const ingredient = bag.slots.find((slot) => slot.resource.id == recipe[i].id);
            if (!ingredient || ingredient.balance < recipe[i].amount) return false;
        }

        return true;
    };

    // NOTE: Because we transfer each item individually you need to check upfront if the bag has enough ingredients otherwise it would fail part way through transferring the ingredients
    const transferRecipeToBag = async (selectedSeeker: Seeker, fromEquipIndex: number, toEquipIndex: number) => {
        const fromId = selectedSeeker.id;
        const toId = selectedSeeker.id;
        const fromBag = selectedSeeker.bags[fromEquipIndex]; // TODO: I'm assuming that these bag indexes match the equip indexes. I think they might not always!!!

        // FIXME: Doesn't use a sum of the same resource/item across multiple slots. The first slot with resource/item needs to have >= required amount
        try {
            recipe.forEach((ingredient, index) => {
                const slot = fromBag.slots.find((slot) => slot.resource.id == ingredient.id);
                if (!slot || slot.balance < ingredient.amount) {
                    throw 'Bag has insufficient ingredients!';
                }

                dispatchActionShell(
                    'DAWNSEEKERS',
                    'TRANSFER_ITEM_SEEKER',
                    selectedSeeker.id,
                    [fromId, toId],
                    [fromEquipIndex, toEquipIndex],
                    [slot.slot, index], // From - To Slot
                    ingredient.amount
                );
            });
        } catch (e) {
            console.error(e);
            return false;
        }

        return new Promise<boolean>((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, DISPATCH_WAIT_TIME);
        });
    };

    const getEmptySlotIndex = (bag: Bag) => {
        if (bag.slots.length < 4) {
            for (let i = 0; i < 4; i++) {
                const existingSlot = bag.slots.find((slot) => slot.slot === i);
                if (!existingSlot) {
                    return i;
                }
            }
        }
        return -1;
    };

    const bagHasEmptySlot = (bag: Bag) => {
        return getEmptySlotIndex(bag) > -1;
    };

    // ShortId is the uint64 ID
    const getBagShortId = (bag: Bag) => {
        return '0x' + (BigInt(bag.id) & BigInt('0xFFFFFFFFFFFFFFFF')).toString(16);
    };

    // TODO: Don't use `any` types
    const craftItem = async (
        selectedSeeker: Seeker,
        selectedBuilding: any,
        recipeBagId: string,
        destinationBagId: string
    ) => {
        const targetSlotIndex = getEmptySlotIndex(selectedSeeker.bags[0]);
        if (targetSlotIndex < 0) {
            console.error('craftItem: No available slots on bag 0: ');
            return false;
        }

        console.log(`craftItem: destinationBagId: ${destinationBagId} targetSlotIndex: ${targetSlotIndex}`);

        try {
            await dispatchActionPlugin(
                extension.name,
                'CRAFT_HAMMER',
                selectedSeeker.id,
                selectedBuilding.id,
                recipeBagId,
                destinationBagId,
                targetSlotIndex
            );
        } catch (e) {
            console.error('Crafting of Hammer failed.', e);
            return false;
        }

        // TODO: poll the state and return true when the item has reached the player's bag
        return new Promise<boolean>((resolve, _) => {
            setTimeout(() => {
                resolve(true);
            }, DISPATCH_WAIT_TIME);
        });
    };

    const handleCraft = async () => {
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

        const mainBagEquipIndex = 0;
        const recipeBagIndex = 1;

        setIsWaitingToCraft(true);

        // TODO: Bag creation and item transfer can fail on the shell side and we won't know about it!
        const recipeBagId = await createBag(selectedTile, selectedSeeker, selectedBuilding, recipeBagIndex);
        const transferSuccess = await transferRecipeToBag(selectedSeeker, mainBagEquipIndex, recipeBagIndex);
        if (!transferSuccess) {
            setCraftFailed(true);
            setIsWaitingToCraft(false);
            return;
        }

        const craftSuccess = await craftItem(
            selectedSeeker,
            selectedBuilding,
            recipeBagId,
            getBagShortId(selectedSeeker.bags[mainBagEquipIndex])
        );
        setCraftFailed(!craftSuccess);
        setIsWaitingToCraft(false);

        // transfer ownership of the bag to the building??
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
                            recipe={recipe}
                            isWaitingToCraft={isWaitingToCraft}
                            craftFailed={craftFailed}
                            bagHasEmptySlot={bagHasEmptySlot(selectedSeeker.bags[0])}
                            bagHasSufficientIngredients={bagHasSufficientIngredients(selectedSeeker.bags[0])}
                        />
                    )}
                </main>
            </Flex>
        </StyledPlugin>
    );
};
