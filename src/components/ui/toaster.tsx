"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-background-primary)",
          color: "var(--color-text-primary)",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: 10,
          fontSize: 13,
          padding: "12px 16px",
        },
        success: {
          iconTheme: { primary: "#1D9E75", secondary: "white" },
        },
        error: {
          iconTheme: { primary: "#E24B4A", secondary: "white" },
        },
      }}
    />
  );
}
