
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import * as anchor from '@project-serum/anchor';
import { LAMPORTS_PER_SOL, 
    PublicKey, 
    SystemProgram, 
    Transaction
} from '@solana/web3.js';
import { NATIVE_MINT, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    getMint, 
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import BN from 'bn.js';

import { PUMPFUN_PROGRAM_ID, 
    FEE_PRE_DIV 
} from './constants';
import { IDL } from './idl';
import * as Keys from './keys';
import { 
    connection
} from '../../engine/config';
import { send } from "@/engine/utils";
import { TOKEN_DECIMALS } from "@/engine/consts";
import {
    getOutputAmountOnBuy,
    getInputAmountOnBuy,
    getOutputAmountOnSell
} from '../PriceContext'

const getProgram = (wallet) => {
    const provider = new anchor.AnchorProvider(
        connection, 
        wallet, 
        anchor.AnchorProvider.defaultOptions()
    );

    const program = new anchor.Program(IDL, PUMPFUN_PROGRAM_ID, provider);
    return program;
};


export const contract_getMainStateInfo = async (walletCtx) => {
    if (!walletCtx.connected) return null;

    const mainStateKey = await Keys.getMainStateKey();

    let mainStateInfo = await connection.getAccountInfo(mainStateKey);
    if (!mainStateInfo) return null;

    const program = getProgram(walletCtx);
    mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    return mainStateInfo;
};

export const contract_getPoolStateInfo = async (walletCtx, baseToken) => {
    if (!walletCtx.connected) return null;
    const program = getProgram(walletCtx);

    const baseMint = new PublicKey(baseToken);
    if (!baseMint) {
        throw new Error("Invalid token");
    }
    const quoteMint = new PublicKey(NATIVE_MINT);
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);

    let poolStateInfo = null;
    try {
        poolStateInfo = await program.account.poolState.fetch(poolStateKey);
    } catch (error) {        
    }
    return poolStateInfo;
}

export const contract_isInitialized = async (walletCtx) => {
    const mainStateInfo = await contract_getMainStateInfo(walletCtx);
    return mainStateInfo !== null && mainStateInfo.owner !== null;
};

export const contract_initMainState = async (walletCtx) => {
    if (!walletCtx.connected)
        throw new WalletNotConnectedError();

    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();

    const quoteMint = new PublicKey(NATIVE_MINT);
    const feeQuoteAta = getAssociatedTokenAddressSync(quoteMint, walletCtx.publicKey);

    const tx = new Transaction().add(
        await program.methods
            .initMainState()
            .accounts({
                owner: walletCtx.publicKey, 
                mainState: mainStateKey, 
                quoteMint, 
                feeQuoteAta, 
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, 
                tokenProgram: TOKEN_PROGRAM_ID, 
                systemProgram: SystemProgram.programId
            })
            .instruction()
    );

    const txHash = await send(connection, walletCtx, tx);
};

export const contract_isPoolCreated = async (walletCtx, baseToken) => {
    if (!walletCtx.connected) return false;

    try {
        const baseMint = new PublicKey(baseToken);
        const quoteMint = new PublicKey(NATIVE_MINT);
        const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
        if (!poolStateKey) return false;

        const program = getProgram(walletCtx);
        const poolStateInfo = await program.account.poolState.fetch(poolStateKey);
        return poolStateInfo ? true : false;
    } catch (err) {
        console.error(err.message);
        return false;
    }
};

