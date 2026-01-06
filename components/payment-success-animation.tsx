"use client";

import { motion } from "motion/react";
import { Check, Sparkles, PartyPopper, Rocket } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface PaymentSuccessAnimationProps {
  planName: string;
  onClose: () => void;
}

export function PaymentSuccessAnimation({
  planName,
  onClose,
}: PaymentSuccessAnimationProps) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#eab308"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#eab308"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[400px] max-w-[90vw] bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </motion.div>
      </div>
      <div className="absolute bottom-4 left-4">
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <PartyPopper className="w-6 h-6 text-pink-400" />
        </motion.div>
      </div>

      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="flex justify-center mb-6"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Check className="w-12 h-12 text-white stroke-[3]" />
            </motion.div>
          </motion.div>

          {/* Pulse rings */}
          <motion.div
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 rounded-full border-2 border-green-400"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.7 }}
            className="absolute inset-0 rounded-full border-2 border-green-400"
          />
        </div>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          Payment Successful! 🎉
        </h2>
        <p className="text-white/70 mb-4">
          You&apos;ve unlocked the{" "}
          <span className="font-semibold text-pink-300">{planName}</span> plan
        </p>

        {/* Plan features summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
            <Rocket className="w-4 h-4 text-pink-400" />
            <span>Your subscription is now active!</span>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={onClose}
          className="w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
        >
          Start Designing
        </motion.button>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + Math.random() * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
