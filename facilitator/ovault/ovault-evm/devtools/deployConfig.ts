import { EndpointId } from '@layerzerolabs/lz-definitions'

export const DEPLOYMENT_CONFIG = {
    // Vault chain configuration (where the ERC4626 vault lives)
    vault: {
        eid: EndpointId.BASESEP_V2_TESTNET,
        contracts: {
            vault: 'CuratorERC4626',
            shareAdapter: 'CuratorStakeShareOFTAdapter',
            composer: 'CuratorOVaultComposer',
        },
        // IF YOU HAVE A PRE-DEPLOYED ASSET, SET THE ADDRESS HERE
        // this will effectively skip the deployment of the asset OFT, and use this instead.
        assetAddress: undefined, // Set to '0x...' to use existing asset
    },

    // Asset OFT configuration (deployed on all chains OR use existing address)
    asset: {
        contract: 'UsdSurfOFT',
        metadata: {
            name: 'UsdSurfOFT',
            symbol: 'ASSET',
        },
        chains: [EndpointId.OPTSEP_V2_TESTNET, EndpointId.BASESEP_V2_TESTNET, EndpointId.ARBSEP_V2_TESTNET],
    },

    // Share OFT configuration (only on spoke chains)
    share: {
        contract: 'CuratorStakeShareOFT',
        metadata: {
            name: 'CuratorStakeShareOFT',
            symbol: 'SHARE',
        },
        chains: [EndpointId.OPTSEP_V2_TESTNET, EndpointId.ARBSEP_V2_TESTNET], // No vault chain
    },
} as const

export const isVaultChain = (eid: number): boolean => eid === DEPLOYMENT_CONFIG.vault.eid
export const shouldDeployAsset = (eid: number): boolean =>
    !DEPLOYMENT_CONFIG.vault.assetAddress && DEPLOYMENT_CONFIG.asset.chains.includes(eid)
export const shouldDeployShare = (eid: number): boolean => DEPLOYMENT_CONFIG.share.chains.includes(eid)
