/**
 * Contrato del módulo sales para SPEC-002.
 * Define operaciones del punto de venta óptico, cotizaciones, pagos y tickets.
 */

import type { ActorContext, UserId } from './auth.contract';
import type { BranchId, Folio, PatientId } from './patients.contract';
import type { PrescriptionId } from './clinical.contract';
import type { ProductCode, ProductId } from './inventory.contract';

export type SaleOrderId = string;
export type SaleOrderFolio = string; // Ej. VTA-00104
export type PaymentId = string;

export type OrderStatus =
  | 'quote'                  // Cotización preliminar
  | 'pending_deposit'        // Pendiente de pago/anticipo
  | 'confirmed_in_process'   // Anticipo cubierto, en preparación/taller
  | 'ready_for_delivery'     // Listo en mostrador para entrega
  | 'delivered_paid'         // Liquidado y entregado al paciente
  | 'cancelled';             // Cancelado con reversión de inventario

export type PaymentMethod =
  | 'cash'        // Efectivo
  | 'card_debit'  // Tarjeta de débito
  | 'card_credit' // Tarjeta de crédito
  | 'transfer';   // Transferencia bancaria (SPEI)

export interface LensConfiguration {
  lensType: 'monofocal' | 'bifocal' | 'progressive' | 'contact_lens';
  material: 'cr39' | 'poly' | 'hi_index' | 'trivex';
  treatments: Array<'antireflective' | 'blue_filter' | 'photochromic' | 'uv_protect' | 'tint'>;
  labWorkType?: string; // Biselado especial, ranurado, etc.
  price: number;
}

export interface SaleItem {
  id: string;
  itemType: 'frame' | 'lens_complete' | 'contact_lens' | 'accessory' | 'service';
  productId?: ProductId;
  productCode?: ProductCode;
  description: string;
  lensConfig?: LensConfiguration;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentRecord {
  id: PaymentId;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  receivedBy: UserId;
  paidAt: Date;
}

export interface SaleOrder {
  id: SaleOrderId;
  folio: SaleOrderFolio;
  branchId: BranchId;
  patientId?: PatientId;
  patientName?: string;
  prescriptionId?: PrescriptionId;
  status: OrderStatus;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceDue: number; // total - paidAmount
  promisedDeliveryDate?: Date;
  deliveredAt?: Date;
  notes?: string;
  version: number;
  payments: PaymentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSaleOrderInput {
  branchId: BranchId;
  patientId?: PatientId;
  patientName?: string;
  prescriptionId?: PrescriptionId;
  items: Array<Omit<SaleItem, 'id' | 'totalPrice'>>;
  discount?: number;
  promisedDeliveryDate?: Date;
  notes?: string;
  initialPayment?: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  };
}

export interface RecordPaymentInput {
  orderId: SaleOrderId;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  expectedVersion: number;
}

export interface TicketPrintData {
  orderFolio: SaleOrderFolio;
  branchName: string;
  date: Date;
  patientName?: string;
  items: Array<{
    description: string;
    quantity: number;
    total: number;
  }>;
  total: number;
  paidAmount: number;
  balanceDue: number;
  payments: Array<{
    method: string;
    amount: number;
    date: Date;
  }>;
  promisedDeliveryDate?: Date;
  policiesText: string;
}

export interface ISalesService {
  createOrder(input: CreateSaleOrderInput, actor: ActorContext): Promise<SaleOrder>;
  recordPayment(input: RecordPaymentInput, actor: ActorContext): Promise<SaleOrder>;
  markReadyForDelivery(orderId: SaleOrderId, expectedVersion: number, actor: ActorContext): Promise<SaleOrder>;
  deliverAndClose(orderId: SaleOrderId, finalPayment: { amount: number; method: PaymentMethod } | undefined, expectedVersion: number, actor: ActorContext): Promise<SaleOrder>;
  cancelOrder(orderId: SaleOrderId, reason: string, expectedVersion: number, actor: ActorContext): Promise<SaleOrder>;
  getOrder(orderId: SaleOrderId, actor: ActorContext): Promise<SaleOrder | null>;
  getTicketData(orderId: SaleOrderId, actor: ActorContext): Promise<TicketPrintData>;
}
