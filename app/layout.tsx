import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { TestSiteBanner } from "@/components/test-site-banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://duesko.vercel.app"),
  title: {
    default: "DuesKo",
    template: "%s · DuesKo",
  },
  description:
    "DuesKo makes it simple for HOAs and condos to collect monthly dues, track who paid, share reminders, and prepare collection reports. Join the waitlist.",
};

export const viewport: Viewport = {
  themeColor: "#0A5C5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TestSiteBanner />
        {children}
      </body>
    </html>
  );
}
