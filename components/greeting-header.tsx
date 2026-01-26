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
    <span className="font-serif italic bg-clip-text text-transparent bg-linear-to-r from-[#FF9F68] to-[#FF7B54]">
      {text}
      <span className="text-foreground animate-pulse font-light ml-1 non-italic">
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
        "Burning the midnight oil?",
        "Late night inspiration",
        "Quiet time for building",
        "Good evening",
      ];
      setGreeting({
        text: lateNightGreetings[
          Math.floor(Math.random() * lateNightGreetings.length)
        ],
        icon: Moon,
      });
    } else {
      setGreeting({ text: "Early riser or late sleeper?", icon: Sparkles });
    }
  }, []);

  if (!mounted) return null;

  const Icon = greeting.icon;

  return (
    <div className="text-center space-y-2 mb-12">
      {/* Dynamic Greeting - Now the Main Hero Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-6xl sm:text-7xl md:text-8xl font-lobster-two tracking-tight text-foreground flex items-center justify-center gap-3"
      >
        <span>
          {greeting.text}
          {user?.firstName ? `, ${user.firstName}` : ""}
        </span>
      </motion.h1>

      {/* Subtitle - Was the main headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-2xl sm:text-3xl text-muted-foreground font-medium flex flex-col sm:flex-row items-center justify-center gap-2"
      >
        <span>Your personal</span>
        <Typewriter words={["mobile designer", "websites design"]} />
      </motion.div>
    </div>
  );
}
