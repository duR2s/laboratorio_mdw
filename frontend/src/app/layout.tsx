import type { Metadata } from "next";
import { ReservasProvider } from "@/context/ReservasContext";
import NotificationDrawer from "@/components/NotificationDrawer";
import PixelSkyBackground from "@/components/PixelSkyBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabReserva // Sistema de Reservas y Laboratorios",
  description: "Sistema de reservas y control de concurrencia optimista para salas de estudio y laboratorios universitarios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-body text-base text-neo-dark antialiased selection:bg-neo-yellow selection:text-neo-dark relative min-h-screen bg-[#002F27]">
        <ReservasProvider>
          <PixelSkyBackground>
            {children}
          </PixelSkyBackground>
          <NotificationDrawer />
        </ReservasProvider>
      </body>
    </html>
  );
}
