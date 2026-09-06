import type { Prisma } from '@prisma/client';
import type { ActorContext } from '../../../contracts/auth.contract';
import type { BranchId } from '../../../contracts/patients.contract';
import type { InventoryAdjustmentInput, InventoryMovement, Product, ProductCategory, ProductSearchQuery, QuickBatchIntakeInput, ReconciliationReport } from '../../../contracts/inventory.contract';
import { prisma } from '../../lib/prisma';
import { authorize } from '../auth/rbac';
import { AuditService } from '../audit/service';
import { generateProductCode } from './code-generator';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapProduct(record: { id: string; internalCode: string; vendorBarcode: string | null; category: ProductCategory; brand: string | null; model: string | null; color: string | null; description: string | null; retailPrice: Prisma.Decimal; costPrice: Prisma.Decimal | null; stock: number; minStockAlert: number; branchId: string; active: boolean; createdAt: Date; updatedAt: Date }, actor: ActorContext): Product {
  const product: Product = { id: record.id, internalCode: record.internalCode, vendorBarcode: record.vendorBarcode ?? undefined, category: record.category, brand: record.brand ?? undefined, model: record.model ?? undefined, color: record.color ?? undefined, description: record.description ?? undefined, retailPrice: Number(record.retailPrice), costPrice: record.costPrice === null ? undefined : Number(record.costPrice), stock: record.stock, minStockAlert: record.minStockAlert, branchId: record.branchId, active: record.active, createdAt: record.createdAt, updatedAt: record.updatedAt };
  if (actor.role !== 'admin') delete product.costPrice;
  return product;
}

function mapMovement(record: { id: string; productId: string; branchId: string; movementType: InventoryMovement['movementType']; quantityChange: number; previousStock: number; newStock: number; reason: InventoryMovement['reason']; notes: string | null; actorId: string; occurredAt: Date }, internalCode: string): InventoryMovement {
  return { id: record.id, productId: record.productId, internalCode, branchId: record.branchId, movementType: record.movementType, quantityChange: record.quantityChange, previousStock: record.previousStock, newStock: record.newStock, reason: record.reason, notes: record.notes ?? undefined, actorId: record.actorId, occurredAt: record.occurredAt };
}

export class PrismaInventoryService {
  private readonly audit = new AuditService();

  private async branch(branchId: string) {
    const key = branchId === 'branch-001' ? 'PT' : branchId;
    return prisma.branch.findFirstOrThrow({ where: isUuid(key) ? { OR: [{ id: key }, { code: key }] } : { code: key } });
  }

  async search(query: ProductSearchQuery, actor: ActorContext): Promise<Product[]> {
    if (!authorize(actor.role, 'search', 'Product')) throw new Error('Permission denied');
    const branch = await this.branch(query.branchId);
    const term = query.term?.trim();
    const records = await prisma.product.findMany({ where: { branchId: branch.id, active: true, ...(query.category && { category: query.category }), ...(query.onlyInStock && { stock: { gt: 0 } }), ...(term && { OR: [{ internalCode: { contains: term, mode: 'insensitive' } }, { vendorBarcode: { contains: term, mode: 'insensitive' } }, { brand: { contains: term, mode: 'insensitive' } }, { model: { contains: term, mode: 'insensitive' } }, { description: { contains: term, mode: 'insensitive' } }] }) }, orderBy: { internalCode: 'asc' }, take: query.limit ?? 50 });
    return records.map((record) => mapProduct(record, actor));
  }

