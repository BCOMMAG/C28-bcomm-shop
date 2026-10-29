export interface ProductMedia {
  type: 'video' | 'image';
  src: string;
  label: string;
  colorName?: string;
  isColorCover?: boolean;
}

export interface ProductVariation {
  id?: string;
  color: string;
  size: string;
  stock: number;
  sku?: string;
  price?: number;
  promoPrice?: number;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  formattedPrice: string;
  originalPrice?: number;
  formattedOriginalPrice?: string;
  discountBadge?: string;
  isOutlet?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  category: string;
  subcategory?: string;
  fabric?: string; // Tecido
  fit?: string; // Modelagem
  line?: string; // Linha
  status?: string[]; // Status: Novidade, Mais Vendido, OUTLET, Pronta Entrega
  badge?: string;
  remainingPieces?: number; // Quando <= 5, qualifica para 'Últimas Peças'
  isLastPieces?: boolean;
  description: string;
  details: string[];
  sizes: string[];
  colors: { name: string; hex: string; imageSrc?: string }[];
  variations?: ProductVariation[];
  totalStock?: number;
  media: ProductMedia[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  pairedWithId?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock?: number;
}
