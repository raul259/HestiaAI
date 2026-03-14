import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Hestia-AI — Asistente inteligente para alojamientos",
  description:
    "Resolución instantánea de dudas e incidencias para huéspedes de alquiler vacacional, disponible 24/7 gracias a inteligencia artificial.",
  keywords: ["Hestia AI", "alquiler vacacional", "asistente AI", "huéspedes", "Airbnb", "inteligencia artificial"],
  openGraph: {
    title: "Hestia-AI — Asistente inteligente para alojamientos",
    description:
      "Tu conserje virtual disponible 24/7 para resolver cualquier duda en tu alojamiento vacacional.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
