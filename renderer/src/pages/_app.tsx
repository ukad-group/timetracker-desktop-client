import type { AppProps } from "next/app";
import "@/styles/global.css";
import "@/components/Calendar/Calendar.css";
import "@/shared/Tooltip/Tooltip.css";
import dynamic from "next/dynamic";
import Head from "next/head";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>UKAD Timetracker</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});
