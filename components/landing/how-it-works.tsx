"use client";

import { motion } from "framer-motion";
import { Sparkles, Palette, Code2, Zap } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Describe your idea",
    description:
      "Tell Niana what you want to build. Be as specific or vague as you like—our AI understands context.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Palette,
    title: "Get instant designs",
    description:
      "Watch as high-fidelity UI designs are generated in real-time. Review multiple variations instantly.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Code2,
    title: "Refine & Export",
    description:
      "Tweak colors, layout, and copy with simple commands. Export clean, production-ready code.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Three simple steps to go from thought to polished interface.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative flex flex-col items-center text-center group"
            >
              <div
                className={`size-24 rounded-2xl ${step.bgColor} ${step.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-border/50`}
              >
                <step.icon className="size-10" />
              </div>

              <div className="space-y-3 px-4">
                <div className="inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-sm mb-2">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
