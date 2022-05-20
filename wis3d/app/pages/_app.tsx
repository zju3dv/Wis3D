import { AppProps } from "next/app";
import Head from "next/head";
import { initializeIcons, ThemeProvider } from "@fluentui/react";

// const swrConfig: SWRConfiguration = {
//   revalidateOnMount: true,
//   fetcher: jsonFetcher
// };

initializeIcons();

function App(props: AppProps) {
  const { Component, pageProps } = props;
  return (
    <ThemeProvider>
        <Component {...pageProps} />
      <Head>
        <title>Wis3D</title>
      </Head>
    </ThemeProvider>
  );
}

export default App;