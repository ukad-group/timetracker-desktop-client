import React from "react";
import type { AppProps } from "next/app";
import "../styles/global.css";
import dynamic from "next/dynamic";
import "../components/Calendar/Calendar.css";
import "../components/ui/Tooltip/Tooltip.css";

function App({ Component, pageProps }: AppProps) {
  // return <Component {...pageProps} />;
  const AnyComponent = Component as any; // need review this
  return <AnyComponent {...pageProps} />;
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});
