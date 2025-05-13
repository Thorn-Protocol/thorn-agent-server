export const TIME_EACH_PROCESS = 10 * 60 * 1000;

export const NETWORK: any = {
    sapphire: {
        chainId: 23295,
        rpc: "https://sapphire.oasis.io/",
    },
};

export const CHAIN_ID: any = {
    sapphire: "23294",
    base: "8453",
};

export const RPC: any = {
    base: "https://base.llamarpc.com",
    sapphire: "https://sapphire.oasis.io/",
};

export const EVM_ADDRESS: any = {
    base: {
        compoundV3Module: "0x6826EC1c186296314DCa00A96732d6Ad7695B098",
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        fundFee: "0x5c8082B6de13A347F87255bfE74e25EE0228B0a2",
    },
    sapphire: {
        usdc: "0x97eec1c29f745dC7c267F90292AA663d997a601D",
        omniFarming: "0x51f86c784BfC4da2B0726b3E53663f0f039c50b6",
        fundFee: "0x59Dc612A3DC4CC2bd6179d15c2fE0A3f258F54ed",
    },
};
