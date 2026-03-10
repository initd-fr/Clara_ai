"use client";
import { Toaster } from "react-hot-toast";

export default function ToasterClient() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        zIndex: 9999999, // Z-index extrêmement élevé
      }}
      toastOptions={{
        style: {
          zIndex: 9999999, // Z-index extrêmement élevé
          position: "relative",
        },
      }}
    />
  );
}
