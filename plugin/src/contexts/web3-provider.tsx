/** @format */

import { Web3Provider as EthersProvider } from '@ethersproject/providers';
import dynamic from 'next/dynamic';
import { createWeb3ReactRoot } from '@web3-react/core';
import { ReactNode } from 'react';

function dynamicCreateWeb3ReactRoot(key: string) {
    return dynamic(async () => createWeb3ReactRoot(key), { ssr: false });
}

function getLibrary(provider: any) {
    return new EthersProvider(provider);
}

const Web3WalletProvider = dynamicCreateWeb3ReactRoot('wallet');
const Web3FallbackProvider = dynamicCreateWeb3ReactRoot('fallback');

export const Web3Provider = ({ children }: { children: ReactNode }) => {
    return (
        <Web3WalletProvider getLibrary={getLibrary}>
            <Web3FallbackProvider getLibrary={getLibrary}>{children}</Web3FallbackProvider>
        </Web3WalletProvider>
    );
};
