
import {
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    ComputeBudgetProgram,
    VersionedTransaction,
    TransactionMessage
} from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    SPL_ACCOUNT_LAYOUT,
    InstructionType
} from '@raydium-io/raydium-sdk';
import {
    getComputeBudgetConfigHigh,
    getOptimalPriceAndBudget
} from './fee'
import { isMainNet } from "./config"

import axios from "axios";
import base58 from 'bs58';
import dotenv from 'dotenv';
import Config from '@/config/config';

dotenv.config({
    path: '.env',
});

const jitotipAccounts = [
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT', // Jitotip 8
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', // Jitotip 5
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY', // Jitotip 3
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49', // Jitotip 4
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL', // Jitotip 7
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt', // Jitotip 5
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
]

const JITO_TIMEOUT = 150000;

export async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export async function getWalletTokenAccounts(connection, wallet) {
    const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID
    });
    return walletTokenAccount.value.map((i) => ({
        pubkey: i.pubkey,
        programId: i.account.owner,
        accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }));
};


export const prioritizeIxs = async (connection, ixs, feePayer) => {
    try {
        let transaction = new Transaction();

        // const {units, microLamports} = await getComputeBudgetConfigHigh();
        // console.log('units:', units);
        // console.log('microLamports:', microLamports);

        transaction.add(...ixs);
        transaction.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
        transaction.feePayer = feePayer;
        const [priorityFee, computeUnits] = await getOptimalPriceAndBudget(transaction, connection);
        console.log('computeUnits:', computeUnits);
        console.log('priorityFee:', priorityFee);

        // build new tx
        let allIxs = [];

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnits /* units */
        });
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee /* microLamports */
        });

        allIxs.push(modifyComputeUnits);
        allIxs.push(addPriorityFee);
        allIxs.push(...ixs);

        return allIxs;
    } catch (e) {
        console.error(e);
        return ixs;
    }
};

export const prioritizeTx = async (tx) => {
    try {
        let modifyComputeUnits;
        let addPriorityFee;
        let allIxTypes = [];
        let allIxs = [];

        const { units, microLamports } = await getComputeBudgetConfigHigh();
        // console.log('units:', units);
        // console.log('microLamports:', microLamports);

        modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: units * 2
        });

        addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: microLamports
        });

        allIxTypes.push(InstructionType.setComputeUnitLimit);
        allIxs.push(modifyComputeUnits);

        allIxTypes.push(InstructionType.setComputeUnitPrice);
        allIxs.push(addPriorityFee);

        allIxTypes.push(...tx.instructionTypes);
        allIxs.push(...tx.instructions);

        return {
            instructionTypes: allIxTypes,
            instructions: allIxs,
            signers: [],
            lookupTableAddress: {}
        };
    } catch (e) {
        console.error(e);
        return {
            instructionTypes: tx.instructionTypes,
            instructions: tx.instructions,
            signers: [],
            lookupTableAddress: {}
        };
    }
};

export const sendTransaction = async (connection, walletCtx, transaction) => {
    if (walletCtx.publicKey === null || walletCtx.signTransaction === undefined)
        throw new Error("Invalid wallet!");

    try {
        transaction.feePayer = walletCtx.publicKey;
        const signedTx = await walletCtx.signTransaction(transaction);
        const rawTx = signedTx.serialize();

        // console.log('Sending transaction...');
        const txHash = await connection.sendRawTransaction(rawTx, {
            skipPreflight: false,
            maxRetries: 15
        });
        return txHash;
    } catch (err) {
        console.error('sendTransaction err:', err);
        throw new Error(err.message);
    }
};

export const send = async (connection, walletCtx, transaction) => {
    if ((transaction instanceof Transaction)) {
        if (isMainNet) {
            const newIxs = await prioritizeIxs(connection, transaction.instructions, walletCtx.publicKey);
            const tx = new Transaction();
            tx.add(...newIxs);
            transaction = tx;
        }

        transaction.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    }

    try {
        const txHash = await sendTransaction(connection, walletCtx, transaction);
        if (txHash === null) {
            console.error('Transaction failed');
            return;
        }

        // console.log('Confirming transaction...');
        let res = await connection.confirmTransaction(txHash);
        if (res.value.err)
            console.error('Transaction failed');
        else
            console.log('Transaction confirmed');
        return txHash;
    } catch (err) {
        console.error('send err:', err);
        throw new Error(err.message);
    }
};

export async function jitoSendBunleByApi(transactions) {
    try {
        if (transactions.length === 0)
            return;

        let bundleIds = [];
        const rawTransactions = transactions.map(item => base58.encode(item.serialize()));

        const { data } = await axios.post(`https://${Config.BLOCK_ENGINE_URL}/api/v1/bundles`,
            {
                jsonrpc: "2.0",
                id: 1,
                method: "sendBundle",
                params: [
                    rawTransactions
                ],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (data) {
            console.log(data);
            bundleIds = [
                ...bundleIds,
                data.result,
            ];
        }

        console.log("Checking bundle's status...", bundleIds);
        const sentTime = Date.now();
        while (Date.now() - sentTime < JITO_TIMEOUT) {
            try {
                const { data } = await axios.post(`https://${Config.BLOCK_ENGINE_URL}/api/v1/bundles`,
                    {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "getBundleStatuses",
                        params: [
                            bundleIds
                        ],
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (data) {
                    const bundleStatuses = data.result.value;
                    // console.log("Bundle Statuses:", bundleStatuses);
                    let success = true;
                    for (let i = 0; i < bundleIds.length; i++) {
                        const matched = bundleStatuses.find(item => item && item.bundle_id === bundleIds[i]);
                        if (!matched || matched.confirmation_status !== "finalized") {
                            success = false;
                            break;
                        }
                    }

                    if (success)
                        return true;
                }
            }
            catch (err) {
                console.log(err);
            }

            await sleep(1000);
        }
    }
    catch (err) {
        console.log(err);
    }
    return false;
}

export async function jitoSend(
    connection,
    tx,
    signer,
    tip,
) {

    const tipAccount = new PublicKey(jitotipAccounts[0]);
    const tipInstruction = SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: tipAccount,
        lamports: Math.max(Math.floor(tip * LAMPORTS_PER_SOL), 5001),
    })

    tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    tx.feePayer = signer.publicKey;
    await tx.add(tipInstruction)

    const signedTrx = await signer.signTransaction(tx);
    await jitoSendBunleByApi([signedTrx])

    console.log("signedTrx", signedTrx)

    return base58.encode(signedTrx.signatures[0].signature)
}
