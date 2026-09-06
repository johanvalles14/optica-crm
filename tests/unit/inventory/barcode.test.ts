import { describe, it, expect } from 'vitest';
import { generateProductCode } from '../../../src/modules/inventory/code-generator';
import JsBarcode from 'jsbarcode';

describe('Generación de Códigos de Barras Code 128', () => {
  it('valida que los códigos de productos de todas las categorías son compatibles con Code 128', () => {
    const categories = ['frame', 'lens_blank', 'contact_lens', 'solution', 'accessory', 'lens_service'] as const;

    for (const cat of categories) {
      const code = generateProductCode(cat, 101);
      expect(code).toMatch(/^[A-Z]{3}-0101$/);

      // Verificamos que JsBarcode puede inicializarse y parsear el valor sin arrojar error
      const dummySvg = {
        setAttribute: () => {},
        appendChild: () => {},
        childNodes: [],
      };

      // Al no estar en DOM completo, probamos que JsBarcode reconozca la sintaxis Code 128
      expect(() => {
        // Objeto mock mínimo de elemento SVG
        JsBarcode(dummySvg as unknown as SVGElement, code, {
          format: 'CODE128',
          displayValue: false,
        });
      }).not.toThrow();
    }
  });
});
