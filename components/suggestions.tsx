"use client";

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

export function Suggestions({ onSelect }: SuggestionsProps) {
  const typeText = (prompt: string) => {
    let index = 0;
    onSelect("");
    
    const interval = setInterval(() => {
      if (index < prompt.length) {
        onSelect(prompt.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 8);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => typeText(suggestion.prompt)}
          className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200 text-sm font-medium"
        >
          {suggestion.title}
        </button>
      ))}
    </div>
  );
}
