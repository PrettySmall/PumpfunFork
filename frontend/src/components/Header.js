"use client";

import Image from "next/image";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Rajdhani } from "next/font/google";
import localFont from "next/font/local";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useRef, useState, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLogin } from "@/hooks/auth/useLogin";
import { format } from "date-fns";
import { useLogout } from "@/hooks/auth/useLogout";

import useIsMounted from "./useIsMounted";
import { DATATYPE_LASTTOKEN, DATATYPE_LASTTRADE } from "../engine/consts";
import DialogModal from "./dialogModal";

const EurostileMNFont = localFont({
  src: "../assets/font/eurostile-mn-extended-bold.ttf",
});

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["devanagari"],
});

export default function Header() {
  const wallet = useWallet();
  const { login } = useLogin();
  const { logout } = useLogout();

  const mounted = useIsMounted();

  const [ws, setWs] = useState(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const div1Ref = useRef(null);
  const div2Ref = useRef(null);
  const [lastTokenInfo, setLastTokenInfo] = useState(null);
  const [lastTradeInfo, setLastTradeInfo] = useState(null);
  const baseURL = `${process.env.NEXT_PUBLIC_SOCKET_URL}`;

  useEffect(() => {
    if (wallet.publicKey !== null && wallet.disconnecting === false)
      login(wallet.publicKey.toBase58());
    if (wallet.disconnecting === true) logout();
  }, [wallet]);

  useEffect(() => {
    const websocket = new WebSocket(baseURL);
    setWs(websocket);
    websocket.onopen = () => {
      // console.log("websocket opened!");
    };

    websocket.onmessage = (event) => {
      // console.log("websocket onmessage!");
      const data = JSON.parse(atob(event.data)).message;

      if (data.type === DATATYPE_LASTTOKEN) setLastTokenInfo(data.data);
      else if (data.type === DATATYPE_LASTTRADE) {
        setLastTradeInfo(data.data);
        getCheckoutStatus();
      }
    };
  }, []);

  const getCheckoutStatus = () => {
    if (div1Ref.current) {
      if (div1Ref.current.classList.contains("animate-shake") === true)
        div1Ref.current.classList.remove("animate-shake");
      else div1Ref.current.classList.add("animate-shake");

      if (div2Ref.current.classList.contains("animate-shake") === true)
        div2Ref.current.classList.remove("animate-shake");
      else div2Ref.current.classList.add("animate-shake");
    }
  };

  return (
    <header className="z-20 flex flex-col gap-2 justify-between items-center p-2">
      <div className="flex justify-between items-center w-full h-[50px]">
        <div className="flex gap-2 items-center">
          <Link href="/">
            <Image
              className="h-[50px] w-[50px]"
              src="/logo.png"
              width={50}
              height={50}
              alt=""
              priority={true}
            />
          </Link>
          <div className="grid grid-cols-2">
            <a
              href="https://x.com/ohiodotfun" 
              target="_new"
              className="w-fit text-white text-sm hover:unerline max-[600px]:text-xs max-[370px]:text-[10px]"
            >
              [twitter]
            </a>

            <a
              href="https://docs.ohio.fun"
              target="_new"
              className="w-fit text-white text-sm hover:unerline max-[600px]:text-xs max-[370px]:text-[10px]"
            >
              [support]
            </a>

            <a
              href="https://t.me/ohiodotfun"
              target="_new"
              className="w-fit text-white text-sm hover:unerline max-[600px]:text-xs max-[370px]:text-[10px]"
            >
              [telegram]
            </a>

            <div className="w-fit text-white text-sm hover:unerline cursor-pointer max-[600px]:text-xs max-[370px]:text-[10px]"
              onClick={() => setIsDialogOpen(true)}>
              [how it works]
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {lastTradeInfo !== null && (
              <div
                ref={div1Ref}
                className="hidden md:flex gap-1 p-4 items-center bg-[#e664ac] rounded-md h-[40px]"
              >
                <Link
                  href={`/profile/${lastTradeInfo.walletAddr}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Image
                    className="rounded-full"
                    src={
                      lastTradeInfo.avatar === null
                        ? "/default_avatar.svg"
                        : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${lastTradeInfo.avatar}`
                    }
                    width={24}
                    height={24}
                    alt=""
                  />
                  <p className='text-sm'>
                    {lastTradeInfo.username}
                  </p>
                </Link>

                <p className='text-sm'>
                  {lastTradeInfo.isBuy === true ? "bought" : "sold"}{" "}
                  {lastTradeInfo.quoteAmount} SOL of
                </p>
                <Link
                  href={`/token/${lastTradeInfo.mintAddr}`}
                  className="flex items-center gap-1"
                >
                  <p
                    className='text-sm hover:underline'
                  >
                    {lastTradeInfo.tokenName}
                  </p>
                  {lastTradeInfo.logo !== null && (
                    <Image
                      className="rounded-full"
                      src={lastTradeInfo.logo}
                      width={24}
                      height={24}
                      alt=""
                    />
                  )}
                </Link>
              </div>
            )}
            {lastTokenInfo !== null && (
              <div className="hidden 2lg:flex gap-1 p-4 items-center bg-[#FFCC48] rounded-md h-[40px] text-black">
                <Link
                  href={`/profile/${lastTokenInfo.walletAddr}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Image
                    className="rounded-full"
                    src={
                      lastTokenInfo.avatar === null
                        ? "/default_avatar.svg"
                        : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${lastTokenInfo.avatar}`
                    }
                    width={24}
                    height={24}
                    alt=""
                  />
                  <p className='text-sm'>
                    {lastTokenInfo.username}
                  </p>
                </Link>
                <p className='text-sm'>
                  created
                </p>
                <Link
                  href={`/token/${lastTokenInfo.mintAddr}`}
                  className="flex items-center gap-1"
                >
                  <p
                    className='text-sm hover:underline'
                  >
                    {lastTokenInfo.token}
                  </p>
                  {lastTokenInfo.logo !== null && (
                    <Image
                      className="rounded-full"
                      src={lastTokenInfo.logo}
                      width={24}
                      height={24}
                      alt=""
                    />
                  )}
                </Link>
                <p className='text-sm'>
                  on{" "}
                  {format(new Date(lastTokenInfo.cdate || null), "MM/dd/yyyy")}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end w-[123px] sm:w-[192px]">
          {mounted && <WalletMultiButton />}
          {wallet.publicKey !== null && (
            <Link href={`/profile/${wallet.publicKey.toBase58()}`}>
              <img src="/default_avatar.svg" className="size-12 fill-white rounded-full"/> 
            </Link>
          )}
        </div>
      </div>
      {lastTradeInfo !== null && (
        <div
          ref={div2Ref}
          className="flex md:hidden gap-1 p-4 items-center bg-[#e664ac] rounded-md h-[40px] mb-6"
        >
          <Link
            href={`/profile/${lastTradeInfo.walletAddr}`}
            className="flex items-center gap-1 hover:underline"
          >
            <Image
              className="rounded-full"
              src={
                lastTradeInfo.avatar === null
                  ? "/default_avatar.svg"
                  : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${lastTradeInfo.avatar}`
              }
              width={24}
              height={24}
              alt=""
            />
            <p className='text-sm'>
              {lastTradeInfo.username}
            </p>
          </Link>
          <p className='text-sm'>
            {lastTradeInfo.isBuy === true ? "bought" : "sold"}{" "}
            {lastTradeInfo.quoteAmount} SOL of
          </p>
          <Link
            href={`/token/${lastTradeInfo.mintAddr}`}
            className="flex items-center gap-1"
          >
            <p
              className='text-sm hover:underline'
            >
              {lastTradeInfo.tokenName}
            </p>
            {lastTradeInfo.logo !== null && (
              <Image
                className="rounded-full"
                src={lastTradeInfo.logo}
                width={24}
                height={24}
                alt=""
              />
            )}
          </Link>
        </div>
      )}
      <DialogModal 
        isDialogOpen={isDialogOpen} 
        setIsDialogOpen={setIsDialogOpen}
      />
    </header>
  );
}