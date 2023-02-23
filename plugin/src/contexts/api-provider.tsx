/** @format */

import { ReactNode, useState, useEffect } from 'react';
import { useNetworkContext } from '@app/contexts/network-provider';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import generatedIntrospection from '@app/types/queries-fragments';

export interface APIContextProviderProps {
    children?: ReactNode;
}

export const APIProvider = ({ children }: APIContextProviderProps) => {
    const { network } = useNetworkContext();
    const [client, setClient] = useState<ApolloClient<any>>();

    useEffect(() => {
        if (!network) {
            return;
        }
        const httpLink = new HttpLink({
            uri: network.api
        });
        const wsLink = new GraphQLWsLink(
            createClient({
                url: network.api.replace(/http(s?):/, 'ws$1:')
            })
        );
        const link = split(
            ({ query }) => {
                const definition = getMainDefinition(query);
                return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
            },
            wsLink,
            httpLink
        );
        const client = new ApolloClient({
            cache: new InMemoryCache({
                possibleTypes: generatedIntrospection.possibleTypes
            }),
            link
        });
        setClient(client);
    }, [network]);

    if (!client) {
        return <div>loading</div>; // TODO: loading
    }
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
