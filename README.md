# Niana - AI-Powered Mobile UI/UX Design Studio

<div align="center">
  <h3>🎨 Create stunning mobile app designs with the power of AI</h3>
  <p>Transform your app ideas into high-fidelity mobile UI designs in seconds</p>
</div>

---

## ✨ Overview

**Niana** is an intelligent mobile UI/UX design assistant that helps you create professional, production-ready mobile app interface designs. Simply describe your app idea, and Niana will generate beautiful, modern mobile screens tailored to your specifications.

## 🚀 Key Features

### 🎯 Mobile-First Design

- Specialized exclusively for mobile app design
- Optimized for iOS and Android screen dimensions
- Touch-friendly interfaces with proper touch target sizing

### 🧠 AI-Powered Intelligence

- Understands context and automatically generates appropriate screens
- Smart screen recommendations based on app type
- Follows modern mobile design principles automatically

### 📱 Multi-Screen Generation

- Creates complete app flows with multiple screens in one request
- Generates 3-5+ screens based on app complexity
- Maintains consistent design language across all screens

### 🎨 Production-Ready Designs

- Modern, polished UI with professional color palettes
- Consistent 8px spacing system
- WCAG AA compliant color contrast
- Clean visual hierarchy

### 🔄 Iterative Refinement

- Update and refine existing designs
- Customize fonts, colors, and layouts
- Add new screens to existing projects

## 📋 Supported App Types

| App Category        | Typical Screens                                                |
| ------------------- | -------------------------------------------------------------- |
| **Food Delivery**   | Home, Restaurants, Menu, Cart, Checkout, Order Tracking        |
| **E-commerce**      | Home, Categories, Product List, Product Detail, Cart, Checkout |
| **Social Media**    | Feed, Profile, Notifications, Messages, Search                 |
| **Fitness**         | Home, Workouts, Progress, Profile                              |
| **Banking/Finance** | Dashboard, Accounts, Transactions, Transfers                   |
| **Chat/Messaging**  | Conversations, Chat, Contacts, Settings                        |

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16
- **Database**: [Convex](https://convex.dev) - Real-time backend
- **Authentication**: [WorkOS AuthKit](https://workos.com)
- **AI Integration**: OpenAI API
- **UI Components**: Radix UI + Tailwind CSS
- **Canvas**: React Flow for design workspace

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Convex account (for backend)
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/manideep1428/Niana.git
   cd Niana
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**

   Create a `.env.local` file with your credentials:

   ```env
   CONVEX_DEPLOYMENT=your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   OPENAI_API_KEY=your_openai_api_key
   WORKOS_API_KEY=your_workos_api_key
   WORKOS_CLIENT_ID=your_workos_client_id
   ```

4. **Start the development server**

   ```bash
   # Run Convex backend
   npx convex dev

   # In another terminal, run Next.js
   npm run dev
   # or
   bun dev
   ```

5. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 💡 Usage

1. **Describe your app** - Tell Niana what kind of mobile app you want to design
2. **Generate designs** - AI creates multiple high-fidelity screens
3. **Refine & iterate** - Request changes, add screens, or modify styles
4. **Export & use** - Download your designs for development

### Example Prompts

```
"Create a food delivery app with a modern dark theme"

"Design a fitness tracking app with workout logging and progress charts"

"Build a social media app with a clean minimalist design"
```

## 📁 Project Structure

```
Niana/
├── app/                  # Next.js app router pages
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   └── ...              # Feature components
├── convex/              # Convex backend functions
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and prompts
└── public/              # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/manideep1428">Manideep</a></p>
  <p>
    <a href="https://github.com/manideep1428/Niana/issues">Report Bug</a>
    ·
    <a href="https://github.com/manideep1428/Niana/issues">Request Feature</a>
  </p>
</div>