  async quickBatchIntake(input: QuickBatchIntakeInput, actor: ActorContext): Promise<Product[]> {
    if (!authorize(actor.role, 'quickBatchIntake', 'Product')) throw new Error('Permission denied: No autorizado para dar de alta inventario');
    if (!input.quantity || input.quantity <= 0) throw new Error('La cantidad de piezas debe ser mayor a cero');
    if (input.retailPrice < 0) throw new Error('El precio de venta debe ser mayor o igual a cero');
    const products = await prisma.$transaction(async (transaction) => {
      const branch = await transaction.branch.findFirstOrThrow({ where: { code: input.branchId === 'branch-001' ? 'PT' : input.branchId } });
      const created: Product[] = [];
      for (let index = 0; index < input.quantity; index += 1) {
        const updatedBranch = await transaction.branch.update({ where: { id: branch.id }, data: { nextProductSequence: { increment: 1 } } });
        const now = new Date();
        const record = await transaction.product.create({ data: { internalCode: generateProductCode(input.category, updatedBranch.nextProductSequence - 1), category: input.category, brand: input.brand, description: input.descriptionPattern, retailPrice: input.retailPrice, costPrice: input.costPrice, stock: 1, minStockAlert: 1, branchId: branch.id, createdAt: now, updatedAt: now } });
        await transaction.inventoryMovement.create({ data: { productId: record.id, branchId: branch.id, movementType: 'in', quantityChange: 1, previousStock: 0, newStock: 1, reason: 'intake_batch', notes: `Alta rápida en lote de ${input.quantity} piezas`, actorId: actor.actorId, occurredAt: now } });
        created.push(mapProduct(record, actor));
      }
      return created;
    });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'create', entity: 'ProductBatch', entityId: products[0]?.id ?? 'batch', requestId: actor.requestId, metadata: { count: input.quantity, category: input.category } });
    return products;
  }

  async createProduct(input: Omit<Product, 'id' | 'internalCode' | 'createdAt' | 'updatedAt' | 'stock'> & { initialStock?: number }, actor: ActorContext): Promise<Product> {
    if (!authorize(actor.role, 'create', 'Product')) throw new Error('Permission denied');
    const stock = input.initialStock ?? 0;
    const product = await prisma.$transaction(async (transaction) => {
      const branch = await transaction.branch.findFirstOrThrow({ where: { code: input.branchId === 'branch-001' ? 'PT' : input.branchId } });
      const updatedBranch = await transaction.branch.update({ where: { id: branch.id }, data: { nextProductSequence: { increment: 1 } } });
      const now = new Date();
      const record = await transaction.product.create({ data: { internalCode: generateProductCode(input.category, updatedBranch.nextProductSequence - 1), vendorBarcode: input.vendorBarcode, category: input.category, brand: input.brand, model: input.model, color: input.color, description: input.description, retailPrice: input.retailPrice, costPrice: input.costPrice, stock, minStockAlert: input.minStockAlert ?? 2, branchId: branch.id, active: input.active, createdAt: now, updatedAt: now } });
      if (stock > 0) await transaction.inventoryMovement.create({ data: { productId: record.id, branchId: branch.id, movementType: 'in', quantityChange: stock, previousStock: 0, newStock: stock, reason: 'intake_individual', notes: 'Alta individual de producto', actorId: actor.actorId, occurredAt: now } });
      return mapProduct(record, actor);
    });
    return product;
  }

  async recordAdjustment(input: InventoryAdjustmentInput, actor: ActorContext): Promise<InventoryMovement> {
    if (!authorize(actor.role, 'adjust', 'InventoryMovement')) throw new Error('Permission denied');
    if (!input.notes?.trim()) throw new Error('La justificación o nota de ajuste es obligatoria');
    const movement = await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({ where: { id: input.productId } });
      if (!product) throw new Error('Producto no encontrado');
      if (input.quantity < 0 && Math.abs(input.quantity) > product.stock) throw new Error('Stock insuficiente: no se pueden descontar más unidades de las disponibles');
      const result = await transaction.product.updateMany({ where: { id: product.id, ...(input.expectedVersion !== undefined && { version: input.expectedVersion }) }, data: { stock: { increment: input.quantity }, version: { increment: 1 }, updatedAt: new Date() } });
      if (result.count !== 1) throw new Error('Stale version: expectedVersion does not match');
      const now = new Date();
      const record = await transaction.inventoryMovement.create({ data: { productId: product.id, branchId: product.branchId, movementType: input.quantity < 0 ? 'out' : input.quantity > 0 ? 'in' : 'adjust', quantityChange: input.quantity, previousStock: product.stock, newStock: product.stock + input.quantity, reason: input.reason, notes: input.notes, actorId: actor.actorId, occurredAt: now } });
      return mapMovement(record, product.internalCode);
    });
    await this.audit.record({ actorId: actor.actorId, role: actor.role, action: 'update', entity: 'InventoryMovement', entityId: movement.id, requestId: actor.requestId, reason: input.notes });
    return movement;
  }

  async findByCode(code: string, branchId: BranchId, actor: ActorContext): Promise<Product | null> {
    if (!authorize(actor.role, 'read', 'Product')) throw new Error('Permission denied');
    const branch = await this.branch(branchId);
    const record = await prisma.product.findFirst({ where: { branchId: branch.id, OR: [{ internalCode: code }, { vendorBarcode: code }] } });
    return record ? mapProduct(record, actor) : null;
  }

  async reconcileCount(scannedCodes: string[], branchId: BranchId, actor: ActorContext): Promise<ReconciliationReport> {
    if (!authorize(actor.role, 'reconcile', 'InventoryMovement')) throw new Error('Permission denied');
    const products = await this.search({ branchId }, actor);
    const counts = new Map<string, number>();
    scannedCodes.forEach((code) => counts.set(code.toUpperCase(), (counts.get(code.toUpperCase()) ?? 0) + 1));
    const discrepancies = products.filter((product) => product.stock !== (counts.get(product.internalCode.toUpperCase()) ?? 0)).map((product) => ({ internalCode: product.internalCode, expectedStock: product.stock, countedStock: counts.get(product.internalCode.toUpperCase()) ?? 0, difference: (counts.get(product.internalCode.toUpperCase()) ?? 0) - product.stock }));
    return { branchId, totalExpected: products.reduce((sum, product) => sum + product.stock, 0), totalCounted: scannedCodes.length, discrepancies, generatedAt: new Date() };
  }
}

export const prismaInventoryService = new PrismaInventoryService();
