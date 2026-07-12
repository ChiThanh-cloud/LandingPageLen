import Script from "next/script";

const clarityId = "wqieag9yv3";
const gaMeasurementId = "G-C27736KHYT";

export function SiteTracking() {
  return (
    <>
      <Script
        id="google-analytics-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}');
        `}
      </Script>
      <Script id="microsoft-clarity-init" strategy="afterInteractive">
        {`
          window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments)};
        `}
      </Script>
      <Script id="microsoft-clarity" src={`https://www.clarity.ms/tag/${clarityId}`} strategy="lazyOnload" />
    </>
  );
}
