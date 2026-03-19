export interface Ingredient {
  title: string;
  url: string;
  price: number;
  icon: string;
  color: string;
}

export const SUGGESTED_INGREDIENTS: Ingredient[] = [
  {
    title: "Organic Quinoa",
    url: "https://example.com/quinoa",
    price: 2500,
    icon: "Leaf",
    color: "#10b981"
  },
  {
    title: "Cold-Pressed Olive Oil",
    url: "https://example.com/olive-oil",
    price: 4500,
    icon: "Droplets",
    color: "#84cc16"
  },
  {
    title: "Himalayan Pink Salt",
    url: "https://example.com/salt",
    price: 1200,
    icon: "Mountain",
    color: "#fbbf24"
  },
  {
    title: "Chia Seeds",
    url: "https://example.com/chia",
    price: 1800,
    icon: "Sprout",
    color: "#6366f1"
  },
  {
    title: "Manuka Honey",
    url: "https://example.com/honey",
    price: 8500,
    icon: "Hexagon",
    color: "#f59e0b"
  },
  {
    title: "Matcha Green Tea Powder",
    url: "https://example.com/matcha",
    price: 5500,
    icon: "Coffee",
    color: "#22c55e"
  },
  {
    title: "Apple Cider Vinegar",
    url: "https://example.com/acv",
    price: 3200,
    icon: "FlaskConical",
    color: "#ef4444"
  },
  {
    title: "Almond Butter",
    url: "https://example.com/almond-butter",
    price: 3800,
    icon: "Nut",
    color: "#d97706"
  },
  {
    title: "Organic Turmeric Powder",
    url: "https://example.com/turmeric",
    price: 1500,
    icon: "Zap",
    color: "#facc15"
  },
  {
    title: "Cold-Pressed Coconut Oil",
    url: "https://example.com/coconut-oil",
    price: 3500,
    icon: "Circle",
    color: "#94a3b8"
  },
  {
    title: "Goji Berries",
    url: "https://example.com/goji",
    price: 4200,
    icon: "Grape",
    color: "#ef4444"
  },
  {
    title: "Raw Cacao Nibs",
    url: "https://example.com/cacao",
    price: 2800,
    icon: "Cookie",
    color: "#78350f"
  }
];
