/** @format */

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { useNetworkContext } from './network-provider';
import { useApolloClient } from '@apollo/client';
import { DispatchDocument, SigninDocument } from '@app/types/queries';
import { Interface } from 'ethers/lib/utils';

export interface SessionContextProviderProps {
    children?: ReactNode;
    actions: Interface;
}

export interface SessionContextStore {
    session?: ethers.Wallet;
    hasSignedMessage: boolean;
    hasSignedIn: boolean;
    hasFailed: boolean;
    signin(gameID: string): Promise<any>;
    dispatch(gameID: string, actionName: string, ...actionArgs: any): Promise<any>;
    dispatchEncodedAction(gameID: string, action: string): Promise<any>;
}

export const SessionContext = createContext<SessionContextStore>({} as SessionContextStore);
export const useSessionContext = () => useContext(SessionContext);

export const COGSessionProvider = ({ children, actions }: SessionContextProviderProps) => {
    const { account, library } = useNetworkContext();
    const client = useApolloClient();
    const [session, setSession] = useState<ethers.Wallet | undefined>(undefined);
    const [hasSignedMessage, setHasSignedMessage] = useState<boolean>(false);
    const [hasSignedIn, setHasSignedIn] = useState<boolean>(false);
    const [hasFailed, setHasFailed] = useState<boolean>(false);
    const [signinAccount, setSigninAccount] = useState<string>('');

    console.log(`PLUGIN account: ${account} hasSignedIn: ${hasSignedIn} session: ${session?.address}`);

    // -- On account change, clear the session key and signin flag
    useEffect(() => {
        if (account && account != signinAccount) {
            setSession(undefined);
            setHasSignedMessage(false);
            setHasSignedIn(false);
            setSigninAccount(account);
        }
    }, [account, signinAccount]);

    // -- Create a new session key if one doesn't exist otherwise use existing key to make wallet instance
    useEffect(() => {
        if (!session) {
            console.log('Generating session key');
            const session = ethers.Wallet.createRandom();
            setSession(session);
        }
    }, [session]);

    // -- Methods

    const signin = async (gameID: string) => {
        if (session && library) {
            const signer: ethers.Signer = library.getSigner();
            const msg = ethers.utils.concat([
                ethers.utils.toUtf8Bytes(`You are signing in with session: `),
                ethers.utils.getAddress(session.address)
            ]);

            let auth: string = '';
            try {
                auth = await signer.signMessage(msg);
                console.log(`Successfully signed message:`, auth);
            } catch (e) {
                console.error('Faied to sign in: ', e);
                setHasFailed(true);
            }

            if (!auth) {
                return;
            }

            setHasSignedMessage(true);

            try {
                const signinResult = await client.mutate({
                    mutation: SigninDocument,
                    variables: { gameID, auth, session: session.address },
                    fetchPolicy: 'network-only'
                });

                const signinSuccessful = signinResult.data.signin; // Not sure if this is always true?

                setHasSignedIn(signinSuccessful);
            } catch (e) {
                console.error('Failed to sign in: ', e);
                setHasSignedMessage(false); // Will cause the frontend to prompt the player to sign-in again
                setHasFailed(true);
            }
        }
    };

    const dispatch = async (gameID: string, actionName: string, ...actionArgs: any): Promise<any> => {
        if (!session) return;

        console.log('dispatching', actionName, actionArgs);
        const action = actions.encodeFunctionData(actionName, actionArgs);
        const actionDigest = ethers.utils.arrayify(ethers.utils.keccak256(action));
        const auth = await session.signMessage(actionDigest);
        return client.mutate({ mutation: DispatchDocument, variables: { gameID, auth, action } }).then((res) => {
            console.log('dispatched', actionName);
            return res.data.dispatch;
        });
    };

    const dispatchEncodedAction = async (gameID: string, action: string): Promise<any> => {
        if (!session) return;

        console.log('cogSessionProvider.dispatchEncodedAction:', action);
        const actionDigest = ethers.utils.arrayify(ethers.utils.keccak256(action));
        const auth = await session.signMessage(actionDigest);
        return client.mutate({ mutation: DispatchDocument, variables: { gameID, auth, action } }).then((res) => {
            return res.data.dispatch;
        });
    };

    // context
    const store = {
        session,
        hasSignedMessage,
        hasSignedIn,
        hasFailed,
        signin,
        dispatch,
        dispatchEncodedAction
    };

    return <SessionContext.Provider value={store}>{children}</SessionContext.Provider>;
};
