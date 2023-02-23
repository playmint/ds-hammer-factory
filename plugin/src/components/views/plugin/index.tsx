/** @format */

import { FunctionComponent } from 'react';
import styled from '@emotion/styled';
import { ComponentProps } from '@app/types/component-props';
import { useSessionContext } from '@app/contexts/cog-session-provider';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { BigNumber } from 'ethers';
import {
    Tag,
    List,
    ListItem,
    ListIcon,
    Card,
    Text,
    CardHeader,
    Heading,
    CardFooter,
    CardBody,
    Button,
    ButtonGroup,
    Alert,
    AlertIcon
} from '@chakra-ui/react';
import { useGetStateQuery } from '@app/types/queries';

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
    extension: Extension;
    dawnseekers: DawnseekersState;
    selectedTile?: TileCoords;
    selectedSeeker?: Seeker;
}

const StyledPlugin = styled.div``;

export const Plugin: FunctionComponent<PluginProps> = (props: PluginProps) => {
    const { extension, dawnseekers, selectedSeeker, selectedTile } = props;
    const { dispatch } = useSessionContext();

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

    const handleClickCheckin = () => {
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
        dispatch(extension.name, 'CHECK_IN', selectedSeeker.id, selectedBuilding.id);
    };

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
            return <Text>Welcome to {extension.name}, click check-in to register your visit</Text>;
        } else if (selectedTileHasBuildingOfExpectedKind) {
            return <Text>Move your seeker onto this tile to enable check-in</Text>;
        } else {
            return <Text>Select a {extension.name} building to see who has visited</Text>;
        }
    })();

    const listOfCheckedIn = extension.state.seekers
        .filter((s) => s?.building?.id == selectedBuilding?.id)
        .map((s) => (
            <ListItem key={s.seekerID}>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                {s.seekerID.slice(-8)} {s.seekerID == selectedSeeker?.id ? <Tag>You</Tag> : undefined}
            </ListItem>
        ));

    const seekerCheckedIn =
        selectedSeeker &&
        !!extension.state.seekers.find(
            (s) => s.building?.id == selectedBuilding?.id && selectedSeeker.id == s?.seekerID
        );

    return (
        <StyledPlugin>
            <Card>
                <CardHeader>
                    <Heading size="md">{extension.name}</Heading>
                    {subtitle}
                </CardHeader>
                <CardBody>
                    {help}
                    <Text>
                        {listOfCheckedIn.length > 0
                            ? 'Recent seeker visitors:'
                            : selectedTileHasBuildingOfExpectedKind
                            ? 'no seekers visited'
                            : ''}
                    </Text>
                    <List>{listOfCheckedIn}</List>
                </CardBody>
                <CardFooter>
                    <ButtonGroup spacing="2">
                        <Button
                            isDisabled={!selectedSeekerIsOnTile || seekerCheckedIn}
                            variant="outline"
                            colorScheme="blue"
                            onClick={handleClickCheckin}
                        >
                            Check In
                        </Button>
                    </ButtonGroup>
                </CardFooter>
            </Card>
        </StyledPlugin>
    );
};
