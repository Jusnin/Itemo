import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITEMO!",
  description: "Know what you own, buy only what you need.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/icon-512.png",
    apple: "/brand/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ITEMO!" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#9a7cc5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
