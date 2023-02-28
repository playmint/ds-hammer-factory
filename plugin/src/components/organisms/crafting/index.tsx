/** @format */

import { FunctionComponent, useState } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import {
    Button,
    Flex,
    Heading,
    List,
    ListItem,
    Slider,
    SliderFilledTrack,
    SliderMark,
    SliderThumb,
    SliderTrack,
    Spacer,
    Tooltip,
    Text
} from '@chakra-ui/react';

export interface CraftingProps extends ComponentProps {
    onCraft: () => void;
    recipe: any;
    bagHasEmptySlot: boolean;
    bagHasSufficientIngredients: boolean;
    isWaitingToCraft: boolean;
    craftFailed: boolean;
}

const StyledCrafting = styled('div')``;

export const Crafting: FunctionComponent<CraftingProps> = (props: CraftingProps) => {
    const { onCraft, isWaitingToCraft, craftFailed, bagHasEmptySlot, bagHasSufficientIngredients, ...otherProps } =
        props;
    const [sliderValue, setSliderValue] = useState<number>(5);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);

    return (
        <StyledCrafting {...otherProps}>
            <Heading size="md">Hammer</Heading>
            <Flex direction="column" className="recipe">
                <Flex>
                    <div>
                        <span>Resources per hammer</span>
                        <List>
                            <ListItem>2 Metal</ListItem>
                            <ListItem>1 Wood</ListItem>
                            <ListItem>1 Leather</ListItem>
                        </List>
                    </div>
                    <div>Hammer icon</div>
                </Flex>
                <Slider
                    id="slider"
                    defaultValue={5}
                    min={0}
                    max={100}
                    colorScheme="teal"
                    onChange={(v) => setSliderValue(v)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <SliderMark value={25} mt="1" ml="-2.5" fontSize="sm">
                        25
                    </SliderMark>
                    <SliderMark value={50} mt="1" ml="-2.5" fontSize="sm">
                        50
                    </SliderMark>
                    <SliderMark value={75} mt="1" ml="-2.5" fontSize="sm">
                        75
                    </SliderMark>
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <Tooltip
                        hasArrow
                        bg="teal.500"
                        color="white"
                        placement="top"
                        isOpen={showTooltip}
                        label={`${sliderValue}`}
                    >
                        <SliderThumb />
                    </Tooltip>
                </Slider>
                <div>Recipe items</div>
                <Spacer />
                {bagHasEmptySlot && bagHasSufficientIngredients && !isWaitingToCraft && (
                    <Button onClick={onCraft}>Craft hammer x {sliderValue}</Button>
                )}
                {isWaitingToCraft && <Text>Crafting hammer</Text>}
                {craftFailed && <Text>Craft failed</Text>}
                {!bagHasEmptySlot && <Text>No slots remaining on bag to craft item to</Text>}
                {!bagHasSufficientIngredients && <Text>Insufficient ingredients in bag to craft item</Text>}
            </Flex>
        </StyledCrafting>
    );
};
