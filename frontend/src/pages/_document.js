import { Html, Head, Main, NextScript } from "next/document";
import Link from "next/link";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <Link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet"/>
        <Script src="/charting_library/charting_library.js" strategy="beforeInteractive"></Script>
      </Head>
      <body className="font-sans bg-black">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
