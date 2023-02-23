/** @format */

import { Fragment } from 'react';
import { useRouter } from 'next/router';
import { Anchor } from '@app/types/anchor';
import Head from 'next/head';
import { FunctionComponent, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { ComponentProps } from '@app/types/component-props';
import { Text } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useCogPlugin } from '@app/contexts/cog-plugin-provider';
import { useGetStateQuery } from '@app/types/queries';
import { Auth } from '@app/components/views/auth';
import { Plugin } from '@app/components/views/plugin';
import { useSessionContext } from '@app/contexts/cog-session-provider';

type TileCoords = [number, number, number] | null;

export interface PluginProps extends ComponentProps {
    id: string; // contract address of extension
    width: number;
    height: number;
    anchor: Anchor;
}

const StyledPlugin = styled.div`
    opacity: 0.95;
`;

function getAddress(addr: string): string | null {
    try {
        return ethers.utils.getAddress(addr).toString();
    } catch {
        return null;
    }
}

export const PluginWrapper: FunctionComponent<PluginProps> = (props: PluginProps) => {
    const { width, height, anchor, id: extID } = props;
    const { registerPlugin } = useCogPlugin();
    const { hasSignedIn } = useSessionContext();
    const [hasRegistered, setHasRegistered] = useState(false);
    const [selectedTile, setSelectedTile] = useState<TileCoords>(null);
    const [account, setAccount] = useState<string | null>(null);

    useEffect(() => {
        const handleMessage = (message: any) => {
            const { method, args } = message.data;
            if (method != 'tileInteraction') {
                return;
            }
            setSelectedTile(args as TileCoords);

            console.log('ExamplePlugin: tile selected', args);
        };

        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    });

    useEffect(() => {
        const handleMessage = (message: any) => {
            const { method, args } = message.data;
            switch (method) {
                case 'ready': {
                    const [account] = args;
                    console.log('ExamplePlugin recv: ready', account);
                    setAccount(account);
                    break;
                }
                case 'tileInteraction': {
                    const [q, r, s] = args;
                    console.log('ExamplePlugin recv: tileInteraction', q, r, s);
                    setSelectedTile([q, r, s]);
                    break;
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    });

    useEffect(() => {
        if (!hasRegistered) {
            registerPlugin(width, height, anchor);
            setHasRegistered(true);
        }
    }, [hasRegistered, width, height, anchor, registerPlugin]);

    const { data, error: queryError } = useGetStateQuery({
        pollInterval: 2000,
        variables: { extID: getAddress(extID) || '' }
    });

    const selectedSeeker = data?.game?.state.seekers.find((seeker) => {
        if (!seeker.owner) {
            return false;
        }
        if (seeker.owner.addr == '0x0') {
            return false;
        }
        return getAddress(seeker.owner.addr) == account;
    });

    if (queryError) {
        return <Text>query fail {queryError.toString()}</Text>;
    } else if (!data?.extension) {
        return <Text>failed to find extension for {extID}</Text>;
    } else if (!hasSignedIn) {
        return <Auth gameID={data.extension.name} />;
    }

    return (
        <StyledPlugin>
            <Plugin
                extension={data.extension}
                dawnseekers={data.game.state}
                selectedSeeker={selectedSeeker}
                selectedTile={selectedTile}
            />
        </StyledPlugin>
    );
};

export default function PluginPage() {
    const router = useRouter();
    const id = router.query.id as string;

    return (
        <Fragment>
            <Head>
                <title>Example plugin</title>
                <meta property="og:title" content="Example plugin" key="title" />
            </Head>
            <PluginWrapper width={300} height={200} anchor={Anchor.TopLeft} id={id} />
        </Fragment>
    );
}
