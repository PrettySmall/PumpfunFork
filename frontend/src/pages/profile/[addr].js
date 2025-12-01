"use client";

import Image from "next/image";
import { Rajdhani } from "next/font/google";
import localFont from "next/font/local";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useEffect } from "react";
import clsx from "clsx";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useRouter } from "next/router";
import Link from "next/link";

import { useContract } from "@/contexts/ContractContext";
import { getProfileInfo, updateProfile } from "@/api/user";
import { FEE_PRE_DIV } from "@/contexts/contracts/constants";
import { getUserId } from "@/utils";
import { format } from "date-fns";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["devanagari"],
});

const EurostileMNFont = localFont({
  src: "../../assets/font/eurostile-mn-extended-bold.ttf",
});

export default function MyProfile() {
  const { query } = useRouter();
  const { addr } = query;
  const wallet = useWallet();
  const {
    getOwnerAddress,
    isContractInitialized,
    initializeContract,
    getMainStateInfo,
    updateMainStateInfo,
  } = useContract();

  const [contractOwnerAddress, setContractOwnerAddress] = useState(null);
  const [currentTab, setCurrentTab] = useState("Coins Held");
  const [walletAddress, setWalletAddress] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState(null);
  const [feeRecipient, setFeeRecipient] = useState(null);
  const [tradingFee, setTradingFee] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      if (!wallet.connected) return;

      const contractOwner = await getOwnerAddress();
      // console.log('contractOwner:', contractOwner.toBase58());
      setContractOwnerAddress(contractOwner?.toBase58());

      let id;
      try {
        const isInitialized = await isContractInitialized();
        if (!isInitialized) {
          id = toast.loading("Initializing program...");
          await initializeContract();
          toast.dismiss(id);
          toast.success("Initialized program");
        }
      } catch (err) {
        console.log("initializeProgram error:", err.message);
        toast.dismiss(id);
        toast.error("Failed to initialized program: " + err.message);
      }
    };

    initialize();
  }, [wallet]);

  useEffect(() => {
    const loadMainStateInfo = async () => {
      const mainStateInfo = await getMainStateInfo();
      // console.log('mainStateInfo:', mainStateInfo);
      if (mainStateInfo) {
        setOwnerAddress(mainStateInfo?.owner.toBase58());
        setFeeRecipient(mainStateInfo?.feeRecipient.toBase58());
        setTradingFee(Number(mainStateInfo?.tradingFee) / FEE_PRE_DIV);
      }
    };

    loadMainStateInfo();
  }, [wallet]);

  useEffect(() => {
    // console.log(addr)
    if (addr !== undefined) setProfileInfo();
    else setWalletAddress("");
  }, [addr, wallet]);

  const setProfileInfo = async () => {
    setWalletAddress(addr);
    let userId = null;
    if (addr === wallet?.publicKey?.toBase58()) userId = getUserId();
    const result = await getProfileInfo(addr, userId);
    // console.log(result)
    setProfileData(result);
  };

  const handleEditProfile = () => {
    if (addr === undefined) {
      toast.error("Please connect wallet!");
      return;
    }
    setIsDialogOpen(true);
  };

  const refreshProfileInfo = async () => {
    let userId = null;
    if (addr === wallet.publicKey.toBase58()) userId = getUserId();
    const result = await getProfileInfo(addr, userId);
    setProfileData(result);
  };

  const onChangeOwner = async (e) => {
    setOwnerAddress(e.target.value);
  };

  const onChangeFeeRecipient = async (e) => {
    setFeeRecipient(e.target.value);
  };

  const onChangeTradingFee = async (e) => {
    if (Number(e.target.value) < 0) return;
    setTradingFee(e.target.value);
  };

  const handleDashboardSet = async () => {
    if (
      feeRecipient === "" ||
      tradingFee === "" ||
      tradingFee === "0"
    ) {
      toast.warning("Invalid input values!");
      return;
    }

    const isInitialized = await isContractInitialized();
    if (!isInitialized) {
      toast.error("Contract not initialized yet!");
      return;
    }

    const id = toast.loading("Updaitng...");

    try {
      await updateMainStateInfo(feeRecipient, Number(tradingFee));
      toast.dismiss(id);
      toast.success("Updated successfully!");
    } catch (err) {
      console.error(err);
      toast.dismiss(id);
      toast.error(err.message);
    }
  };

  return (
    <section
      className="z-10 flex flex-col items-center pt-[60px] pb-20"
    >
      <div className="z-10 flex flex-col ml-auto mr-auto">
        <div className="flex flex-row gap-4">
          {profileData?.avatar === null && (
            <Image src="/logo.png" width={50} height={50} alt="" className="object-contain" />
          )}
          {profileData !== null && profileData?.avatar !== null && (
            <Image
              className="rounded-full object-contain"
              src={
                profileData?.avatar === null
                  ? "/default_avatar.svg"
                  : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${profileData?.avatar}`
              }
              width={50}
              height={50}
              alt=""
            />
          )}
          <div className="flex flex-col text-white text-sm sm:text-lg">
            @{profileData?.username}
            <div className="flex flex-col">
              {profileData?.followers} followers
              {wallet?.publicKey?.toBase58() === addr && (
                <button
                  type="button"
                  className="flex gap-[10px] items-center border border-white rounded-md w-fit px-[5px]"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                  <svg
                    width="14"
                    height="15"
                    viewBox="0 0 24 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.46001 21.74L21.25 6.95L17.55 3.25L2.75999 18.04L2.75 21.75L6.46001 21.74Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.3496 6.63L17.8696 9.14999"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <div className="sm:flex items-center gap-9">
                <div className="flex items-center gap-1">
                  <p className="text-[#fefa8f] text-sm">
                    Likes received: {profileData?.likes}
                  </p>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.25 8.71997C21.25 9.87997 20.81 11.05 19.92 11.94L18.44 13.42L12.07 19.79C12.04 19.82 12.03 19.83 12 19.85C11.97 19.83 11.96 19.82 11.93 19.79L4.08 11.94C3.19 11.05 2.75 9.88997 2.75 8.71997C2.75 7.54997 3.19 6.37998 4.08 5.48998C5.86 3.71998 8.74 3.71998 10.52 5.48998L11.99 6.96997L13.47 5.48998C15.25 3.71998 18.12 3.71998 19.9 5.48998C20.81 6.37998 21.25 7.53997 21.25 8.71997Z"
                      stroke="#FF3131"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-[#97FF73] text-sm ml-1">
                    Mentions received: {profileData?.mentions}
                  </p>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.2203 16.62C20.2203 17.47 19.5303 18.16 18.6803 18.16H5.32028C4.47028 18.16 3.78027 17.47 3.78027 16.62C3.78027 15.77 4.47028 15.08 5.32028 15.08H5.83026V9.94002C5.83026 6.54002 8.59027 3.77002 12.0003 3.77002C13.7003 3.77002 15.2403 4.46002 16.3603 5.58002C17.4803 6.69002 18.1703 8.23002 18.1703 9.94002V15.08H18.6803C19.5303 15.08 20.2203 15.77 20.2203 16.62Z"
                      stroke="#97FF73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3.78V2.75"
                      stroke="#97FF73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.0799 18.17C15.0799 19.88 13.6999 21.25 11.9999 21.25C10.2999 21.25 8.91992 19.87 8.91992 18.17H15.0799Z"
                      stroke="#97FF73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="z-10 flex flex-col px-2">
          <div
            className="text-xs sm:text-lg border border-slate-600 rounded p-2"
          >
            {walletAddress}
          </div>
          {addr !== undefined && (
            <a
              href={`https://solscan.io/account/${addr}`}
              target="_blank"
              className="text-sm text-white hover:underline !float-right !justify-self-end ml-auto"
            >
              View on solscan ↗
            </a>
          )}
        </div>
      </div>
      <div className="z-10 flex flex-col items-center gap-6 w-full mt-5">
        <div className="sm:flex gap-6">
          <div className="flex gap-6">
            <div
              className={clsx(
                "text-base cursor-pointer rounded px-1",
                currentTab === "Coins Held"
                  ? "bg-secondary text-black"
                  : "text-[#808080]"
              )}
              onClick={() => setCurrentTab("Coins Held")}
            >
              coins held
            </div>
            {addr === wallet?.publicKey?.toBase58() &&
              <>
                <div
                  className={clsx(
                    "text-base cursor-pointer rounded px-1",
                    currentTab === "Replies"
                      ? "bg-secondary text-black"
                      : "text-[#808080]"
                  )}
                  onClick={() => setCurrentTab("Replies")}
                >
                  replies
                </div>
                <div
                  className={clsx(
                    "text-base cursor-pointer rounded px-1",
                    currentTab === "Notifications"
                      ? "bg-secondary text-black"
                      : "text-[#808080]"
                  )}
                  onClick={() => setCurrentTab("Notifications")}
                >
                  notifications
                </div>
              </>}
          </div>
          <div className="flex gap-6">
            <div
              className={clsx(
                "text-base cursor-pointer rounded px-1",
                currentTab === "Coin Created"
                  ? "bg-secondary text-black"
                  : "text-[#808080]"
              )}
              onClick={() => setCurrentTab("Coin Created")}
            >
              coins created
            </div>
            <div
              className={clsx(
                "text-base cursor-pointer rounded px-1",
                currentTab === "Followers"
                  ? "bg-secondary text-black"
                  : "text-[#808080]"
              )}
              onClick={() => setCurrentTab("Followers")}
            >
              followers
            </div>
            <div
              className={clsx(
                "text-base cursor-pointer rounded px-1",
                currentTab === "Following"
                  ? "bg-secondary text-black"
                  : "text-[#808080]"
              )}
              onClick={() => setCurrentTab("Following")}
            >
              following
            </div>
          </div>
          {(wallet?.publicKey?.toBase58() == contractOwnerAddress ||
            contractOwnerAddress == null) &&
            addr === wallet?.publicKey?.toBase58() && (
              <div
                className={clsx(
                  "text-base cursor-pointer rounded px-1 w-fit",
                  currentTab === "Dashboard"
                    ? "bg-secondary text-black"
                    : "text-[#808080]"
                )}
                onClick={() => setCurrentTab("Dashboard")}
              >
                Dashboard
              </div>
            )}
        </div>
        {currentTab === "Coins Held" && (
          <div className="flex flex-col items-center gap-6 max-w-md w-full">
            {profileData?.coinsHeld.map((item, index) => {
              return (
                <div key={index} className="flex items-center gap-3 w-full">
                  <Image src={item.logo} width={50} height={50} alt="" />
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between">
                      <p className="text-xl text-white">
                        {item.balance.toFixed(0)} {item.ticker}
                      </p>
                      <div className="text-xl text-white cursor-pointer">
                        [Refresh]
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xl text-[#97FF73]">
                        {item.lamports.toFixed(3)} SOL
                      </p>
                      <Link
                        href={`/token/${item.mintAddr}`}
                        className="text-xl text-[#97FF73] cursor-pointer"
                      >
                        [View Coin]
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-6 justify-center">
              <button type="button" className="text-xl text-white">
                {"[<<]"}
              </button>
              <button type="button" className="text-xl text-white p-1">
                1
              </button>
              <button type="button" className="text-xl text-white">
                {"[>>]"}
              </button>
            </div>
          </div>
        )}
        {currentTab === "Coin Created" && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-md w-full">
            {profileData?.coinsCreated.map((item, index) => {
              return (
                <div key={index} className="flex items-center gap-3 w-full">
                  <Image src={item.logo} className="rounded-md" width={100} height={100} alt="" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <p className="text-xl text-white">Created by</p>
                      <Link
                        href={`/profile/${item.walletAddr}`}
                        className="flex items-center gap-1"
                      >
                        <Image
                          src={
                            item.avatar === null
                              ? "/default_avatar.svg"
                              : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                          }
                          width={16}
                          height={16}
                          alt=""
                        />
                        <p className="text-xl text-white">{item.username}</p>
                      </Link>
                    </div>
                    <p className="text-xl text-white">
                      market cap: {item.marketCap.toFixed(2)}K
                    </p>
                    <p className="text-xl text-white">
                      replies: {item.replies}
                    </p>
                    <p className="text-xl text-white break-all">{`${item.tokenName} (ticker: ${item.ticker}): ${item.desc}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {currentTab === "Replies" && (
          <div className="flex flex-col gap-6 max-w-lg w-full">
            {profileData?.replies.map((item, index) => {
              return (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <p className="text-md text-white">
                      {item.replierId.username}
                    </p>
                    <p className="text-md text-white">
                      {format(new Date(item.cdate), "MM/dd/yyyy, HH:mm:ss")}
                    </p>
                    <p className="text-md text-[#97FF73]">{`# ${item.replierId._id}`}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <p className="text-md text-[#97FF73]">{`# ${item._id}`}</p>
                    <p className="text-md text-white">{item.comment}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {currentTab === "Notifications" && (
          <div className="flex flex-col gap-6 max-w-md w-full">
            {profileData?.notifications.likes.map((item, index) => {
              if (item.length !== 0) {
                return (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="text-red-500 mt-1">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.25769 1.35248 6.86058 1.92336 7.50002 2.93545C8.13946 1.92336 8.74235 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-xl text-white">{`${item[0]} liked your comment`}</p>
                  </div>
                );
              }
            })}
            {profileData?.notifications.mentions.map((item, index) => {
              return (
                <div key={index} className="flex gap-2">
                  <div className="text-green-300 mt-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.5 3L2.5 3.00002C1.67157 3.00002 1 3.6716 1 4.50002V9.50003C1 10.3285 1.67157 11 2.5 11H7.50003C7.63264 11 7.75982 11.0527 7.85358 11.1465L10 13.2929V11.5C10 11.2239 10.2239 11 10.5 11H12.5C13.3284 11 14 10.3285 14 9.50003V4.5C14 3.67157 13.3284 3 12.5 3ZM2.49999 2.00002L12.5 2C13.8807 2 15 3.11929 15 4.5V9.50003C15 10.8807 13.8807 12 12.5 12H11V14.5C11 14.7022 10.8782 14.8845 10.6913 14.9619C10.5045 15.0393 10.2894 14.9965 10.1464 14.8536L7.29292 12H2.5C1.11929 12 0 10.8807 0 9.50003V4.50002C0 3.11931 1.11928 2.00003 2.49999 2.00002Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xl text-white">{`${item.username} mentioned you in a comment`}</p>
                    <p className="text-xl text-white">{`${item.comment}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {currentTab === "Followers" && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-md w-full">
            {profileData?.followersList.map((item, index) => {
              return (
                <div
                  key={index}
                  className="flex items-center justify-center gap-8 w-full"
                >
                  <Link
                    href={`/profile/${item.walletAddr}`}
                    className="flex items-center gap-1"
                  >
                    <Image
                      src={
                        item.avatar === null
                          ? "/default_avatar.svg"
                          : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                      }
                      width={16}
                      height={16}
                      alt=""
                    />
                    <p className="text-xl text-white">{item.username}</p>
                  </Link>
                  <p className="text-xl text-white">{`${item.followers} followers`}</p>
                </div>
              );
            })}
          </div>
        )}
        {currentTab === "Following" && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-sm w-full">
            {profileData?.followingsList.map((item, index) => {
              return (
                <div key={index} className="flex items-center gap-8">
                  <Link
                    href={`/profile/${item.walletAddr}`}
                    className="flex gap-2 items-center"
                  >
                    <Image
                      src={
                        item.avatar === null
                          ? "/default_avatar.svg"
                          : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                      }
                      width={16}
                      height={16}
                      alt=""
                    />
                    <p className="text-xl text-white">{item.username}</p>
                  </Link>
                  <p className="text-xl text-white">{`${item.followers} followers`}</p>
                </div>
              );
            })}
          </div>
        )}
        {currentTab === "Dashboard" &&
          (wallet?.publicKey?.toBase58() == contractOwnerAddress ||
            contractOwnerAddress == null) &&
          addr === wallet?.publicKey?.toBase58() && (
            <div className="flex flex-col gap-4 w-full max-w-xl p-4">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-2xl font-bold text-white">Fee Recipent</p>
                <input
                  value={feeRecipient}
                  onChange={onChangeFeeRecipient}
                  type="text"
                  className="border-primary border-2 text-white p-2 w-full bg-transparent rounded placeholder-primary font-sans"
                />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <p className="text-2xl font-bold text-white">Trading Fee (%)</p>
                <input
                  value={tradingFee}
                  onChange={onChangeTradingFee}
                  type="number"
                  className="border-primary border-2 text-white p-2 w-full bg-transparent rounded placeholder-primary font-sans"
                />
              </div>
              <button
                type="button"
                className="bg-primary rounded-md py-[12px] text-black text-xl font-bold"
                onClick={handleDashboardSet}
              >
                Set
              </button>
            </div>
          )}
      </div>
      <EditProfileDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        profileData={profileData}
        refreshProfileInfo={refreshProfileInfo}
      />
    </section>
  );
}

function EditProfileDialog({
  isDialogOpen,
  setIsDialogOpen,
  profileData,
  refreshProfileInfo,
}) {
  const [profileImage, setProfileImage] = useState(null);
  const [uploadProfileImage, setUploadProfileImage] = useState(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profileData !== null) {
      setUsername(profileData.username);
      setBio(profileData.bio);
    }
  }, [profileData]);

  const handleUpdateProfile = async () => {
    if (uploadProfileImage === null) {
      toast.error("Please change photo!");
      return;
    }
    if (username === "") {
      toast.error("Please input username!");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", uploadProfileImage);
    formData.append("username", username);
    formData.append("bio", bio);

    await updateProfile(formData);
    setIsDialogOpen(false);
    refreshProfileInfo();
  };

  return (
    <Transition appear show={isDialogOpen}>
      <Dialog
        as="div"
        className={`relative z-30 focus:outline-none ${rajdhani.className}`}
        onClose={() => setIsDialogOpen(false)}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-3xl bg-[#030303] border border-white backdrop-blur-2xl font-sans">
                <p className="text-[32px] bg-secondary text-black">Edit Profile</p>
                <div className="flex flex-col gap-6 justify-center items-center">
                  <p className="text-2xl text-white font-bold text-left w-full">
                    Profile photo
                  </p>
                  <div className="relative">
                    {profileData?.avatar !== null && profileImage === null && (
                      <Image
                        className="rounded-full"
                        src={
                          profileData?.avatar === null
                            ? "/default_avatar.svg"
                            : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${profileData?.avatar}`
                        }
                        width={100}
                        height={100}
                        alt=""
                      />
                    )}
                    {profileData?.avatar === null && profileImage === null && (
                      <Image
                        className="rounded-full"
                        src="/logo.png"
                        width={100}
                        height={100}
                        alt=""
                      />
                    )}
                    {profileImage !== null && (
                      <Image
                        className="rounded-full"
                        src={profileImage}
                        width={100}
                        height={100}
                        alt=""
                      />
                    )}
                    <label htmlFor="profileImage" className="">
                      <svg
                        className="absolute -right-4 bottom-0 cursor-pointer"
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="40" height="40" rx="20" fill="white" />
                        <path
                          d="M14.46 29.24L29.25 14.45L25.55 10.75L10.76 25.54L10.75 29.25L14.46 29.24Z"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M23.3496 14.13L25.8696 16.65"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <input
                        id="profileImage"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          let src = null;
                          if (e.target.files.length > 0) {
                            src = URL.createObjectURL(e.target.files[0]);
                            setProfileImage(src);
                            setUploadProfileImage(e.target.files[0]);
                          } else setProfileImage("");
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-2xl text-white font-bold">Username</p>
                  <input
                    type="text"
                    className="border-primary border-2 text-white p-2 w-full bg-transparent rounded font-sans"
                    placeholder="Your Name"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-2xl bg-secondary text-black">Bio</p>
                  <textarea
                    className="w-full h-[146px] rounded px-6 py-4 border border-primary text-white bg-transparent text-base resize-none"
                    placeholder="Bio"
                    onChange={(e) => setBio(e.target.value)}
                    value={bio}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-3 items-center">
                  <button
                    type="button"
                    className="w-full h-[50px] bg-primary rounded-md py-[12px] text-xl text-black font-bold"
                    onClick={handleUpdateProfile}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="rounded-xl w-full h-[50px] text-xl text-white hover:font-bold"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    [Close]
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}