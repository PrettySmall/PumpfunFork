"use client"

import React, { createContext, useEffect, useState, useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { 
    contract_getMainStateInfo, 
    contract_getPoolStateInfo,
    contract_isInitialized, 
    contract_initMainState, 
    contract_isPoolCreated, 
    contract_createPoolTx, 
    contract_buyTx, 
    contract_sellTx, 
    contract_updateMainStateInfo, 
    contract_isPoolComplete, 
    contract_withdraw2Tx
} from './contracts';


export const ContractContext = createContext();

const ContractContextProvider = ({ children }) => {
    const [txLoading, setTxLoading] = useState(false);

    const walletCtx = useWallet();

    useEffect(() => {
    }, []);

    const getOwnerAddress = async () => {
        const mainStateInfo = await contract_getMainStateInfo(walletCtx);
        if (!mainStateInfo) return null;
        return mainStateInfo.owner;
    };

    const getMainStateInfo = async () => {
        return await contract_getMainStateInfo(walletCtx);
    };

    const getPoolStateInfo = async (baseToken) => {
        return await contract_getPoolStateInfo(walletCtx, baseToken);
    };

    const isContractInitialized = async () => {
        return await contract_isInitialized(walletCtx);
    };

    const initializeContract = async () => {
        setTxLoading(true);

        try {
            await contract_initMainState(walletCtx);
        } catch (err) {
            console.error(err);
            throw new Error(err.message);
        }

        setTxLoading(false);
    };

    const isPoolCreated = async (baseToken) => {
        return await contract_isPoolCreated(walletCtx, baseToken);
    };

    const getCreatePoolTx = async (baseToken) => {
        let tx = null;

        setTxLoading(true);

        try {
            tx = await contract_createPoolTx(walletCtx, baseToken);
        } catch (err) {
            console.error(err);
            throw new Error(err.message);
        }

        setTxLoading(false);

        return tx;
    };

    const getBuyTx = async (token, amount, isSol, isSnipe = false) => {
        let tx = null;

        setTxLoading(true);

        try {
            tx = await contract_buyTx(walletCtx, token, amount, isSol, isSnipe);
        } catch (err) {
            console.error('Error on ContractContext.js', err);
            throw new Error(err.message);
        }

        setTxLoading(false);

        return tx;
    };

    const getSellTx = async (token, amount) => {
        let tx = null;

        setTxLoading(true);

        try {
            tx = await contract_sellTx(walletCtx, token, amount);
        } catch (err) {
            console.error(err);
            throw new Error(err.message);
        }

        setTxLoading(false);

        return tx;
    };

    const updateMainStateInfo = async (feeRecipient, tradingFee) => {
        setTxLoading(true);

        try {
            await contract_updateMainStateInfo(walletCtx, feeRecipient, tradingFee);
        } catch (err) {
            console.error(err);
            throw new Error(err.message);
        }

        setTxLoading(false);
    };

    const isPoolComplete = async (baseToken) => {
        return await contract_isPoolComplete(walletCtx, baseToken);
    };

    const context = {
        getOwnerAddress, 
        getMainStateInfo, 
        getPoolStateInfo,
        isContractInitialized, 
        initializeContract, 
        isPoolCreated, 
        getCreatePoolTx, 
        getBuyTx, 
        getSellTx, 
        updateMainStateInfo, 
        isPoolComplete
    };

    return <ContractContext.Provider value={context}>{children}</ContractContext.Provider>
};

export const useContract = () => {
    const contractManager = useContext(ContractContext);
    return contractManager || [{}, async () => {}];
};

export default ContractContextProvider;
