import { PortfolioData } from "./types";

export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  ownerName: "Frenzy Industrial",
  ownerTitle: "Industrial Product Designer",
  location: "Paris / Global",
  items: [
    {
      id: "1",
      title: "Tactile Audio Interface",
      category: "Electronics",
      imageUrl: "https://picsum.photos/seed/industrial1/800/1200",
      description: "A minimalist approach to tactile feedback in digital audio.",
      year: "2024"
    },
    {
      id: "2",
      title: "Brutalist Chair",
      category: "Furniture",
      imageUrl: "https://picsum.photos/seed/industrial2/800/1100",
      description: "Concrete and steel exploration of seating ergonomics.",
      year: "2023"
    },
    {
      id: "3",
      title: "Aero Modular Watch",
      category: "Wearables",
      imageUrl: "https://picsum.photos/seed/industrial3/800/1000",
      description: "Interchangeable modules for the modern traveler.",
      year: "2024"
    },
    {
      id: "4",
      title: "Sylvan Lighting System",
      category: "Lighting",
      imageUrl: "https://picsum.photos/seed/industrial4/800/1300",
      description: "Bio-mimetic lighting that reacts to ambient sound.",
      year: "2023"
    },
    {
      id: "5",
      title: "Flow Hydration Vessel",
      category: "Lifestyle",
      imageUrl: "https://picsum.photos/seed/industrial5/800/1200",
      description: "Sustainable materials meeting high-performance aesthetics.",
      year: "2024"
    },
    {
      id: "6",
      title: "Kinetic Sculpture #04",
      category: "Art / Product",
      imageUrl: "https://picsum.photos/seed/industrial6/800/1100",
      description: "Mechanical movement as a form of visual poetry.",
      year: "2023"
    },
    {
      id: "7",
      title: "Obsidian Camera Rig",
      category: "Professional Gear",
      imageUrl: "https://picsum.photos/seed/industrial7/800/1200",
      description: "Carbon fiber housing for high-speed cinematography.",
      year: "2024"
    }
  ]
};
