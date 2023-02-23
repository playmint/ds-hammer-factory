/** @format */

import { Fragment, FunctionComponent, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentProps } from '@app/types/component-props';
import { styles } from './auth.styles';
import { useNetworkContext } from '@app/contexts/network-provider';
import { useSessionContext } from '@app/contexts/cog-session-provider';
import router from 'next/router';
import { Heading, Text, Button, Flex, useColorModeValue } from '@chakra-ui/react';

export interface AuthProps extends ComponentProps {
    gameID: string;
}

const StyledAuth = styled('div')`
    ${styles}
`;

export const Auth: FunctionComponent<AuthProps> = (props: AuthProps) => {
    const { gameID } = props;
    const { active, connect } = useNetworkContext();
    const { hasSignedIn, hasSignedMessage, hasFailed, signin } = useSessionContext();
    const isReady = active && hasSignedIn;

    // TODO: Style to come from somewhere central
    const formBackground = useColorModeValue('gray.100', 'gray.700');
    const headingMB = 6;

    useEffect(() => {
        if (isReady) {
            router.push(
                {
                    pathname: `/`
                },
                undefined,
                { shallow: true }
            );
        }
    }, [isReady]);

    // TODO: Should there be a callback on connect that automatically shows the signin message?
    const onConnectClick = async () => {
        connect();
    };

    const onSigninClick = async () => {
        signin(gameID);
    };

    function displayConnect() {
        return (
            <Fragment>
                <Heading mb={headingMB}>Connect Wallet</Heading>
                <Text></Text>
                <Button colorScheme="blue" onClick={onConnectClick}>
                    Connect MetaMask
                </Button>
            </Fragment>
        );
    }

    function displaySignin() {
        return (
            <Fragment>
                <Heading mb={headingMB}>Sign In</Heading>
                <Text></Text>
                <Button colorScheme="blue" onClick={onSigninClick}>
                    Sign In
                </Button>
                {hasFailed && (
                    <Text mt={6} className="error-message" color="red.500">
                        Sign in failed, please click the <b>Sign In</b> button again and check MetaMask for any messages
                    </Text>
                )}
            </Fragment>
        );
    }

    function displayLoading() {
        return (
            <Fragment>
                <Heading mb={headingMB}>Loading game</Heading>
                <Text>Please wait...</Text>
            </Fragment>
        );
    }

    function displaySignInWaitMessage() {
        return (
            <Fragment>
                <Heading mb={6}>Signing In</Heading>
                <Text>Please wait...</Text>
            </Fragment>
        );
    }

    return (
        <StyledAuth>
            <Flex alignItems="center" justifyContent="center" height="100vh">
                <Flex direction="column" background={formBackground} p={12} rounded={6}>
                    {!active
                        ? displayConnect()
                        : !hasSignedIn
                        ? !hasSignedMessage
                            ? displaySignin()
                            : displaySignInWaitMessage()
                        : displayLoading()}
                </Flex>
            </Flex>
        </StyledAuth>
    );
};