export const contract_createPoolTx = async (walletCtx, baseToken) => {
    if (!walletCtx.connected)
        throw new WalletNotConnectedError();

    const creator = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();

    const baseMint = new PublicKey(baseToken);
    if (!baseMint)
        throw new Error("Invalid token");

    const quoteMint = new PublicKey(NATIVE_MINT);
    const creatorBaseAta = getAssociatedTokenAddressSync(baseMint, creator);
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    const ix = await program.methods
        .createPool()
        .accounts({
            creator, 
            mainState: mainStateKey, 
            poolState: poolStateKey, 
            baseMint, quoteMint, 
            creatorBaseAta,  
            reserverBaseAta, reserverQuoteAta, 
            systemProgram: SystemProgram.programId, 
            tokenProgram: TOKEN_PROGRAM_ID, 
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
        .instruction();

    return ix;
};

export const contract_buyTx = async (walletCtx, baseToken, amount, isSol, isSnipe) => {
    if (!walletCtx.connected)
        throw new WalletNotConnectedError();

    const buyer = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    const mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    if (!mainStateInfo) {
        throw new Error("Failed to fetch mainState!");
    }

    const baseMint = new PublicKey(baseToken);
    if (!baseMint) {
        throw new Error("Invalid token");
    }
    const quoteMint = new PublicKey(NATIVE_MINT);
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);

    let poolStateInfo = null;
    if(!isSnipe) {
        poolStateInfo = await program.account.poolState.fetch(poolStateKey);
    }
    
    const buyerBaseAta = getAssociatedTokenAddressSync(baseMint, buyer);
    const buyerQuoteAta = getAssociatedTokenAddressSync(quoteMint, buyer);
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    const feeQuoteAta = getAssociatedTokenAddressSync(quoteMint, mainStateInfo.feeRecipient);

    let ix = null;

    if (isSol) {
        const quoteBalance = new BN(Math.floor(amount * LAMPORTS_PER_SOL));
        let minBaseAmount = 1
        if(!isSnipe) {            
            const { outAmount, minAmount } = getOutputAmountOnBuy(mainStateInfo, poolStateInfo, quoteBalance)
            minBaseAmount = minAmount
        }
        ix = await program.methods
            .buyTokensFromExactSol(quoteBalance, new BN(minBaseAmount))
            .accounts({
                baseMint, quoteMint, 
                buyer, buyerBaseAta, buyerQuoteAta, 
                mainState: mainStateKey, 
                poolState: poolStateKey, 
                feeRecipient: mainStateInfo.feeRecipient, feeQuoteAta, 
                reserverBaseAta, reserverQuoteAta, 
                systemProgram: SystemProgram.programId, 
                tokenProgram: TOKEN_PROGRAM_ID, 
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
            })
            // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
            .instruction();
    } else {
        const baseMintDecimals = TOKEN_DECIMALS;
        const baseBalance = new BN(Math.floor(amount * (10 ** baseMintDecimals)));
        let maxQuoteAmount = 100_000_000_000;
        if(!isSnipe) {            
            const { inAmount, maxAmount } = getInputAmountOnBuy(mainStateInfo, poolStateInfo, baseBalance)
            maxQuoteAmount = maxAmount
        }
        ix = await program.methods
            .buyExactTokensFromSol(baseBalance, new BN(maxQuoteAmount))
            .accounts({
                baseMint, quoteMint, 
                buyer, buyerBaseAta, buyerQuoteAta, 
                mainState: mainStateKey, 
                poolState: poolStateKey, 
                feeRecipient: mainStateInfo.feeRecipient, feeQuoteAta, 
                reserverBaseAta, reserverQuoteAta, 
                systemProgram: SystemProgram.programId, 
                tokenProgram: TOKEN_PROGRAM_ID, 
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
            })
            // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
            .instruction();
    }

    return ix;
};

export const contract_sellTx = async (walletCtx, baseToken, sellAmount) => {
    if (!walletCtx.connected)
        throw new WalletNotConnectedError();

    const seller = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    const mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    if (!mainStateInfo) {
        throw new Error("Failed to fetch mainState!");
    }

    const baseMint = new PublicKey(baseToken);
    if (!baseMint) {
        throw new Error("Invalid token");
    }
    const quoteMint = new PublicKey(NATIVE_MINT);
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    const poolStateInfo = await program.account.poolState.fetch(poolStateKey);
    if (!poolStateInfo)
        throw new Error("Failed to fetch poolState!");
    
    const baseMintDecimals = TOKEN_DECIMALS;
    const sellBalance = new BN(Math.floor(sellAmount * (10 ** baseMintDecimals)));
    const sellerBaseAta = getAssociatedTokenAddressSync(baseMint, seller);
    const sellerQuoteAta = getAssociatedTokenAddressSync(quoteMint, seller);
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    const feeQuoteAta = getAssociatedTokenAddressSync(quoteMint, mainStateInfo.feeRecipient);

    const { outAmount, minAmount } = getOutputAmountOnSell(mainStateInfo, poolStateInfo, sellBalance)
    const minQuoteAmount = minAmount
    
    const ix = await program.methods
        .sell(sellBalance, new BN(minQuoteAmount))
        .accounts({
            mainState: mainStateKey, 
            poolState: poolStateKey, 
            baseMint, quoteMint, 
            seller, sellerBaseAta, sellerQuoteAta, 
            reserverBaseAta, reserverQuoteAta, 
            feeRecipient: mainStateInfo.feeRecipient, feeQuoteAta, 
            systemProgram: SystemProgram.programId, 
            tokenProgram: TOKEN_PROGRAM_ID, 
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
        .instruction();

    return ix;
};

export const contract_updateMainStateInfo = async (walletCtx, feeRecipient, tradingFee) => {
    if (!walletCtx.connected) return false;

    let newFeeRecipient = null;
    let newTradingFee = null;
    
    const address2 = new PublicKey(feeRecipient);
    if (!address2) throw new Error('Invalid fee recipient address!');
    newFeeRecipient = address2;

    const quoteMint = new PublicKey(NATIVE_MINT);
    const feeQuoteAta = getAssociatedTokenAddressSync(quoteMint, newFeeRecipient);
    
    const tmpFee = Math.trunc(tradingFee * FEE_PRE_DIV);
    newTradingFee = new BN(tmpFee);

    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    const mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    if (!mainStateInfo) {
        throw new Error("Failed to fetch mainState!");
    }

    const tx = new Transaction().add(
        await program.methods.updateMainState({
            feeRecipient: newFeeRecipient, 
            tradingFee: newTradingFee,
            totalSupply: mainStateInfo.totalSupply, 
            initVirtBaseReserves: mainStateInfo.initVirtBaseReserves, 
            initVirtQuoteReserves: mainStateInfo.initVirtQuoteReserves,
            realQuoteThreshold: mainStateInfo.realQuoteThreshold
        })
        .accounts({
            owner: walletCtx.publicKey,
            mainState: mainStateKey,
            quoteMint,
            feeRecipient: newFeeRecipient,
            feeQuoteAta,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        .instruction()
    );

    const txHash = await send(connection, walletCtx, tx);
    console.log('  updateMainState txHash:', txHash);
};

export const contract_isPoolComplete = async (walletCtx, baseToken) => {
    if (!walletCtx.connected) return false;

    const baseMint = new PublicKey(baseToken);
    const quoteMint = new PublicKey(NATIVE_MINT);
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);

    const program = getProgram(walletCtx);
    const poolStateInfo = await program.account.poolState.fetch(poolStateKey);
    if (!poolStateInfo) return false;

    return poolStateInfo?.complete;
};

