import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "@/components/Header";
import Script from "next/script";
import WalletContextProvider from "@/contexts/WalletContext";
import ContractContextProvider from "@/contexts/ContractContext";

export default function App({ Component, pageProps }) {
  // return <Component {...pageProps} />;
  return (
    <>
      <WalletContextProvider>
        <ContractContextProvider>
          <div className="w-full min-h-screen flex flex-col overflow-hidden">
            <Header />
            <div className="relative">
              <Component {...pageProps} />
            </div>
          </div>
        </ContractContextProvider>
      </WalletContextProvider>
      <ToastContainer
        autoClose={5000}
        hideProgressBar
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
      />
    </>
  );
}
