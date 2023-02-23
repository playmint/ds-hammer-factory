/** @format */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { AbstractConnector } from '@web3-react/abstract-connector';
import { InjectedConnector } from '@web3-react/injected-connector';

export interface Web3ReactContextInterface<T = any> {
    connector?: AbstractConnector;
    library?: T;
    chainId?: number;
    account?: null | string;
    active: boolean;
    error?: Error;
}

export interface NetworkContextProviderProps {
    children?: ReactNode;
}

export interface NetworkContextStore extends Web3ReactContextInterface {
    isAuthorized: boolean;
    network?: NetworkConfig;
    connect(): void;
}

export const NetworkContext = createContext<NetworkContextStore>({} as NetworkContextStore);

export const useNetworkContext = () => useContext(NetworkContext);

export type NetworkConfig = {
    id: number;
    name: string;
    api: string;
};

const defaultNetworkId = parseInt(process.env.NEXT_PUBLIC_NETWORK_ID || '1', 10);

const networks: NetworkConfig[] = [
    {
        id: 1,
        name: 'Localhost',
        api: process.env.NEXT_PUBLIC_LOCAL_GQL_URL || 'http://localhost:8080/query'
    },
    {
        id: 2,
        name: 'Testnet',
        api: process.env.NEXT_PUBLIC_TESTNET_GQL_URL || 'http://localhost:8080/query'
    }
];

const injectedConnector = new InjectedConnector({});

export function useEagerConnect(key: string) {
    const { activate, active } = useWeb3React(key);

    const [tried, setTried] = useState(false);

    useEffect(() => {
        injectedConnector.isAuthorized().then((isAuthorized: boolean) => {
            if (isAuthorized) {
                activate(injectedConnector, undefined, true).catch(() => {
                    setTried(true);
                });
            } else {
                setTried(true);
            }
        });
    }, []);

    // if the connection worked, wait until we get confirmation of that to flip the flag
    useEffect(() => {
        if (!tried && active) {
            setTried(true);
        }
    }, [tried, active]);

    return tried;
}

export function useInactiveListener(key: string, suppress: boolean = false) {
    const { active, error, activate } = useWeb3React(key);

    useEffect((): any => {
        const { ethereum } = window as any;
        if (ethereum && ethereum.on && !active && !error && !suppress) {
            const handleConnect = () => {
                activate(injectedConnector);
            };
            const handleDisconnect = () => {
                injectedConnector.deactivate();
            };
            const handleChainChanged = (_chainId: string | number) => {
                // Changing the chain is irrelavent now
            };
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    activate(injectedConnector);
                }
            };
            const handleNetworkChanged = (_networkId: string | number) => {
                // Changing the network is irrelavent now
            };

            ethereum.on('connect', handleConnect);
            ethereum.on('disconnect', handleDisconnect);
            ethereum.on('chainChanged', handleChainChanged);
            ethereum.on('accountsChanged', handleAccountsChanged);
            ethereum.on('networkChanged', handleNetworkChanged);

            return () => {
                if (ethereum.removeListener) {
                    ethereum.removeListener('connect', handleConnect);
                    ethereum.removeListener('disconnect', handleDisconnect);
                    ethereum.removeListener('chainChanged', handleChainChanged);
                    ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    ethereum.removeListener('networkChanged', handleNetworkChanged);
                }
            };
        }
    }, [active, error, suppress, activate]);
}

export const NetworkProvider = ({ children }: NetworkContextProviderProps) => {
    const walletProvider = useWeb3React('wallet');
    const selectedProvider = walletProvider;
    const network = networks.find((network) => network.id == defaultNetworkId);

    // handle eagerly (re)connect to the injected ethereum provider, if it exists and isAuthorized
    const triedEager = useEagerConnect('wallet');

    // handle connect in reaction to certain events on the injected ethereum provider, if it exists
    useInactiveListener('wallet', !triedEager);

    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    useEffect(() => {
        injectedConnector.isAuthorized().then((isAuthorized: boolean) => setIsAuthorized(isAuthorized));
    }, [walletProvider.account]);

    // context
    const store = { isAuthorized, network, connect, ...selectedProvider };

    function connect() {
        if (!network) {
            console.error(`connect: network config not ready or unsupported network id: ${defaultNetworkId}`);
            return;
        }
        if (walletProvider.connector && walletProvider.active) {
            console.warn('connect: already connected');
            return;
        }
        walletProvider
            .activate(injectedConnector)
            .catch((err) => console.error('failed to activate wallet provider:', err));
    }

    return <NetworkContext.Provider value={store}>{children}</NetworkContext.Provider>;
};
