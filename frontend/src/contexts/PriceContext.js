import {     
    FEE_PRE_DIV 
} from './contracts/constants';

// output_amount = output_reserve * input_amount / (input_reserve + input_amount)
const calculateOutputAmount = (inputAmount, inputReserve, outputReserve) => {
    const amount = outputReserve * inputAmount
    const divider = inputReserve + inputAmount
    return Math.trunc(amount / divider)
}

// input_amount = output_amount * input_reserve / (output_reserve - output_amount)
const calculateInputAmount = (outputAmount, inputReserve, outputReserve) => {
    if (outputAmount >= outputReserve) {
        throw new Error(`outputAmount can't be greater than or equal to outputReserve`)
    }

    const amount = inputReserve * outputAmount
    const divider = outputReserve - outputAmount
    return Math.trunc(amount / divider)
}

const calcOutputAmountOnBuy = (swapInfo, inputSolAmount) => {
    if (inputSolAmount <= 0) return 0;

    const fee = inputSolAmount * swapInfo.tradingFee / 100;
    let buySolAmount = inputSolAmount - fee;
    if (swapInfo.realQuoteReserves + buySolAmount > swapInfo.realQuoteThreshold) {
        buySolAmount = swapInfo.realQuoteThreshold - swapInfo.realQuoteReserves;
    }
    const inputReserve = swapInfo.realQuoteReserves + swapInfo.virtQuoteReserves;
    const outputReserve = swapInfo.realBaseReserves + swapInfo.virtBaseReserves;
    const outputAmount = calculateOutputAmount(buySolAmount, inputReserve, outputReserve);

    return outputAmount;
}

const calcInputAmountOnBuy = (swapInfo, outputTokenAmount) => {
    if (outputTokenAmount <= 0) return 0;
    if (outputTokenAmount >= swapInfo.realBaseReserves) {
        // throw new Error(`outputTokenAmount can't be greater than realBaseReserves`);
        return swapInfo.realQuoteThreshold - swapInfo.realQuoteReserves
    }

    const inputReserve = swapInfo.realQuoteReserves + swapInfo.virtQuoteReserves;
    const outputReserve = swapInfo.realBaseReserves + swapInfo.virtBaseReserves;
    const inputAmount = calculateInputAmount(outputTokenAmount, inputReserve, outputReserve);
    const fee = inputAmount * swapInfo.tradingFee / (100 - swapInfo.tradingFee);
    const totalInputAmount = inputAmount + fee;

    return totalInputAmount;
}

const calcOutputAmountOnSell = (swapInfo, inputTokenAmount) => {
    if (inputTokenAmount <= 0) return 0;

    const inputReserve = swapInfo.realBaseReserves + swapInfo.virtBaseReserves;
    const outputReserve = swapInfo.realQuoteReserves + swapInfo.virtQuoteReserves;
    const outputAmount = calculateOutputAmount(inputTokenAmount, inputReserve, outputReserve);
    const fee = outputAmount * swapInfo.tradingFee / 100;
    const sellSolAmount = outputAmount - fee;
    
    return sellSolAmount;
}

export const getOutputAmountOnBuy = (mainStateInfo, poolStateInfo, quoteBalance) => {
    const outBaseAmount = calcOutputAmountOnBuy(
        {
            tradingFee: mainStateInfo.tradingFee / FEE_PRE_DIV,
            virtBaseReserves: Number(poolStateInfo?.virtBaseReserves || mainStateInfo.initVirtBaseReserves),
            virtQuoteReserves: Number(poolStateInfo?.virtQuoteReserves || mainStateInfo.initVirtQuoteReserves),
            realBaseReserves: Number(poolStateInfo?.realBaseReserves || mainStateInfo.totalSupply),
            realQuoteReserves: Number(poolStateInfo?.realQuoteReserves || 0),
            realQuoteThreshold: Number(poolStateInfo?.realQuoteThreshold || mainStateInfo.realQuoteThreshold)
        },
        Number(quoteBalance)
    );
    const minBaseAmount = Math.trunc(outBaseAmount * 9 / 10); // TO DO - Calculate with slippage
    return {
        outAmount: outBaseAmount,
        minAmount: minBaseAmount
    }
}

export const getInputAmountOnBuy = (mainStateInfo, poolStateInfo, baseBalance) => {
    const inQuoteAmount = calcInputAmountOnBuy(
        {
            tradingFee: mainStateInfo.tradingFee / FEE_PRE_DIV,
            virtBaseReserves: Number(poolStateInfo?.virtBaseReserves || mainStateInfo.initVirtBaseReserves),
            virtQuoteReserves: Number(poolStateInfo?.virtQuoteReserves || mainStateInfo.initVirtQuoteReserves),
            realBaseReserves: Number(poolStateInfo?.realBaseReserves || mainStateInfo.totalSupply),
            realQuoteReserves: Number(poolStateInfo?.realQuoteReserves || 0),
            realQuoteThreshold: Number(poolStateInfo?.realQuoteThreshold || mainStateInfo.realQuoteThreshold)
        },
        Number(baseBalance)
    );
    const maxQuoteAmount = Math.trunc(inQuoteAmount * 11 / 10); // TO DO - Calculate with slippage
    return {
        inAmount: inQuoteAmount,
        maxAmount: maxQuoteAmount
    }
}

export const getOutputAmountOnSell = (mainStateInfo, poolStateInfo, sellBalance) => {
    const outQuoteAmount = calcOutputAmountOnSell(
        {
            tradingFee: mainStateInfo.tradingFee / FEE_PRE_DIV,
            virtBaseReserves: Number(poolStateInfo.virtBaseReserves),
            virtQuoteReserves: Number(poolStateInfo.virtQuoteReserves),
            realBaseReserves: Number(poolStateInfo.realBaseReserves),
            realQuoteReserves: Number(poolStateInfo.realQuoteReserves),
            realQuoteThreshold: Number(poolStateInfo.realQuoteThreshold)
        },
        Number(sellBalance)
    );
    const minQuoteAmount = Math.trunc(outQuoteAmount * 9 / 10); // TO DO - Calculate with slippage
    return {
        outAmount: outQuoteAmount,
        minAmount: minQuoteAmount
    }
}