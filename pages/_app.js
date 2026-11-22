import CookieBanner from "@/components/Cookies/Cookies";
import FooterSection from "@/components/FooterSection/FooterSection";
import "@/styles/globals.scss";
import Head from "next/head";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const { pathname } = useRouter();
  const hideFooterPaths = ["/", "/terms-and-conditions"];
  const showFooter = !hideFooterPaths.includes(pathname);
  const hidecookiesPaths = ["/"];
  const showCookies = !hidecookiesPaths.includes(pathname);

  return (
    <>
      <Head>
        <title>Vacation rental hotline</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Poppins"
          rel="stylesheet"
        ></link>
        <link
          href="https://fonts.googleapis.com/css?family=Figtree"
          rel="stylesheet"
        ></link>
      </Head>

      <Component {...pageProps} />
      {!showCookies && <CookieBanner />}
      {!showFooter && <FooterSection />}
    </>
  );
}
