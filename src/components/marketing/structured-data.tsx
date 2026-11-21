import { siteUrl } from "@/lib/site";

/**
 * Organization and SoftwareApplication structured data, as one JSON-LD script. Rendered once,
 * on the landing page; it describes the product, so it has no place on authenticated screens.
 */
export function StructuredData() {
  const base = siteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Clarix",
        url: base,
        logo: `${base}/brand/clarix-primary.svg`,
      },
      {
        "@type": "SoftwareApplication",
        name: "Clarix",
        url: base,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "150",
          priceCurrency: "NGN",
          description: "per active member per month after a 60-day free trial",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so no string in the data can close the script element early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
