import type { ProductCategory, ProductCode } from '../../../contracts/inventory.contract';

const prefixMap: Record<ProductCategory, string> = {
  frame: 'ARM',
  lens_blank: 'MIC',
  contact_lens: 'CON',
  solution: 'SOL',
  accessory: 'ACC',
  lens_service: 'SRV',
};

let currentSequence = 101;

export function generateProductCode(category: ProductCategory, sequence?: number): ProductCode {
  const prefix = prefixMap[category] ?? 'ART';
  const seq = sequence ?? currentSequence++;
  return `${prefix}-${seq.toString().padStart(4, '0')}`;
}

export function resetProductCodeSequence(initial = 101): void {
  currentSequence = initial;
}
