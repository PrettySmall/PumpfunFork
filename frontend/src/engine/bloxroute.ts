import { createTraderAPIMemoInstruction, HttpProvider, MAINNET_API_GRPC_PORT, MAINNET_API_NY_GRPC, PostSubmitRequestEntry } from "@bloxroute/solana-trader-client-ts"
import { WalletContextState } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js"
import { AxiosRequestConfig } from "axios";

const TRADER_API_TIP_WALLET = "HWEoBxYs7ssKuudEjzjmpfJVX7Dvi7wescFsVx2L5yoY"

const requestConfig: AxiosRequestConfig = {
  timeout: 30_000,
}

const provider = new HttpProvider(
  process.env.NEXT_PUBLIC_BX_AUTH_HEADER,
  process.env.NEXT_PUBLIC_BX_PRIV_KEY
)

// createTraderAPIMemoInstruction generates a transaction instruction that places a memo in the transaction log
// Having a memo instruction with signals Trader-API usage is required
export function CreateTraderAPITipInstruction(
  senderAddress: PublicKey,
  tipAmount: number
): TransactionInstruction {
  const tipAddress = new PublicKey(TRADER_API_TIP_WALLET)

  return SystemProgram.transfer({
    fromPubkey: senderAddress,
    toPubkey: tipAddress,
    lamports: tipAmount,
  })
}

export async function buildBundlesOnBX(
  tx: Transaction,
  // signer: Keypair,
  signer: WalletContextState,
  tip: number,
  skipPreFlight: boolean = true) {
  const entries: PostSubmitRequestEntry[] = [];

  const blrxTipInstr = CreateTraderAPITipInstruction(signer.publicKey, tip * LAMPORTS_PER_SOL)
  
  const memo = createTraderAPIMemoInstruction("")
  const swapInstructions = tx.instructions
  const blxrTipInstructions = [blrxTipInstr, memo]

  // code for solving CORS error: (request header for "x-sdk" is blocked by CORS policy)
  provider.requestConfig.headers = {
    Authorization: provider.requestConfig.headers.Authorization
  }

  const latestBlockhash = await provider.getRecentBlockHash({})

  const swapMessage = new Transaction({
    recentBlockhash: latestBlockhash.blockHash,
    feePayer: signer.publicKey,
  })
  .add (...swapInstructions)
  .add (...blxrTipInstructions)
  
  const signedTrx = await signer.signTransaction(swapMessage);
  // swapMessage.sign(signer)
  // let buff = Buffer.from(swapMessage.serialize())
  let buff = Buffer.from(signedTrx.serialize())
  let encodedTxn = buff.toString("base64");

  const response = await provider.postSubmit({
    transaction: {
      content: encodedTxn,
      isCleanup: false
    },
    skipPreFlight: false
  })
  
  console.log(`Bloxroute Transaction hash : ${response.signature}`);

  return response.signature
}