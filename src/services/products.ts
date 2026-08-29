import data from '@/assets/products.json';
import { productImages } from '@/services/productImages';

export type Product = {
  id: string;
  label: string;
  category: string;
  categoryName: string;
  karat: number | null;
  weight: number | null;
  imageKey: string;
};

export const products = (data as Product[]).map((p) => ({
  ...p,
  // merge folder variants (gentsring22 + gentsrings, ladiesring18/22…) into one key
  category: p.categoryName.toLowerCase(),
}));

export function imageFor(p: Product): number | undefined {
  return productImages[p.imageKey];
}

export function categories(): { key: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const p of products) {
    const cur = map.get(p.category);
    if (cur) cur.count += 1;
    else map.set(p.category, { name: p.categoryName, count: 1 });
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export function byCategory(key: string): Product[] {
  if (key === 'all') return products;
  return products.filter((p) => p.category === key);
}

export function getById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
}
