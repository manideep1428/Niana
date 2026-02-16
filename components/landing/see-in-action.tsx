"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

export function SeeInAction() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
          >
            See in Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Watch how Niana transforms your ideas into reality in seconds. See
            the future of design.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-sm aspect-video group cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {/* Video Placeholder or Frame */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-zinc-900 to-zinc-800">
            {!isPlaying ? (
              <>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-50 transition-opacity group-hover:opacity-40" />
                <div className="relative z-10 size-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform group-hover:scale-110 shadow-lg">
                  <Play className="size-8 text-white fill-white ml-1" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8">
                  <div className="glass px-4 py-2 rounded-lg inline-block">
                    <span className="text-white font-medium text-sm md:text-base">
                      Demo Preview
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                {/* In a real app, this would be an iframe or video tag */}
                <p className="text-xl font-medium">Video Player Placeholder</p>
              </div>
            )}
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-20 -right-20 size-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 size-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
