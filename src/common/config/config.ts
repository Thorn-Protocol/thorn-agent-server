export const MIN_SWAP_AMOUNT = 5; // 5 $
export const MIN_BALANCE_TO_DEPOSIT = 1; // 2 $
export const TIME_EACH_PROCESS = 60 * 1000;

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

export const EVM_ADDRESS = {
    base: {
        compoundV3Module: "0x6826EC1c186296314DCa00A96732d6Ad7695B098",
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        fundFee: "0x7Ca8A8e59655c94a8d35f7335C1305B92b72A2fd",
    },
    sapphire: {
        usdc: "0x97eec1c29f745dC7c267F90292AA663d997a601D",
        omniFarming: "0x16dEaA3faA106d6a142035603F78F5639098713a",
        fundFee: "0x59Dc612A3DC4CC2bd6179d15c2fE0A3f258F54ed",
    },
};
