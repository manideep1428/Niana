"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { X } from "lucide-react";

interface RepublicDayBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export function RepublicDayBanner({
  onVisibilityChange,
}: RepublicDayBannerProps) {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed
    const bannerDismissed = localStorage.getItem("republicBannerDismissed");
    if (bannerDismissed) {
      setShowBanner(false);
      onVisibilityChange?.(false);
    }
  }, [onVisibilityChange]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("republicBannerDismissed", "true");
    onVisibilityChange?.(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-100 bg-linear-to-r from-orange-500 via-white to-green-500 text-center py-2.5 px-4"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 flex-wrap relative pr-8">
            <span className="text-xl">🇮🇳</span>
            <span className="font-bold text-gray-900 text-sm">
              🎉 Republic Day Offer!
            </span>
            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              7 DAYS UNLIMITED FREE
            </span>
            <Link
              href="/pricing"
              className="text-gray-800 text-xs font-medium underline underline-offset-2 hover:text-gray-900 transition-colors"
            >
              View Pricing →
            </Link>
            <button
              onClick={dismissBanner}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Close banner"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to get banner visibility state
export function useRepublicDayBanner() {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem("republicBannerDismissed");
    if (bannerDismissed) {
      setShowBanner(false);
    }
  }, []);

  return {
    showBanner,
    bannerHeight: showBanner ? "42px" : "0",
    contentPadding: showBanner ? "calc(42px + 80px)" : "80px",
  };
}
