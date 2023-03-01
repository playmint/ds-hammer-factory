/** @format */

import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { Button, Flex, List, ListItem, Alert, AlertIcon } from '@chakra-ui/react';

export interface CraftingProps extends ComponentProps {
    recipe: any;
    bagHasEmptySlot: boolean;
    bagHasSufficientIngredients: boolean;
    isWaitingToCraft: boolean;
    craftFailed: boolean;
    onCraft: () => void;
}

const StyledCrafting = styled('div')`
    .recipe {
        margin-bottom: 10px;
    }

    [role='alert'] {
        margin-top: 5px;
    }
`;

export const Crafting: FunctionComponent<CraftingProps> = (props: CraftingProps) => {
    const { isWaitingToCraft, craftFailed, bagHasEmptySlot, bagHasSufficientIngredients, onCraft, ...otherProps } =
        props;

    return (
        <StyledCrafting {...otherProps}>
            <Flex direction="column" className="recipe">
                <Flex className="recipe">
                    <div>
                        <span>Resources per hammer</span>
                        <List>
                            <ListItem>20 Wood</ListItem>
                            <ListItem>12 Iron</ListItem>
                        </List>
                    </div>
                </Flex>
                <Button
                    onClick={onCraft}
                    isLoading={isWaitingToCraft}
                    loadingText="Forging a hammer"
                    isDisabled={!bagHasEmptySlot || !bagHasSufficientIngredients || isWaitingToCraft}
                >
                    Hammer time!
                </Button>

                {craftFailed && (
                    <Alert status="error">
                        <AlertIcon />
                        Craft failed!
                    </Alert>
                )}
                {!bagHasEmptySlot && (
                    <Alert status="warning">
                        <AlertIcon />
                        You need more bag space to craft more hammers
                    </Alert>
                )}
                {!bagHasSufficientIngredients && (
                    <Alert status="warning">
                        <AlertIcon />
                        You need more resources to craft a hammer
                    </Alert>
                )}
            </Flex>
        </StyledCrafting>
    );
};
