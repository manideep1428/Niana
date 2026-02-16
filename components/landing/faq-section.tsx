"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "How does the AI generation work?",
    answer:
      "Our AI model analyzes your text description and generates high-fidelity UI designs by understanding context, layout principles, and modern design trends. It's like having a professional designer at your fingertips.",
  },
  {
    question: "Can I export the Figma?",
    answer: `Yes! You can instantly export any generated design to clean, responsive Figma designs.
      \n\n We are also planning directly turn React code with Tailwind CSS, ready to be dropped into your project `,
  },
  {
    question: "What's included in the subscription?",
    answer:
      "The subscription gives you unlimited access to AI generations, all export features, priority support, and commercial usage rights for all designs you create.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time from your account settings. You'll keep access until the end of your current billing period.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Due to an overwhelming response and current limitations with our payment handlers, we are unable to offer refunds once a payment is made. Please only upgrade if you are sure Niana is right for you.",
  },
];

export function FaqSection() {
  return (
    <section className="py-24 relative bg-secondary/20">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Answers to common questions about our platform.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b-border/50"
              >
                <AccordionTrigger className="text-left text-lg font-medium py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
