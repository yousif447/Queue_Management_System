import Footer from "@/components/Footer";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "../components/Navbar";
import "./globals.css";
import Providers from "./providers";
import LayoutContent from "@/components/LayoutContent";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quick Queue",
  description: "Skip the Wait, Book Your Spot",
  icons: {
    icon: "/icon.png",
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <SubscriptionGuard>
                <LayoutContent>{children}</LayoutContent>
                </SubscriptionGuard>
            </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}


