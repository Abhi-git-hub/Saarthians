// Structured data from published business facts only (see lib/site.ts).
// No ratings, review counts, prices, awards, or invented claims — every
// field mirrors visible page content.
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": "https://saarthians.online/#organization",
    name: "Saarthians — Saarthi Classes",
    url: "https://saarthians.online/",
    logo: "https://saarthians.online/icons/icon-512.png",
    image: "https://saarthians.online/og-cover.png",
    description:
      "Saarthians is the online home of Saarthi Classes in Shahdara, Delhi, offering Classes 9–12 coaching across school subjects, plus JEE and NEET preparation and a secure student workspace.",
    email: "hello@saarthians.online",
    telephone: "+91-93112-30129",
    address: {
      "@type": "PostalAddress",
      streetAddress: "267, Gali No. 16, Balbir Nagar Extension",
      addressLocality: "Shahdara, Delhi",
      postalCode: "110032",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 28.6874233,
      longitude: 77.2875733,
    },
    founder: {
      "@type": "Person",
      name: "Abhi Yadav",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://saarthians.online/#website",
    url: "https://saarthians.online/",
    name: "Saarthians",
    publisher: { "@id": "https://saarthians.online/#organization" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
