import { ethers } from "ethers";
import axios from "axios";

const PATH_FINDER_API_URL = "https://api-beta.pathfinder.routerprotocol.com/api";

export class RouterService {
    async getQuote(params: any) {
        const endpoint = "v2/quote";
        const quoteUrl = `${PATH_FINDER_API_URL}/${endpoint}`;
        try {
            const res = await axios.get(quoteUrl, { params });
            return res.data;
        } catch (e) {
            console.error(`Fetching quote data from pathfinder: ${e}`);
            throw e;
        }
    }

    getTransaction = async (params: any, quoteData: any) => {
        const endpoint = "v2/transaction";
        const txDataUrl = `${PATH_FINDER_API_URL}/${endpoint}`;

        try {
            const res = await axios.post(txDataUrl, {
                ...quoteData,
                senderAddress: params.senderAddress,
                receiverAddress: params.receiverAddress,
                refundAddress: params.refundAddress, // (optional) By default equal to
                // `senderAddress` if not provided
            });

            return res.data;
        } catch (e) {
            console.error(`Fetching tx data from pathfinder: ${e}`);
        }
    };

    async getTxnBridgeUSDC(from: string, to: string, srcChain: string, destChain: string, usdcSrc: string, usdcDest: string, amount: bigint) {
        const paramsQuote = {
            fromTokenAddress: usdcSrc,
            toTokenAddress: usdcDest,
            amount: amount,
            fromTokenChainId: srcChain,
            toTokenChainId: destChain,
            partnerId: 1,
        };
        let quote = await this.getQuote(paramsQuote);
        let txn = await this.getTransaction(
            {
                senderAddress: from,
                receiverAddress: to,
                refundAddress: from,
            },
            quote
        );
        console.log(txn);

        let feeData = txn.bridgeFee;

        let amountSend = Number(ethers.formatUnits(txn.source.tokenAmount, txn.source.asset.decimals));
        let amountReceived = Number(ethers.formatUnits(txn.destination.tokenAmount, txn.destination.asset.decimals));
        let feeNumber = amountSend - amountReceived;
        let fee = ethers.parseUnits(feeNumber.toFixed(6), txn.destination.asset.decimals);

        console.log(`
--Bridge invoice--
from: ${srcChain}
to: ${destChain}
amountSend: ${amountSend}
amountReceived: ${amountReceived}
fee: ${feeNumber.toFixed(6)}
`);
        return {
            allowanceTo: txn.allowanceTo,
            to: txn.txn.to,
            data: txn.txn.data,
            value: txn.txn.value,
            feeOnDestChain: fee,
            feeData: feeData,
        };
    }

    async fetchStatus(txHash: string) {
        const STATS_API_URL = "https://api-beta.pathfinder.routerprotocol.com/api/v2";
        const url = `${STATS_API_URL}/status?srcTxHash=${txHash}`;
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error(`Error fetching transaction status: ${error}`);
            throw error;
        }
    }

    async wait(txHash: string) {
        await this.sleep(20 * 1000); // wait 20s for router catch event
        let data = await this.fetchStatus(txHash);
        if (data.src_timestamp == null) {
            console.log(`Transaction ${txHash} is not found`);
            return;
        }

        return new Promise(async (resolve, reject) => {
            let data;
            try {
                data = await this.fetchStatus(txHash);
                if (data.status === "completed") {
                    resolve(data);
                } else {
                    const checkStatus = async () => {
                        try {
                            data = await this.fetchStatus(txHash);
                            if (data.status === "completed") {
                                resolve(data);
                            } else {
                                setTimeout(checkStatus, 5000);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };
                    checkStatus();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async getBalanceBridging(senderAddress: string) {
        const GRAPHQL_API_URL = "https://api.explorer.routernitro.com/graphql";
        const query = `
        query TransactionsList(
            $where: NitroTransactionFilter,
            $sort: NitroTransactionSort,
            $limit: Int,
            $page: Int
        ) {
            findNitroTransactionsByFilter(
                where: $where,
                sort: $sort,
                limit: $limit,
                page: $page
            ) {
                limit
                page
                total
                data {
                    src_timestamp
                    dest_timestamp
                    src_chain_id
                    dest_chain_id
                    src_tx_hash
                    dest_tx_hash
                    status
                    src_address
                    dest_address
                    src_amount
                    dest_amount
                    dest_stable_amount
                    src_symbol
                    dest_symbol
                    dest_stable_symbol
                    has_message
                    native_token_amount
                    deposit_id
                }
            }
        }
    `;

        const variables = {
            where: {
                src_chain_id: null,
                dest_chain_id: null,
                status: {
                    eq: "pending",
                },
                transaction_type: null,
                sender_address: senderAddress,
            },
            sort: {
                src_timestamp: "desc",
            },
            limit: 100,
            page: 1,
        };

        try {
            const response = await axios.post(
                GRAPHQL_API_URL,
                { query, variables },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );

            let data = response.data.data.findNitroTransactionsByFilter;

            let balance = 0;
            data.data.forEach((e: any) => {
                console.log(e);
                if (e.src_symbol == "USDC") {
                    balance += Number(e.src_amount);
                }
            });
            return balance;
        } catch (error) {
            console.error(`Error fetching bridging balance: ${error}`);
            throw error;
        }
    }
}

export const routerService = new RouterService();
