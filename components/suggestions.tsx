"use client";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";

export interface Suggestion {
  title: string;
  prompt: string;
}

const suggestions: Suggestion[] = [
  {
    title: "Pet App",
    prompt: `Pet management mobile app.

Pet avatars are cute, stylized drawings.
Task checklist items have wobbly hand-drawn checkmarks.
Feeding schedule illustrated with a smiling food bowl icon.
Vet appointment cards look like little paw prints.

Bright, cheerful background.
Mobile UI, Playful Whimsical aesthetic.
Bright, saturated color palette (sunshine yellow, sky blue, candy pink).
Hand-drawn sketch lines, organic blob shapes.
Cute cartoon character illustrations.`,
  },
  {
    title: "Food Delivery",
    prompt: `Food delivery mobile app.

Home screen with restaurant categories and featured deals.
Restaurant listing with ratings, delivery time, and cuisine tags.
Restaurant detail with menu items and add to cart.
Cart screen with order summary and checkout.
Order tracking with live status updates.

Modern, clean aesthetic with warm orange accents.
Mobile UI with bottom navigation.`,
  },
  {
    title: "Social Media",
    prompt: `Social media mobile app.

Feed screen with posts, likes, and comments.
Profile page with user stats and photo grid.
Notifications screen with activity updates.
Messages/DM screen with conversation list.
Search and discover screen.

Modern minimal aesthetic.
Mobile UI with bottom tab navigation.
Clean white background with accent colors.`,
  },
  {
    title: "E-Commerce",
    prompt: `E-commerce shopping mobile app.

Home screen with categories and featured products.
Product listing with filters and sorting.
Product detail with images, description, and reviews.
Shopping cart with quantity controls.
Checkout flow with payment options.

Modern, premium aesthetic.
Mobile UI with clean card-based layout.
Neutral palette with brand accent color.`,
  },
  {
    title: "Banking App",
    prompt: `Mobile banking app.

Account balance card with gradient background.
Transaction history list with category icons.
Quick action buttons for transfer, pay, and deposit.
Spending analytics with donut chart.
Card management section showing virtual cards.

Mobile UI, Fintech aesthetic.
Professional dark or light theme.
Secure, trustworthy feel.`,
  },
];

interface SuggestionsProps {
  onSelect: (prompt: string) => void;
}

interface CardMousePosition {
  x: number;
  y: number;
}

function SuggestionCard({
  suggestion,
  onClick,
}: {
  suggestion: Suggestion;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [mousePosition, setMousePosition] = useState<CardMousePosition>({
    x: 0,
    y: 0,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <motion.button
      ref={cardRef}
      animate={{
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative px-4 py-2 rounded-full text-secondary-foreground transition-all duration-200 text-sm font-medium cursor-pointer overflow-hidden group"
      style={{
        background: "transparent",
      }}
    >
      {/* Animated gradient border */}
      <span
        className="absolute inset-0 rounded-full transition-opacity duration-300"
        style={{
          background: isHovered
            ? `radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                rgba(59, 130, 246, 0.8), 
                rgba(139, 92, 246, 0.6), 
                rgba(236, 72, 153, 0.4), 
                transparent 70%)`
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))",
          opacity: isHovered ? 1 : 0.5,
        }}
      />

      {/* Inner background */}
      <span className="absolute inset-[1.5px] rounded-full bg-secondary transition-colors duration-200 group-hover:bg-secondary/90" />

      {/* Text content */}
      <span className="relative z-10">{suggestion.title}</span>
    </motion.button>
  );
}

export function Suggestions({ onSelect }: SuggestionsProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const typeText = (prompt: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    onSelect("");

    let index = 0;

    intervalRef.current = setInterval(() => {
      if (index < prompt.length) {
        onSelect(prompt.slice(0, index + 1));
        index++;
      } else {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 6);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {suggestions.map((suggestion, index) => (
        <SuggestionCard
          key={index}
          suggestion={suggestion}
          onClick={() => typeText(suggestion.prompt)}
        />
      ))}
    </div>
  );
}
