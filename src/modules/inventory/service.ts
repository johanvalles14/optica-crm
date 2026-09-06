import { randomUUID } from 'node:crypto';
import type { ActorContext } from '../../../contracts/auth.contract';
import type { BranchId } from '../../../contracts/patients.contract';
import type {
  IInventoryService,
  InventoryAdjustmentInput,
  InventoryMovement,
  Product,
  ProductSearchQuery,
  QuickBatchIntakeInput,
  ReconciliationItem,
  ReconciliationReport,
} from '../../../contracts/inventory.contract';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { generateProductCode } from './code-generator';
import { inventoryRepository } from './repository';

function sanitizeProduct(product: Product, actor: ActorContext): Product {
  if (actor.role === 'admin') {
    return { ...product };
  }
  const safe = { ...product };
  delete safe.costPrice;
  return safe;
}

export class InventoryService implements IInventoryService {
  private audit = new AuditService();

  async quickBatchIntake(
    input: QuickBatchIntakeInput,
    actor: ActorContext
  ): Promise<Product[]> {
    if (!authorize(actor.role, 'quickBatchIntake', 'Product')) {
      throw new Error('Permission denied: No autorizado para dar de alta inventario');
    }

    if (!input.quantity || input.quantity <= 0) {
      throw new Error('La cantidad de piezas debe ser mayor a cero');
    }

    if (input.retailPrice === undefined || input.retailPrice < 0) {
      throw new Error('El precio de venta debe ser mayor o igual a cero');
    }

    const created: Product[] = [];
    const now = new Date();

    for (let i = 0; i < input.quantity; i++) {
      const internalCode = generateProductCode(input.category);
      const product: Product = {
        id: randomUUID(),
        internalCode,
        category: input.category,
        brand: input.brand,
        description: input.descriptionPattern,
        retailPrice: input.retailPrice,
        costPrice: input.costPrice,
        stock: 1, // Cada pieza generada en serie tiene 1 unidad de stock
        minStockAlert: 1,
        branchId: input.branchId,
        active: true,
        createdAt: now,
        updatedAt: now,
      };

      inventoryRepository.saveProduct(product);

      // Movimiento de inventario inmutable
      inventoryRepository.saveMovement({
        id: randomUUID(),
        productId: product.id,
        internalCode: product.internalCode,
        branchId: input.branchId,
        movementType: 'in',
        quantityChange: 1,
        previousStock: 0,
        newStock: 1,
        reason: 'intake_batch',
        notes: `Alta rápida en lote de ${input.quantity} piezas`,
        actorId: actor.actorId,
        occurredAt: now,
      });

      created.push(sanitizeProduct(product, actor));
    }

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'create',
      entity: 'ProductBatch',
      entityId: created[0]?.id || 'batch',
      requestId: actor.requestId,
      metadata: { count: input.quantity, category: input.category },
    });

    return created;
  }

  async createProduct(
    input: Omit<Product, 'id' | 'internalCode' | 'createdAt' | 'updatedAt' | 'stock'> & { initialStock?: number },
    actor: ActorContext
  ): Promise<Product> {
    if (!authorize(actor.role, 'create', 'Product')) {
      throw new Error('Permission denied');
    }

    const stock = input.initialStock ?? 0;
    const internalCode = generateProductCode(input.category);
    const now = new Date();
    const product: Product = {
      ...input,
      id: randomUUID(),
      internalCode,
      stock,
      createdAt: now,
      updatedAt: now,
    };

    inventoryRepository.saveProduct(product);

    if (stock > 0) {
      inventoryRepository.saveMovement({
        id: randomUUID(),
        productId: product.id,
        internalCode: product.internalCode,
        branchId: input.branchId,
        movementType: 'in',
        quantityChange: stock,
        previousStock: 0,
        newStock: stock,
        reason: 'intake_individual',
        notes: 'Alta individual de producto',
        actorId: actor.actorId,
        occurredAt: now,
      });
    }

    return sanitizeProduct(product, actor);
  }

  async recordAdjustment(
    input: InventoryAdjustmentInput,
    actor: ActorContext
  ): Promise<InventoryMovement> {
    if (!authorize(actor.role, 'adjust', 'InventoryMovement')) {
      throw new Error('Permission denied');
    }

    if (!input.notes || !input.notes.trim()) {
      throw new Error('La justificación o nota de ajuste es obligatoria');
    }

    const product = inventoryRepository.getProduct(input.productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (input.quantity < 0 && Math.abs(input.quantity) > product.stock) {
      throw new Error('Stock insuficiente: no se pueden descontar más unidades de las disponibles');
    }

    const previousStock = product.stock;
    const newStock = previousStock + input.quantity;

    product.stock = newStock;
    inventoryRepository.saveProduct(product);

    const movement: InventoryMovement = {
      id: randomUUID(),
      productId: product.id,
      internalCode: product.internalCode,
      branchId: product.branchId,
      movementType: input.quantity < 0 ? 'out' : input.quantity > 0 ? 'in' : 'adjust',
      quantityChange: input.quantity,
      previousStock,
      newStock,
      reason: input.reason,
      notes: input.notes,
      actorId: actor.actorId,
      occurredAt: new Date(),
    };

    inventoryRepository.saveMovement(movement);

    await this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action: 'update',
      entity: 'InventoryMovement',
      entityId: movement.id,
      requestId: actor.requestId,
      reason: input.notes,
    });

    return movement;
  }

  async search(
    query: ProductSearchQuery,
    actor: ActorContext
  ): Promise<Product[]> {
    const list = inventoryRepository.listProducts(query.branchId);
    const term = query.term?.toLowerCase().trim();

    const filtered = list.filter((p) => {
      if (!p.active) return false;
      if (query.category && p.category !== query.category) return false;
      if (query.onlyInStock && p.stock <= 0) return false;
      if (term) {
        const matchCode = p.internalCode.toLowerCase().includes(term);
        const matchBarcode = p.vendorBarcode?.toLowerCase().includes(term);
        const matchBrand = p.brand?.toLowerCase().includes(term);
        const matchModel = p.model?.toLowerCase().includes(term);
        const matchDesc = p.description?.toLowerCase().includes(term);
        if (!matchCode && !matchBarcode && !matchBrand && !matchModel && !matchDesc) {
          return false;
        }
      }
      return true;
    });

    const limit = query.limit ?? 50;
    return filtered.slice(0, limit).map((p) => sanitizeProduct(p, actor));
  }

  async findByCode(
    code: string,
    branchId: BranchId,
    actor: ActorContext
  ): Promise<Product | null> {
    const product = inventoryRepository.getProductByCode(code, branchId);
    if (!product) return null;
    return sanitizeProduct(product, actor);
  }

  async reconcileCount(
    scannedCodes: string[],
    branchId: BranchId,
    _actor: ActorContext
  ): Promise<ReconciliationReport> {
    const allProducts = inventoryRepository.listProducts(branchId);
    const scannedCounts = new Map<string, number>();

    for (const code of scannedCodes) {
      const upper = code.toUpperCase();
      scannedCounts.set(upper, (scannedCounts.get(upper) ?? 0) + 1);
    }

    const discrepancies: ReconciliationItem[] = [];
    let totalExpected = 0;
    const totalCounted = scannedCodes.length;

    for (const p of allProducts) {
      if (p.stock > 0 || scannedCounts.has(p.internalCode.toUpperCase())) {
        const expected = p.stock;
        const counted = scannedCounts.get(p.internalCode.toUpperCase()) ?? 0;
        totalExpected += expected;

        if (expected !== counted) {
          discrepancies.push({
            internalCode: p.internalCode,
            expectedStock: expected,
            countedStock: counted,
            difference: counted - expected,
          });
        }
      }
    }

    return {
      branchId,
      totalExpected,
      totalCounted,
      discrepancies,
      generatedAt: new Date(),
    };
  }
}
