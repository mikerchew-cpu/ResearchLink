import type { Metadata } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResearchLink Malaysia",
  description:
    "Malaysia's verified student research exchange platform. Complete FYP surveys, earn rewards.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon-192.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-MY">
      <body>
        <SessionProvider>
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
