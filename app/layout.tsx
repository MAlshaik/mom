import type { Metadata } from "next";
import { Noto_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers";
import { Footer } from "@/components/footer";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ختم المهدوي — Khatm Al-Mahdawi",
  description: "تطبيق إدارة ختمة القرآن الكريم — Quran Khatm Management",
  metadataBase: new URL("https://qura.vercel.app"),
  openGraph: {
    title: "ختم المهدوي — Khatm Al-Mahdawi",
    description: "تطبيق إدارة ختمة القرآن الكريم — Quran Khatm Management",
    siteName: "ختم المهدوي",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ختم المهدوي — Khatm Al-Mahdawi",
    description: "تطبيق إدارة ختمة القرآن الكريم",
  },
  appleWebApp: {
    capable: true,
    title: "ختم المهدوي",
    statusBarStyle: "black-translucent",
  },
  themeColor: "#1B3A6B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${notoSansArabic.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col antialiased">
        <ThemeProvider>
          <Providers>
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
