export const MIN_BRIDGE_AMOUNT = 4; // 5 $
export const MIN_BALANCE_TO_DEPOSIT = 1; // 2 $
export const TIME_EACH_PROCESS = 30 * 60 * 1000;

export const CHAIN_ID: any = {
    sapphire: "23294",
    base: "8453",
    arbitrum: "42161",
};

export const RPC: any = {
    base: "https://base.llamarpc.com",
    sapphire: "https://sapphire.oasis.io/",
    arbitrum: "https://arb1.arbitrum.io/rpc",
};

export const EVM_ADDRESS = {
    base: {
        compoundV3Module: "0x51f86c784BfC4da2B0726b3E53663f0f039c50b6",
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        fundFee: "0x16dEaA3faA106d6a142035603F78F5639098713a",
    },
    sapphire: {
        usdc: "0x97eec1c29f745dC7c267F90292AA663d997a601D",
        omniFarming: "0xa4411Ad2FCED7a9f9145DA02817fc341b948b4FF",
        fundFee: "0xB5E49fF0acD4d5cD76086e4D9552f9ce5875B157",
    },
    arbitrum: {
        aaveV3Module: "0x7Ca8A8e59655c94a8d35f7335C1305B92b72A2fd",
        usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        fundFee: "0x5c8082B6de13A347F87255bfE74e25EE0228B0a2",
    },
};
