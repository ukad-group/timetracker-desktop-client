import React from "react";
import type { AppProps } from "next/app";
import "@/styles/global.css";
import "@/components/Calendar/Calendar.css";
import "@/shared/Tooltip/Tooltip.css";
import dynamic from "next/dynamic";
import Head from "next/head";

function App({ Component, pageProps }: AppProps) {
  const AnyComponent = Component as any; // need review this

  return (
    <>
      <Head>
        <title>UKAD Timetracker</title>
      </Head>
      <AnyComponent {...pageProps} />
    </>
  );
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});
