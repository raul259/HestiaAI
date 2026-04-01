"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";

interface Props {
  propertyId: string;
  propertyName: string;
}

export default function QRCodeCard({ propertyId, propertyName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!canvasRef.current) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const guestUrl = `${baseUrl}/guest/${propertyId}`;
    QRCode.toCanvas(canvasRef.current, guestUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#1B3022", light: "#FFFFFF" },
    });
    setUrl(guestUrl);
  }, [propertyId]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-${propertyName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <QrCode className="w-5 h-5 text-deep-forest" />
        <h2 className="font-outfit font-semibold text-lg text-deep-forest">
          Código QR
        </h2>
      </div>

      <p className="font-inter text-xs text-gray-400">
        Imprime este QR y colócalo en el alojamiento. Los huéspedes lo escanean
        para acceder al asistente.
      </p>

      <div className="flex justify-center">
        <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm inline-block">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {url && (
        <p className="text-xs text-center text-gray-400 font-inter break-all">
          {url}
        </p>
      )}

      <button
        onClick={handleDownload}
        className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
      >
        <Download className="w-4 h-4" />
        Descargar PNG
      </button>
    </div>
  );
}
