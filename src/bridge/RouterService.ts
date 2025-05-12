import { ethers } from "ethers";
import axios from "axios";

const PATH_FINDER_API_URL = "https://api-beta.pathfinder.routerprotocol.com/api";

export class RouterService {
    async getQuote(params: any) {
        const endpoint = "v2/quote";
        const quoteUrl = `${PATH_FINDER_API_URL}/${endpoint}`;
        console.log({ params });
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

    async getTxnBridgeUSDC(from: string, to: string, srcChain: string, destChain: string, usdcSrc: string, usdcDest: string, amount: BigInt) {
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
        let amountSend = Number(ethers.formatUnits(txn.source.tokenAmount, txn.source.asset.decimals));
        let amountReceived = Number(ethers.formatUnits(txn.destination.tokenAmount, txn.destination.asset.decimals));
        let feeNumber = amountSend - amountReceived;
        let fee = ethers.parseUnits(feeNumber.toFixed(6), txn.destination.asset.decimals);
        return {
            allowanceTo: txn.allowanceTo,
            to: txn.txn.from,
            data: txn.txn.data,
            value: txn.txn.value,
            fee: fee,
        };
    }
}

export const routerService = new RouterService();
