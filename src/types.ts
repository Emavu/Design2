export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  images?: string[]; // Multiple images for gallery
  description?: string;
  year?: string;
  label?: string; // e.g. "Case Study 2026"
}

export interface PortfolioData {
  ownerName: string;
  ownerTitle: string;
  location: string;
  items: PortfolioItem[];
}
