/**
 * Contrato del módulo billing para SPEC-005.
 * Define operaciones de timbrado fiscal CFDI 4.0 con PAC (FacturAPI).
 */

import type { ActorContext, UserId } from './auth.contract';
import type { BranchId } from './patients.contract';
import type { SaleOrderFolio, SaleOrderId } from './sales.contract';

export type InvoiceId = string;
export type SatUuid = string; // UUID de 36 caracteres emitido por el SAT

export type TaxSystem =
  | '605' // Sueldos y Salarios e Ingresos Asimilados a Salarios
  | '612' // Personas Físicas con Actividades Empresariales y Profesionales
  | '626' // Régimen Simplificado de Confianza (RESICO)
  | '601' // General de Ley Personas Morales
  | '603' // Personas Morales con Fines no Lucrativos
  | '616' // Sin obligaciones fiscales
  | '625'; // Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas

export type CfdiUse =
  | 'D07' // Gastos médicos por lentes ópticos graduados (Deducción personal)
  | 'G03' // Gastos en general
  | 'G01' // Adquisición de mercancías
  | 'S01' // Sin efectos fiscales
  | 'CP01'; // Pagos

export type PaymentFormSat =
  | '01' // Efectivo
  | '03' // Transferencia electrónica de fondos
  | '04' // Tarjeta de crédito
  | '28' // Tarjeta de débito
  | '99'; // Por definir

export type InvoiceStatus = 'issued' | 'cancelled';

export type CancellationMotive = '01' | '02' | '03' | '04';

export interface TaxProfileInput {
  rfc: string;
  legalName: string;
  zipCode: string; // Código postal del domicilio fiscal (5 dígitos)
  taxSystem: TaxSystem;
  cfdiUse?: CfdiUse;
  email?: string;
}

export interface Invoice {
  id: InvoiceId;
  saleOrderId: SaleOrderId;
  saleOrderFolio: SaleOrderFolio;
  branchId: BranchId;
  uuid: SatUuid;
  folio: string; // Ej. FAC-00104
  rfc: string;
  legalName: string;
  zipCode: string;
  taxSystem: TaxSystem;
  cfdiUse: CfdiUse;
  paymentFormSat: PaymentFormSat;
  subtotal: number;
  tax: number; // IVA trasladado 16%
  total: number;
  status: InvoiceStatus;
  issuedAt: Date;
  cancelledAt?: Date;
  cancellationMotive?: CancellationMotive;
  xmlContent?: string;
  pdfUrl?: string;
  satVerificationUrl?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueInvoiceInput {
  saleOrderId: SaleOrderId;
  taxProfile: TaxProfileInput;
}

export interface CancelInvoiceInput {
  invoiceId: InvoiceId;
  motive: CancellationMotive;
  replacementUuid?: string;
  expectedVersion: number;
}

export interface IBillingService {
  issueInvoice(input: IssueInvoiceInput, actor: ActorContext): Promise<Invoice>;
  getInvoice(invoiceId: InvoiceId, actor: ActorContext): Promise<Invoice | null>;
  getInvoiceBySaleOrder(saleOrderId: SaleOrderId, actor: ActorContext): Promise<Invoice | null>;
  getXml(invoiceId: InvoiceId, actor: ActorContext): Promise<string>;
  cancelInvoice(input: CancelInvoiceInput, actor: ActorContext): Promise<Invoice>;
}
