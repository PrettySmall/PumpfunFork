"use client"

import { Rajdhani } from 'next/font/google'
import localFont from 'next/font/local'
import { Disclosure, DisclosureButton, DisclosurePanel, Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from "react-toastify"
import { useWallet } from '@solana/wallet-adapter-react'

import BN from 'bn.js';
import { VersionedTransaction, 
    TransactionMessage,
    Transaction, 
    LAMPORTS_PER_SOL
} from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import { useContract } from '../../contexts/ContractContext'
import { connection, 
  addLookupTableInfo, 
  isMainNet
} from '../../engine/config'
import { createToken } from '../../engine/createToken'
import { prioritizeIxs, send, sleep } from '../../engine/utils'
import { updateToken, trade, checkBadWord } from '@/api/token'
import Link from 'next/link'
import { TOKEN_DECIMALS } from "@/engine/consts";
import {
  getOutputAmountOnBuy,
  getInputAmountOnBuy
} from '../../contexts/PriceContext'
import { axiosPublic } from '@/api/axiosPublic'

const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['devanagari']
})

const EurostileMNFont = localFont({ src: '../../assets/font/eurostile-mn-extended-bold.ttf' })


export default function CreateCoin() {
  const { connected } = useWallet();

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const coinName = useRef(null)
  const ticker = useRef(null)
  const description = useRef(null)
  const [coinImage, setCoinImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imgBufer, setImageBuffer] = useState()
  const twitterLink = useRef(null)
  const telegramLink = useRef(null)
  const kickLink = useRef(null)
  const websiteLink = useRef(null)

  const handleCreateCoin = async () => {
    if (coinName.current?.value === '') {      
      toast.error('No name!')
      return
    }
    if (imageName === '') {
      toast.error('No image uploaded!')
      return
    }
    if (ticker.current?.value === '') {
      toast.error('No ticker!')
      return
    }
    if (!connected) {
      toast.error('No Wallet Connected!')
      return
    }
    const checkBadNameResult = await checkBadWord(coinName.current?.value)
    if(checkBadNameResult.result == true) {
      toast.error(checkBadNameResult.message)
      return
    }
    const checkBadDescResult = await checkBadWord(description.current?.value)
    if(checkBadDescResult.result == true) {
      toast.error(checkBadDescResult.message)
      return
    }

    setIsDialogOpen(true)
  };

  const handleFileRead = (event) => {
    const imageBuffer = event.target.result;
    console.log('imageBuffer:', imageBuffer);
    setImageBuffer(imageBuffer);
  };

  return (
    <section className='flex flex-col sm:max-w-[400px] w-full mx-auto pt-10 sm:pt-[80px] px-6 pb-20'>
      <div className='flex flex-col gap-4 z-10 font-sans'>
        <Link href='/'>
          <p className='flex justify-center text-3xl font-semibold'>[go back]</p>
        </Link>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-md font-bold text-primary'>Name</p>
          <input ref={coinName} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white"/>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-md font-bold text-primary'>Ticker</p>
          <input ref={ticker} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white"/>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-md font-bold text-primary'>Description</p>
          <textarea ref={description} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white"/>
        </div>
        <div className="flex flex-col w-full">
          <p className='text-md font-bold mb-2 text-primary'>Image</p>
          <div className='relative'>
            <label htmlFor="coinImage" className='absolute ml-2 inset-y-2'>
              {/* <div className="bg-white text-black rounded-sm text-md p-1 cursor-pointer">Choose File</div> */}
              <input id='coinImage' type='file' accept='image/*' onChange={(e) => {
                if (e.target.files.length > 0) {
                  if(e.target.files[0].size > 204800) { // limit size - 200kb
                    toast.error('Image size overflow!')
                    setImageName('')
                    setImageFile(null)
                    return
                  }
                  const src = URL.createObjectURL(e.target.files[0])
                  setCoinImage(src)
                  setImageName(e.target.files[0].name)
                  setImageFile(e.target.files[0])

                  let reader = new FileReader();
                  reader.onload = handleFileRead;
                  reader.readAsArrayBuffer(e.target.files[0]);
                }
                else {
                  setImageName('')
                  setImageFile(null)
                }
              }} />
            </label>            
            <input type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white" placeholder=''/>
          </div>
          <label className='text-sm mt-1'>max image size: 200kb</label>
        </div>
        <Disclosure as="div" defaultOpen={false}>
          <DisclosureButton className="group flex w-full items-center gap-2">
            <span className="text-base font-bold text-primary">
              Show more Options
            </span>
            <svg className='text-primary' stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
              <path d="m18.707 12.707-1.414-1.414L13 15.586V6h-2v9.586l-4.293-4.293-1.414 1.414L12 19.414z"></path>
            </svg>
          </DisclosureButton>
          <DisclosurePanel className="mt-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2 w-full">
              <p className='text-base font-bold text-primary'>Twitter Link</p>
              <input ref={twitterLink} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white" placeholder='(Optional)' />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className='text-base font-bold text-primary'>Telegram Link</p>
              <input ref={telegramLink} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white" placeholder='(Optional)' />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className='text-base font-bold text-primary'>Kick.com Link</p>
              <input ref={kickLink} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white" placeholder='(Optional)' />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className='text-base font-bold text-primary'>Website</p>
              <input ref={websiteLink} type="text" className="border-primary border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white" placeholder='(Optional)' />
            </div>
          </DisclosurePanel>
        </Disclosure>
        <button type="button" className="bg-primary rounded-md w-full h-10 text-base font-bold text-black" onClick={handleCreateCoin}>Create Coin</button>
        <p className="text-sm text-white font-bold">Cost to deploy: ~0.02 SOL</p>
        <CreateCoinDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen}
          name={coinName.current?.value}
          ticker={ticker.current?.value}
          description={description.current?.value}
          coinImage={coinImage}
          imgFile={imageFile}
          imgBuffer={imgBufer}
          twitterLink={twitterLink.current?.value}
          telegramLink={telegramLink.current?.value}
          kickLink={kickLink.current?.value}
          websiteLink={websiteLink.current?.value}
        />
      </div>
    </section>
  )
}

