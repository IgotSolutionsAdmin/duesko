import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { LANDING_SEO } from "@/lib/landing-copy";

export const metadata: Metadata = {
  title: { absolute: LANDING_SEO.title },
  description: LANDING_SEO.description,
  openGraph: {
    title: LANDING_SEO.title,
    description: LANDING_SEO.description,
    url: "/",
    siteName: "DuesKo",
    images: [{ url: "/logo.svg", alt: "DuesKo" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: LANDING_SEO.title,
    description: LANDING_SEO.description,
    images: ["/logo.svg"],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
