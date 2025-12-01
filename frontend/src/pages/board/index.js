"use client";

import { Rajdhani } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import clsx from "clsx";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
  Dialog,
  DialogPanel,
  TransitionChild
} from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { getFollowings, setFollow, setUnFollow } from "@/api/user";
import { useWallet } from "@solana/wallet-adapter-react";
import { findTokens, getKing } from "@/api/token";
import { getUserId } from "@/utils";

const EurostileMNFont = localFont({
  src: "../../assets/font/eurostile-mn-extended-bold.ttf",
});

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["devanagari"],
});

const sortType = [
  { id: 1, name: "Sort: bump order" },
  { id: 2, name: "Sort: last reply" },
  { id: 3, name: "Sort: reply count" },
  { id: 4, name: "Sort: market cap" },
  { id: 5, name: "Sort: creation time" },
];

const orderType = [
  { id: 1, name: "Order: Descending" },
  { id: 2, name: "Order: Ascending" },
];

export default function BoardPage() {
  const wallet = useWallet();

  const tokenDiv = useRef(null);
  const [currentTab, setCurrentTab] = useState("Terminal");
  const searchTokenName = useRef("");
  const [sortSelected, setSortSelected] = useState(sortType[0]);
  const [orderSelected, setOrderSelected] = useState(orderType[0]);
  const [showAnimations, setShowAnimations] = useState(false);
  const showAnimationsRef = useRef(showAnimations);
  const [includeNSFW, setIncludeNSFW] = useState(true);
  const [followingList, setFollowingList] = useState(null);
  const [tokenList, setTokenList] = useState(null);
  const [kingToken, setKingToken] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    getTokenList(
      searchTokenName.current.value,
      sortSelected.name,
      orderSelected.name,
      includeNSFW
    );
    getKingToken();

    const interval = setInterval(() => {
      if (tokenDiv.current && showAnimationsRef.current === true) {
        if (tokenDiv.current.classList.contains("animate-shake") === true)
          tokenDiv.current.classList.remove("animate-shake");
        else tokenDiv.current.classList.add("animate-shake");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    showAnimationsRef.current = showAnimations;
  }, [showAnimations]);

  useEffect(() => {
    getFollowingData();
  }, []);

  const getKingToken = async () => {
    const result = await getKing();
    // console.log(result)
    setKingToken(result);
  };

  const getTokenList = async (tokenName, sort, order, nsfw) => {
    const result = await findTokens(
      tokenName,
      sort,
      order,
      nsfw === true ? 1 : 0
    );
    // console.log(result)
    setTokenList(result);
  };

  const getFollowingData = async () => {
    const userId = getUserId();
    const result = await getFollowings(userId);
    setFollowingList(result);
  };

  const handleFollow = async (_id) => {
    await setFollow(_id);
    getFollowingData();
  };

  const handleUnFollow = async (_id) => {
    await setUnFollow(_id);
    getFollowingData();
  };

  return (
    <section
      className={`z-10 flex flex-col pt-10 sm:pt-[20px] justify-center p-1 pb-20 ${rajdhani.className}`}
    >
      <div className="z-[9] flex flex-col gap-8">
        {kingToken !== null && (
          <Link
            href={`/token/${kingToken?.mintAddr}`}
            className="flex flex-col gap-4 w-fit mx-auto border hover:border-white border-transparent p-2"
          >
            <div className="flex flex-col gap-4 bg-white w-full sm:w-[483px] mx-auto p-2">
              <div
                className="font-normal text-xl tracking-[8px] text-white bg-black text-center uppercase"
              >
                Only in Ohio
              </div>
              <div className="flex gap-[22px] items-center text-black">
                <Image src={kingToken?.logo} className="rounded-md" width={100} height={100} alt="" />
                <div className="flex flex-col gap-2">
                  <p className={`text-xl font-bold`}>
                    {kingToken?.name} [ticker: {kingToken?.ticker}]
                  </p>
                  <div className="flex flex-col">
                    <p className={`text-base`}>
                      Created by: {kingToken?.username}
                    </p>
                    <p className={`text-base`}>
                      Market cap: {kingToken?.marketCap.toFixed(2)}k
                    </p>
                    <p className={`text-base`}>Replies: {kingToken?.replies}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}
        {/* <div className="flex justify-center font-sans text-white gap-2 items-center text-sm">
          <Link href="/" className="cursor-pointer border p-1 rounded hover:border-white hover:opacity-100 border-green-300 opacity-100">
            <Image src="/solana.png" width={100} height={20} className="h-4" alt="solana" />
          </Link>
          <Link href="https://base.chain.fun" className="cursor-pointer border p-1 rounded hover:border-white hover:opacity-100 border-transparent opacity-50">
            <Image src="/base.png" width={80} height={20} className="h-4" alt="base" />
          </Link>
          <Link href="https://eth.chain.fun" className="cursor-pointer border p-1 rounded hover:border-white hover:opacity-100 border-transparent opacity-50">
            <Image src="/ethereum.png" width={80} height={20} className="h-4" alt="eth" />
          </Link>
          <Link href="https://bsc.chain.fun" className="cursor-pointer border p-1 rounded hover:border-white hover:opacity-100 border-transparent opacity-50">
            <Image src="/bsc.png" width={80} height={20} className="h-4" alt="bsc" />
          </Link>
          <Link href="https://ton.chain.fun" className="cursor-pointer border p-1 rounded hover:border-white hover:opacity-100 border-transparent opacity-50">
            <Image src="/ton.png" width={80} height={20} className="h-4" alt="ton" />
          </Link>
        </div> */}
        <div className="w-full flex justify-center font-sans headOhio">
          <Link href="/create" className="w-fit text-center px-4 py-2 text-3xl font-semibold">
            [start a new &nbsp;
            <span className="text-[#fefa8f] underline">coin]</span>
          </Link>
        </div>
      </div>
      <div className="z-10 flex flex-col gap-12">
        <div className="flex justify-center items-center gap-2 mt-8">
          <input
            ref={searchTokenName}
            type="text"
            className="border-primary border-2 text-primary p-2 w-full max-w-[400px] bg-transparent rounded placeholder-primary font-sans"
            placeholder="Search..."
            onKeyDown={(e) => {
              if (e.key === "Enter")
                getTokenList(
                  searchTokenName.current.value,
                  sortSelected.name,
                  orderSelected.name,
                  includeNSFW
                );
            }}
          />
          <button
            className="px-4 py-2 text-black rounded bg-gray-300 hover:bg-gray-400 transition duration-300 font-sans"
            onClick={() =>
              getTokenList(
                searchTokenName.current.value,
                sortSelected.name,
                orderSelected.name,
                includeNSFW
              )
            }
          >
            Search
          </button>

        </div>
        <div className="flex flex-col gap-6 mt-14 font-sans">
          <div className="flex gap-6">
            <div
              className={clsx(
                `text-xl cursor-pointer`,
                currentTab === "Following"
                  ? "font-bold text-primary underline underline-offset-8"
                  : "font-normal text-[#808080]"
              )}
              onClick={() => setCurrentTab("Following")}
            >
              Following
            </div>

            <div
              className={clsx(
                `text-xl cursor-pointer`,
                currentTab === "Terminal"
                  ? "font-bold text-primary underline underline-offset-8"
                  : "font-normal text-[#808080]"
              )}
              onClick={() => setCurrentTab("Terminal")}
            >
              Terminal
            </div>
          </div>
          {currentTab === "Following" ? (
            <div className="flex flex-col gap-6 ml-4">

              <p className={`text-xl text-white`}>
                Follow some of your friends to start curating your feed
              </p>
              {wallet.publicKey !== null && (
                <div className="flex gap-6">
                  <p className={`text-xl text-white`}>People you may know</p>
                  <button
                    type="button"
                    className={`text-xl text-[#808080]`}
                    onClick={getFollowingData}
                  >
                    [Refresh]
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {followingList !== null &&
                  followingList.map((item, index) => {
                    return (
                      <div key={index} className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <Image
                            className="rounded-full"
                            src={
                              item.avatar === null
                                ? "/default_avatar.svg"
                                : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                            }
                            width={24}
                            height={24}
                            alt=""
                          />
                          <p className={`text-xl text-white`}>
                            {item.username}
                          </p>
                        </div>
                        <p className={`text-xl text-[#808080]`}>
                          {item.numFollowers} Followers
                        </p>
                        {item.followed === true ? (
                          <button
                            type="button"
                            className="bg-white rounded-lg text-black w-[150px] h-[37px]"
                            onClick={() => handleUnFollow(item._id)}
                          >
                            UnFollow
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="bg-white rounded-lg text-black w-[150px] h-[37px]"
                            onClick={() => handleFollow(item._id)}
                          >
                            Follow
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 bg-[#0dc0c00c] font-sans rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 ml-4">
                <div className="sm:flex sm:gap-3">
                  <Listbox value={sortSelected} onChange={setSortSelected}>
                    <ListboxButton
                      className={clsx(
                        `group flex justify-between items-center w-[170px] bg-white rounded-md px-1 py-2 text-md text-black`,
                        `focus:outline-none data-[focus]:outline-none mb-2 mt-4`
                      )}
                    >
                      {sortSelected.name}
                      <svg
                        className="group-data-[open]:rotate-180 invert"
                        width="25"
                        height="25"
                        viewBox="0 0 25 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.5373 21.75C17.6459 21.75 21.7873 17.6086 21.7873 12.5C21.7873 7.39137 17.6459 3.25 12.5373 3.25C7.42866 3.25 3.28729 7.39137 3.28729 12.5C3.28729 17.6086 7.42866 21.75 12.5373 21.75Z"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14.9473 11.5L12.5373 13.5L10.1273 11.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </ListboxButton>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor="bottom"
                        className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none z-10"
                      >
                        {sortType.map((sort) => (
                          <ListboxOption
                            key={sort.name}
                            value={sort}
                            className="group flex cursor-default items-center gap-2 rounded-md py-1.5 px-2 select-none data-[focus]:bg-primary"
                            onClick={() =>
                              getTokenList(
                                searchTokenName.current.value,
                                sort.name,
                                orderSelected.name,
                                includeNSFW
                              )
                            }
                          >
                            <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                            <div className={`text-sm text-black`}>
                              {sort.name}
                            </div>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </Listbox>
                  <Listbox value={orderSelected} onChange={setOrderSelected}>
                    <ListboxButton
                      className={clsx(
                        `group flex justify-between items-center w-[170px] bg-white rounded-md px-2 py-2 text-sm text-black`,
                        `focus:outline-none data-[focus]:outline-none mb-2 mt-4`
                      )}
                    >
                      {orderSelected.name}
                      <svg
                        className="group-data-[open]:rotate-180 invert"
                        width="25"
                        height="25"
                        viewBox="0 0 25 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.5373 21.75C17.6459 21.75 21.7873 17.6086 21.7873 12.5C21.7873 7.39137 17.6459 3.25 12.5373 3.25C7.42866 3.25 3.28729 7.39137 3.28729 12.5C3.28729 17.6086 7.42866 21.75 12.5373 21.75Z"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14.9473 11.5L12.5373 13.5L10.1273 11.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </ListboxButton>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor="bottom"
                        className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none z-10"
                      >
                        {orderType.map((order) => (
                          <ListboxOption
                            key={order.name}
                            value={order}
                            className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-2 select-none data-[focus]:bg-primary"
                            onClick={() =>
                              getTokenList(
                                searchTokenName.current.value,
                                sortSelected.name,
                                order.name,
                                includeNSFW
                              )
                            }
                          >
                            <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                            <div className={`text-sm text-black`}>
                              {order.name}
                            </div>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </Listbox>
                </div>
                <div className="flex sm:flex-col gap-4 sm:gap-1">
                  <div className="flex gap-1 sm:mt-2">
                    <p className={`text-sm text-white`}>Show animations:</p>
                    <div className="flex gap-1 items-center">
                      <button
                        type="button"
                        className={clsx(
                          "rounded-[4px] px-1 text-sm",
                          showAnimations === true
                            ? "bg-primary text-black"
                            : "bg-none text-white"
                        )}
                        onClick={() => setShowAnimations(true)}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        className={clsx(
                          "rounded-[4px] px-1 text-sm",
                          showAnimations === true
                            ? "bg-none text-white"
                            : "bg-primary text-black"
                        )}
                        onClick={() => setShowAnimations(false)}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:mt-2">
                    <p className={`text-sm text-white`}>Include nsfw:</p>
                    <div className="flex gap-1 items-center">
                      <button
                        type="button"
                        className={clsx(
                          "rounded-[4px] px-1 text-sm",
                          includeNSFW === true
                            ? "bg-primary text-black"
                            : "bg-none text-white"
                        )}
                        onClick={() => {
                          setIncludeNSFW(true);
                          getTokenList(
                            searchTokenName.current.value,
                            sortSelected.name,
                            orderSelected.name,
                            true
                          );
                        }}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        className={clsx(
                          "rounded-[4px] px-1 text-sm",
                          includeNSFW === true
                            ? "bg-none text-white"
                            : "bg-primary text-black"
                        )}
                        onClick={() => {
                          setIncludeNSFW(false);
                          getTokenList(
                            searchTokenName.current.value,
                            sortSelected.name,
                            orderSelected.name,
                            false
                          );
                        }}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6 ml-4 mr-4 mb-4">
                {tokenList !== null &&
                  tokenList.map((item, index) => {
                    return (
                      <Link
                        key={index}
                        ref={index === 0 ? tokenDiv : null}
                        href={`/token/${item.mintAddr}`}
                        className="rounded-sm shadow-gray-900 shadow-lg flex gap-2 items-start border-primary border-2 hover:bg-third transition duration-500 ease-in-out"
                      >
                        <Image
                          src={item.logo}
                          className="rounded-md my-2 mx-2"
                          width={128}
                          height={128}
                          alt=""
                        />
                        <div className="flex flex-col">
                          <div className="flex gap-2 items-center pt-3">
                            <p className={`text-sm text-primary font-semibold`}>
                              Created by
                            </p>
                            <Link
                              href={`/profile/${item.walletAddr}`}
                              className={`text-sm text-primary font-semibold hover:underline`}
                            >
                              {item.username}
                            </Link>
                            {/* <Image
                              src={
                                item.avatar === null
                                  ? "/default_avatar.svg"
                                  : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                              }
                              width={24}
                              height={24}
                              alt=""
                            /> */}
                          </div>
                          <p className={`text-sm text-secondary font-bold`}>
                            market cap: {item.marketCap.toFixed(2)}K
                          </p>
                          <p className={`text-sm text-white font-bold`}>
                            replies: {item.replies}
                          </p>
                          <p className={`text-base text-white font-bold break-all`}>
                            {item.name}:
                            <span className="text-secondary">{`(ticker: ${item.ticker}) `}</span>
                            <span className="text-sm">{item.desc}</span>
                          </p>
                        </div>
                        <div className="wrap min-w-[30px] ml-auto h-full text-white">
                          <Image
                            src={
                              item.avatar === null
                                ? "/img7.png"
                                : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                            }
                            width={24}
                            height={24}
                            alt=""
                            className="w-[24px] h-[24px] mt-2"
                          />
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        <CreateComingSoonDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen}/>
      </div>
    </section>
  );
}


function CreateComingSoonDialog({ isDialogOpen, setIsDialogOpen }) {
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
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-3xl bg-[#030303] border border-white backdrop-blur-2xl">
                <div className='flex flex-col gap-3 items-center justify-between'>
                  <Image src="/tron.png" className="h-1/2 w-1/2"/>
                  <p className="text-xl text-white">Coming Soon!!!</p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}