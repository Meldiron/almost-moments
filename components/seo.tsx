"use client";

const SITE_NAME = "Almost Moments";
const DEFAULT_DESCRIPTION =
  "Create shared photo galleries for your events. Guests scan a QR code, upload photos from their phones — no app needed. Free forever.";
const DEFAULT_OG_IMAGE = "/og.png";
const SITE_URL = "https://almostmoments.com";

type SEOProps = {
  title?: string;
  description?: string;
};

export function SEO({ title, description }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESCRIPTION;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={SITE_URL} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
    </>
  );
}
