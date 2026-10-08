"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("GrowNext PWA ServiceWorker active:", registration.scope);
          })
          .catch((error) => {
            console.warn("GrowNext PWA ServiceWorker registration error:", error);
          });
      });
    }
  }, []);

  return null;
}
