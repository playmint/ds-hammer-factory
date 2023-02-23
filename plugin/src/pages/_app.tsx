/** @format */

import { Fragment } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import Head from 'next/head';
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { GlobalStyles } from '@app/styles/global.styles';
import { CogPluginProvider } from '@app/contexts/cog-plugin-provider';
import { COGSessionProvider } from '@app/contexts/cog-session-provider';
import { NetworkProvider } from '@app/contexts/network-provider';
import { Web3Provider } from '@app/contexts/web3-provider';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { ethers } from 'ethers';

const client = new ApolloClient({
    uri: 'http://localhost:8080/query',
    cache: new InMemoryCache()
});

const actions = new ethers.utils.Interface([`function CHECK_IN(bytes24 seekerID, bytes24 buildingID)`]);

function App({ Component, pageProps }: any) {
    const config: ThemeConfig = {
        useSystemColorMode: false,
        initialColorMode: 'dark'
    };
    const theme = extendTheme({ config });
    return (
        <Fragment>
            <Head>
                <title>Example Client Plugin</title>
                <meta name="description" content="Example Dawnseekers Client Plugin" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <GlobalStyles />
            <ApolloProvider client={client}>
                <CogPluginProvider>
                    <Web3Provider>
                        <NetworkProvider>
                            <COGSessionProvider actions={actions}>
                                <ChakraProvider theme={theme}>
                                    <Component {...pageProps} />
                                </ChakraProvider>
                            </COGSessionProvider>
                        </NetworkProvider>
                    </Web3Provider>
                </CogPluginProvider>
            </ApolloProvider>
        </Fragment>
    );
}

export default App;
