
import type { Product } from '../types';

export function asInt(n: any): number {
  const x = Number.parseInt(String(n ?? '').trim(), 10);
  return Number.isFinite(x) && x >= 0 ? x : NaN;
}

export function priceFor(
  type: 'RETAIL' | 'WHOLESALE',
  product: Product | undefined | null
): { unitPrice: number; note?: 'fallback-retail' } {
  if (!product) {
    throw new Error('Product data is missing.');
  }

  const retail = asInt(product.retailPrice);
  const wholesale = asInt(product.wholesalePrice);

  if (type === 'WHOLESALE') {
    if (Number.isNaN(wholesale)) {
      // Fallback strategy:
      if (!Number.isNaN(retail)) {
        return { unitPrice: retail, note: 'fallback-retail' };
      }
      throw new Error(
        `Product ${product.code ?? product.name ?? '(unknown)'} has no valid wholesale or retail price.`
      );
    }
    return { unitPrice: wholesale };
  }

  // Default to RETAIL
  if (Number.isNaN(retail)) {
    throw new Error(
      `Product ${product.code ?? product.name ?? '(unknown)'} has no valid retail price.`
    );
  }
  return { unitPrice: retail };
}
