import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const manrope = localFont({ src: [{ path: "../../public/fonts/manrope-regular.ttf", weight: "400" }, { path: "../../public/fonts/manrope-semibold.ttf", weight: "600" }, { path: "../../public/fonts/manrope-bold.ttf", weight: "700" }], display: "swap", variable: "--font-manrope" });
export const metadata: Metadata = {
  title: "Nimbus — A little space for everything",
  description: "A thoughtfully simple cloud storage workspace. Your files, beautifully organized.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={manrope.variable}>{children}</body></html>;
}
