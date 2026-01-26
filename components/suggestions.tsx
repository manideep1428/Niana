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
    prompt: `Pet management mobile app for tracking health and daily activities.

Pet avatars are cute, stylized drawings that react to user interactions.
Task checklist items have wobbly hand-drawn checkmarks and satisfying completion animations.
Feeding schedule illustrated with a smiling food bowl icon that fills up.
Vet appointment cards look like little paw prints and expand for details.
Community tab for sharing pet photos with sticker overlays.

Bright, cheerful background with subtle patterns.
Mobile UI, Playful Whimsical aesthetic.
Bright, saturated color palette (sunshine yellow, sky blue, candy pink).
Hand-drawn sketch lines, organic blob shapes, and rounded soft typography.
Cute cartoon character illustrations and bouncy micro-interactions.`,
  },
  {
    title: "Food Delivery",
    prompt: `Food delivery mobile app with real-time tracking and discovery.

Home screen triggers appetizing cravings with large, high-quality food photography.
Restaurant categories represented by detailed 3D food icons.
Restaurant listing with smart filters, ratings, delivery time, and cuisine tags.
Restaurant detail with immersive menu items, customization options, and add to cart.
Cart screen with smart upsells, order summary, and seamless checkout.
Order tracking map with animated delivery rider and live status updates.

Modern, clean aesthetic with warm orange and red accents to stimulate appetite.
Mobile UI with bottom navigation and floating action buttons.
Card-based layout with soft shadows and rounded corners.`,
  },
  {
    title: "Social Media",
    prompt: `Social media mobile app focused on visual storytelling and connection.

Feed screen with immersive full-screen posts, double-tap likes, and threaded comments.
Stories carousel at the top with ring animations for new content.
Profile page with customizable headers, user stats, and masonry photo grid.
Notifications screen with grouped activity updates and action buttons.
Messages/DM screen with active status indicators and rich media sharing.
Search and discover screen with trending hashtags and algorithmic recommendations.

Modern minimal aesthetic with focus on content.
Mobile UI with diverse bottom tab navigation icons.
Clean white or dark mode background with brand-specific accent colors (e.g., violet or teal).
Smooth page transitions and gesture-based navigation.`,
  },
  {
    title: "E-Commerce",
    prompt: `E-commerce shopping mobile app for a premium fashion brand.

Home screen with lifestyle banner sliders, curated collections, and personalized picks.
Product listing with advanced filters, sort options, and quick-view capabilities.
Product detail with zoomable image galleries, size guides, reviews, and sticky add-to-cart.
Wishlist functionality with price drop alerts.
Shopping cart with quantity controls, promo code input, and estimated delivery.
Checkout flow with saved payment methods and address auto-fill.

Modern, premium aesthetic with plenty of whitespace.
Mobile UI with clean, sharp edges and elegant typography (serif for headings).
Neutral palette (black, white, greys) with a single sophisticated accent color.
Focus on high-resolution product imagery and clear call-to-action buttons.`,
  },
  {
    title: "Banking App",
    prompt: `Mobile banking and personal finance management app.

Account balance card with glassmorphism effect and masked sensitive data.
Transaction history list with merchant logos and category color-coding.
Quick action buttons for transfer, bill pay, and mobile check deposit.
Spending analytics with interactive donut charts and monthly budget progress bars.
Card management section showing virtual cards with freeze/unfreeze toggles.
Savings goals with visual progress trackers and auto-save rules.

Mobile UI, Fintech aesthetic.
Professional dark or light theme with high contrast for readability.
Secure, trustworthy feel using deep blues or greens.
Clean, sans-serif typography with tabular figures for numbers.
Subtle security animations (e.g., lock icons, success checks).`,
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
    [],
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
      className="relative px-6 py-3 rounded-full text-secondary-foreground transition-all duration-200 text-base font-medium cursor-pointer overflow-hidden group"
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
    <div className="flex flex-wrap justify-center gap-3 mt-4">
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
