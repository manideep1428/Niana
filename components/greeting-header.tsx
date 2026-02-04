"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { motion } from "framer-motion";
import { Sparkles, Moon, Sun, Coffee, Sunset } from "lucide-react";

function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(100);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timer = setTimeout(() => {
      if (isDeleting) {
        setText(currentWord.substring(0, text.length - 1));
        setSpeed(50); // Faster delete
      } else {
        setText(currentWord.substring(0, text.length + 1));
        setSpeed(100 - Math.random() * 20); // Natural typing variation
      }
    }, speed);

    // Logic for pausing and switching phases
    if (!isDeleting && text === currentWord) {
      clearTimeout(timer);
      const pause = setTimeout(() => {
        setIsDeleting(true);
      }, 2000); // Pause at end of word
      return () => clearTimeout(pause);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      setSpeed(100);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, speed]);

  return (
    <span className="font-lobster-two italic bg-clip-text text-transparent bg-gradient-to-r from-primary via-[#FF7B54] to-purple-500 animate-gradient-x bg-[length:200%_auto]">
      {text}
      <span className="text-primary/70 animate-pulse font-light ml-0.5 non-italic">
        |
      </span>
    </span>
  );
}

export function GreetingHeader() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState({ text: "", icon: Sun });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();

    // Logic for greetings based on time
    if (hour >= 5 && hour < 12) {
      setGreeting({ text: "Good morning", icon: Coffee });
    } else if (hour >= 12 && hour < 17) {
      setGreeting({ text: "Good afternoon", icon: Sun });
    } else if (hour >= 17 && hour < 21) {
      setGreeting({ text: "Good evening", icon: Sunset });
    } else if (hour >= 21 || hour < 2) {
      const lateNightGreetings = [
        "Good evening", // Simplified for elegance
        "Late night inspiration",
      ];
      setGreeting({
        text: lateNightGreetings[
          Math.floor(Math.random() * lateNightGreetings.length)
        ],
        icon: Moon,
      });
    } else {
      setGreeting({ text: "Hello", icon: Sparkles });
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="text-center space-y-4 mb-4 relative z-10">
      {/* Dynamic Greeting - Main Title */}
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-lobster-two tracking-tight text-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 drop-shadow-sm">
            {greeting.text}
          </span>
          {user?.firstName && (
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-primary to-[#FF7B54]">
              , {user.firstName}
            </span>
          )}
        </h1>
      </motion.div>

      {/* Subtitle with Typewriter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="text-xl sm:text-2xl md:text-3xl text-muted-foreground/80 font-sans font-medium flex flex-col sm:flex-row items-center justify-center gap-2 max-w-2xl mx-auto"
      >
        <span>Your AI partner for</span>
        <Typewriter
          words={["mobile apps", "websites", "design systems", "interfaces"]}
        />
      </motion.div>
    </div>
  );
}
