import { randomUUID } from 'node:crypto';
import type {
  InventoryMovement,
  MovementId,
  Product,
  ProductCode,
  ProductId,
} from '../../../contracts/inventory.contract';
import type { BranchId } from '../../../contracts/patients.contract';

class InventoryRepository {
  private products = new Map<ProductId, Product>();
  private movements = new Map<MovementId, InventoryMovement>();

  constructor() {
    this.seed();
  }

  private seed() {
    // Semillas para pruebas y ambiente local
    const now = new Date('2026-09-06T10:00:00.000Z');
    const demoItems: Array<Partial<Product>> = [
      {
        id: 'prod-001',
        internalCode: 'ARM-0001',
        vendorBarcode: '7501234567890',
        category: 'frame',
        brand: 'Ray-Ban',
        model: 'Aviator Classic',
        color: 'Dorado / G-15',
        retailPrice: 2800,
        costPrice: 1400,
        stock: 4,
        branchId: 'branch-001',
        active: true,
      },
      {
        id: 'prod-002',
        internalCode: 'ARM-0002',
        category: 'frame',
        brand: 'Vogue',
        model: 'Cat-Eye Acetato',
        color: 'Negro Brillante',
        retailPrice: 1850,
        costPrice: 900,
        stock: 3,
        branchId: 'branch-001',
        active: true,
      },
      {
        id: 'prod-003',
        internalCode: 'SOL-0001',
        vendorBarcode: '7509876543210',
        category: 'solution',
        brand: 'Renu Plus',
        description: 'Solución multipropósito 355 ml',
        retailPrice: 195,
        costPrice: 95,
        stock: 12,
        branchId: 'branch-001',
        active: true,
      },
    ];

    for (const item of demoItems) {
      this.products.set(item.id!, {
        id: item.id!,
        internalCode: item.internalCode!,
        vendorBarcode: item.vendorBarcode,
        category: item.category!,
        brand: item.brand,
        model: item.model,
        color: item.color,
        description: item.description,
        retailPrice: item.retailPrice!,
        costPrice: item.costPrice,
        stock: item.stock!,
        minStockAlert: 2,
        branchId: item.branchId!,
        active: item.active!,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  saveProduct(product: Product): Product {
    this.products.set(product.id, { ...product, updatedAt: new Date() });
    return this.products.get(product.id)!;
  }

  getProduct(id: ProductId): Product | undefined {
    return this.products.get(id);
  }

  getProductByCode(code: string, branchId: BranchId): Product | undefined {
    for (const p of this.products.values()) {
      if (
        p.branchId === branchId &&
        (p.internalCode.toUpperCase() === code.toUpperCase() ||
          p.vendorBarcode === code)
      ) {
        return p;
      }
    }
    return undefined;
  }

  listProducts(branchId: BranchId): Product[] {
    return Array.from(this.products.values()).filter((p) => p.branchId === branchId);
  }

  saveMovement(movement: InventoryMovement): InventoryMovement {
    this.movements.set(movement.id, movement);
    return movement;
  }

  listMovementsByProduct(productId: ProductId): InventoryMovement[] {
    return Array.from(this.movements.values()).filter((m) => m.productId === productId);
  }
}

export const inventoryRepository = new InventoryRepository();