function CreateCoinDialog({ 
  isDialogOpen, setIsDialogOpen, 
  name, ticker, description, 
  coinImage, imgFile, imgBuffer, 
  twitterLink, telegramLink, kickLink, websiteLink 
}) {
  const walletCtx = useWallet();
  const { 
    isContractInitialized, 
    getMainStateInfo,
    getCreatePoolTx, 
    getBuyTx 
  } = useContract();

  const [mode, setMode] = useState('sol');
  const [fromAmount, setFromAmount] = useState(0);
  const [mainStateInfo, setMainStateInfo] = useState(null)
  const [expectAmount, setExpectAmount] = useState('')

  useEffect(() => {
    if (walletCtx.publicKey !== null) {
      const loadMainStateInfo = async() => {
        const info = await getMainStateInfo()
        setMainStateInfo(info)
      }
      loadMainStateInfo();      
    }
  }, [walletCtx])

  useEffect(() => {
    try {
      const valFromAmount = Number(fromAmount)
      if(valFromAmount == 0) {
        setExpectAmount('');
        return;
      }
      let tmpAmount = 0;      
      let tmpSymbol = 'SOL';
      if(mode == 'sol') {
        let quoteBalance = 0;
        if(valFromAmount < 1) {
          quoteBalance = new BN(Math.floor(valFromAmount * LAMPORTS_PER_SOL))
        }
        else {
          quoteBalance = new BN(valFromAmount).mul(new BN(LAMPORTS_PER_SOL))
        }
        const { outAmount, minAmount } = getOutputAmountOnBuy(mainStateInfo, null, quoteBalance);
        tmpAmount = (outAmount / (10 ** TOKEN_DECIMALS)).toFixed(0)
        tmpSymbol = ticker;
      }
      else {
        let baseBalance = 0
        if(valFromAmount < 1) {
          baseBalance = new BN(Math.floor(valFromAmount * (10 ** TOKEN_DECIMALS)));
        }
        else {
          baseBalance = new BN(valFromAmount).mul(new BN(10 ** TOKEN_DECIMALS))
        }
        const { inAmount, maxAmount } = getInputAmountOnBuy(mainStateInfo, null, baseBalance)
        tmpAmount = (inAmount / LAMPORTS_PER_SOL).toFixed(5);
        tmpSymbol = 'SOL'
      }

      setExpectAmount('You receive: ' + tmpAmount + ' ' + tmpSymbol)
    } catch (error) {
      console.error('CreateCoinDialog->fromAmount error:', error)
    }
  }, [fromAmount])

  const onChangeAmount = (e) => {
    if (Number(e.target.value) < 0) return;
    setFromAmount(e.target.value);
  }

  const handleCreateCoin = async () => {
    if (!walletCtx.connected) {      
      toast.error('No Wallet Connected!');
      return;
    }
    
    const id = toast.loading(`Creating '${name}' token...`);

    try {
      const isInitialized = await isContractInitialized();
      if (!isInitialized) {
        toast.error('Contract not initialized yet!');
        return;
      }

      let allIxs = [];

      const { mintKeypair, imageUrl, createIxs } = await createToken(
        walletCtx, 
        name, ticker, description, 
        imgBuffer, imgFile, 
        websiteLink, twitterLink, telegramLink, kickLink
      );
      allIxs = [...allIxs, ...createIxs];

      const createPoolIx = await getCreatePoolTx(mintKeypair.publicKey.toBase58(), NATIVE_MINT);
      allIxs.push(createPoolIx);

      if (Number(fromAmount) > 0) {
        const buyIx = await getBuyTx(mintKeypair.publicKey.toBase58(), Number(fromAmount), mode === 'sol', true);
        allIxs.push(buyIx);
      }

      // console.log('allIxs:', allIxs);

      let newIxs = [];

      if (isMainNet) {
        newIxs = await prioritizeIxs(connection, allIxs, walletCtx.publicKey);
      }

      const blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
      const message = new TransactionMessage({
        payerKey: walletCtx.publicKey, 
        instructions: (isMainNet) ? newIxs : allIxs, 
        recentBlockhash: blockhash, 
      }).compileToV0Message(Object.values({ ...(addLookupTableInfo ?? {}) }));
      const transaction = new VersionedTransaction(message);
      transaction.sign([mintKeypair]);

      const txHash = await send(connection, walletCtx, transaction);
      console.log('handleCreateCoin->txHash:', txHash);

      let toAmount = 0
      await connection.getTransaction(txHash, { maxSupportedTransactionVersion : 0 }).then((res) => {
        if (Number(fromAmount) > 0) {
          if (mode === 'sol') {
            toAmount = res.meta?.postTokenBalances[0].uiTokenAmount?.uiAmount;
          } else {
            toAmount = (res.meta?.preBalances[0] - res.meta?.postBalances[0] - 24_640_000) / LAMPORTS_PER_SOL;
          }
        }
      });

      await sleep(1000);

      const result = await updateToken(name, ticker, description, imageUrl, twitterLink, telegramLink, kickLink, websiteLink, mintKeypair.publicKey.toBase58());
      if (!result) {
        toast.dismiss(id);
        toast.error("Failed to update token info!");
        setIsDialogOpen(false);
        return;
      }

      const formData = new FormData()
      formData.append('mintAddr', mintKeypair.publicKey.toBase58())
      const deleteCAResult = await axiosPublic.post('/ca/delete_ca', formData)
      console.log('deleteCAResult->result:', deleteCAResult.data)

      if (Number(fromAmount) > 0) {
        await trade(mintKeypair.publicKey.toBase58(), 
          true,
          (mode === 'sol') ? Number(toAmount) : Number(fromAmount),
          (mode === 'sol') ? Number(fromAmount) : Number(toAmount),
          txHash,
          null
        );
      }

      const newTokenLink = `https://ohio.fun/token/${mintKeypair.publicKey.toBase58()}`
      toast.dismiss(id);
      // toast.success(`Created a new bonding curve with token '${name}'`);      
      toast.success(() => <div><a href={newTokenLink}>Created a new bonding curve with token {`'${name}'`} View</a></div>)

      setIsDialogOpen(false);
    } catch (err) {
      console.error('handleCreateCoin err:', err);
      toast.dismiss(id);
      toast.error(err.message);
    }
  }

  return (
    <Transition appear show={isDialogOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none ${rajdhani.className}`} onClose={() => setIsDialogOpen(false)}>
        <div className="fixed inset-0 z-10 w-screen font-sans overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-4 p-10 w-full max-w-xl rounded-3xl bg-[#030303] border border-white backdrop-blur-2xl">
                <p className='text-[32px] font-bold text-white'>Choose how many [{ticker}] you want to buy (Optional)</p>
                <p className='text-xl text-white'>Tip: Its optional but buying a small amount of coins helps protect your coin from snipers</p>
                <div className='flex flex-col gap-2 items-end'>
                  <button type='button' className='text-xl text-white font-bold cursor-pointer' onClick={() => {
                    if (mode === 'sol') {
                      setMode('coin')
                    }
                    else {
                      setMode('sol')
                    }
                    try {
                      const vals = expectAmount.split(" ")
                      if(vals.length > 3 && vals[2] != '') {
                        setFromAmount(vals[2])                        
                      }
                      else {
                        setFromAmount(0)                        
                      }
                    } catch (error) {
                      console.error(error)
                    }
                  }}>Switch to { mode === 'sol' ? ticker : 'SOL' }</button>
                  <div className='relative w-full'>
                    {mode === 'sol' ? (
                      <div className='absolute right-6 inset-y-4 flex gap-1 items-center'>
                        <p className="text-xl text-white">SOL</p>
                        <Image
                          src="/sol.png"
                          width={32}
                          height={32}
                          alt="sol"
                        />
                      </div>
                    ) : (
                      <div className='absolute right-6 inset-y-4 flex gap-1 items-center'>
                        <p className="text-xl text-white">{ticker}</p>
                        <Image
                          className='rounded-full'
                          src={coinImage}
                          width={32}
                          height={32}
                          alt="coin"
                        />
                      </div>
                    )}
                    <input value={fromAmount} onChange={onChangeAmount} 
                      type="number" 
                      className="border-primary border-2 text-white p-2 w-full max-w-[500px] bg-transparent rounded placeholder-white" 
                      placeholder='0.0 (optional)' 
                    />
                  </div>
                </div>                
                <p className='text-[#808080]'> {expectAmount} </p>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-primary rounded-xl w-full h-[50px] text-xl font-bold text-black' onClick={handleCreateCoin}>Create Coin</button>
                  <p className="text-xl text-white">Cost to deploy: ~0.02 SOL</p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}