import type { Metadata } from "next";
import { DM_Sans, DM_Mono, DM_Serif_Text } from "next/font/google";
import clsx from "clsx";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

const dmSerif = DM_Serif_Text({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "Dev Pulse — Real-Time Engineering Dashboard",
  description:
    "Track GitHub PRs, Linear issues, meetings, and Slack in one real-time dashboard. Powered by One.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          dmSans.variable,
          dmMono.variable,
          dmSerif.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
