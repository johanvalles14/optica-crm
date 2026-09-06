/**
 * Contrato del módulo inventory para SPEC-002.
 * Define operaciones de catálogo, altas rápidas, movimientos y bajas.
 */

import type { ActorContext, UserId } from './auth.contract';
import type { BranchId } from './patients.contract';

export type ProductId = string;
export type ProductCode = string; // Código interno ej. ARM-0042
export type MovementId = string;

export type ProductCategory =
  | 'frame'          // Armazón
  | 'lens_blank'     // Mica física terminada / semiterminada
  | 'contact_lens'   // Lente de contacto
  | 'solution'       // Solución / gotas
  | 'accessory'      // Estuches, microfibras, cordones
  | 'lens_service';  // Tratamiento o servicio de laboratorio

export type MovementReason =
  | 'intake_batch'       // Alta por lote
  | 'intake_individual'  // Alta individual
  | 'sale'               // Venta en mostrador
  | 'sale_cancelled'     // Venta cancelada / reversión
  | 'damage_breakage'    // Rotura en taller o exhibición (merma)
  | 'vendor_return'      // Devolución a proveedor
  | 'warranty'           // Garantía de cliente o fábrica
  | 'physical_count'     // Ajuste por conteo físico / inventario
  | 'theft_loss';        // Extravío o faltante

export interface Product {
  id: ProductId;
  internalCode: ProductCode;
  vendorBarcode?: string;
  category: ProductCategory;
  brand?: string;
  model?: string;
  color?: string;
  description?: string;
  retailPrice: number; // En centavos o moneda base (ej. 850.00)
  costPrice?: number;   // Visible solo para admin
  stock: number;
  minStockAlert?: number;
  branchId: BranchId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickBatchIntakeInput {
  category: ProductCategory;
  brand?: string;
  descriptionPattern?: string;
  retailPrice: number;
  costPrice?: number;
  quantity: number;
  branchId: BranchId;
}

export interface InventoryAdjustmentInput {
  productId: ProductId;
  quantity: number; // Positivo para entrada, negativo para baja
  reason: MovementReason;
  notes: string;
  expectedVersion?: number;
}

export interface InventoryMovement {
  id: MovementId;
  productId: ProductId;
  internalCode: ProductCode;
  branchId: BranchId;
  movementType: 'in' | 'out' | 'adjust';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: MovementReason;
  notes?: string;
  actorId: UserId;
  occurredAt: Date;
}

export interface ProductSearchQuery {
  term?: string; // Busca en código interno, código de proveedor, marca o modelo
  category?: ProductCategory;
  onlyInStock?: boolean;
  branchId: BranchId;
  limit?: number;
}

export interface ReconciliationItem {
  internalCode: ProductCode;
  expectedStock: number;
  countedStock: number;
  difference: number;
}

export interface ReconciliationReport {
  branchId: BranchId;
  totalExpected: number;
  totalCounted: number;
  discrepancies: ReconciliationItem[];
  generatedAt: Date;
}

export interface IInventoryService {
  quickBatchIntake(input: QuickBatchIntakeInput, actor: ActorContext): Promise<Product[]>;
  createProduct(input: Omit<Product, 'id' | 'internalCode' | 'createdAt' | 'updatedAt' | 'stock'> & { initialStock?: number }, actor: ActorContext): Promise<Product>;
  recordAdjustment(input: InventoryAdjustmentInput, actor: ActorContext): Promise<InventoryMovement>;
  search(query: ProductSearchQuery, actor: ActorContext): Promise<Product[]>;
  findByCode(code: string, branchId: BranchId, actor: ActorContext): Promise<Product | null>;
  reconcileCount(scannedCodes: string[], branchId: BranchId, actor: ActorContext): Promise<ReconciliationReport>;
}
