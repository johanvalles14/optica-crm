/**
 * Contrato del módulo laboratory para SPEC-003.
 * Define operaciones del taller de biselado, maquila externa y control de calidad.
 */

import type { ActorContext, UserId } from './auth.contract';
import type { BranchId, Folio } from './patients.contract';
import type { SaleOrderFolio, SaleOrderId } from './sales.contract';

export type LabOrderId = string;
export type LabOrderFolio = string; // Ej. LAB-00042

export type LabDestination = 'internal_workshop' | 'external_lab';

export type LabOrderStatus =
  | 'queued'            // En cola de espera
  | 'in_process'         // En proceso de biselado o enviado a maquila
  | 'quality_control'    // En estación de revisión / frontofocómetro
  | 'completed'          // Control de calidad aprobado (listo para entrega)
  | 'rework_needed'      // Repetición por rotura o fuera de tolerancia
  | 'cancelled';         // Cancelado

export type FrameMountingType =
  | 'full_rim'             // Aro completo (acetato / metal)
  | 'semi_rimless_groove'  // Ranurado (nylor / hilo)
  | 'rimless_drill';       // Al aire (tres piezas / perforado)

export interface EyeLabData {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  pupillaryDistance?: number;
  opticalCenterHeight?: number; // Altura focal / oblea en mm
}

export interface LabOrder {
  id: LabOrderId;
  folio: LabOrderFolio;
  saleOrderId: SaleOrderId;
  saleOrderFolio: SaleOrderFolio;
  branchId: BranchId;
  patientName: string;
  destination: LabDestination;
  externalLabName?: string;
  externalGuideNumber?: string;
  expectedReturnDate?: Date;
  status: LabOrderStatus;
  frameCode: string;
  frameDescription?: string;
  frameMountingType: FrameMountingType;
  lensMaterial: string;
  treatments: string[];
  rightEye: EyeLabData;
  leftEye: EyeLabData;
  observations?: string;
  assignedTechnicianId?: UserId;
  qualityApprovedAt?: Date;
  qualityApprovedBy?: UserId;
  reworkReason?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabOrderInput {
  saleOrderId: SaleOrderId;
  saleOrderFolio: SaleOrderFolio;
  branchId: BranchId;
  patientName: string;
  destination?: LabDestination;
  frameCode: string;
  frameDescription?: string;
  frameMountingType?: FrameMountingType;
  lensMaterial: string;
  treatments?: string[];
  rightEye: EyeLabData;
  leftEye: EyeLabData;
  observations?: string;
  expectedReturnDate?: Date;
}

export interface AssignLabDestinationInput {
  labOrderId: LabOrderId;
  destination: LabDestination;
  externalLabName?: string;
  externalGuideNumber?: string;
  expectedReturnDate?: Date;
  expectedVersion: number;
}

export interface ReportReworkInput {
  labOrderId: LabOrderId;
  reason: string;
  brokenProductId?: string; // Si se quebró un armazón o mica del inventario
  brokenQuantity?: number;
  additionalDeliveryDays?: number;
  expectedVersion: number;
}

export interface TraySlipData {
  labOrderFolio: LabOrderFolio;
  saleOrderFolio: SaleOrderFolio;
  patientName: string;
  date: Date;
  frameCode: string;
  frameMountingType: string;
  lensMaterial: string;
  treatmentsText: string;
  rightEye: EyeLabData;
  leftEye: EyeLabData;
  destinationText: string;
  observations?: string;
}

export interface ILaboratoryService {
  createOrder(input: CreateLabOrderInput, actor: ActorContext): Promise<LabOrder>;
  assignDestination(input: AssignLabDestinationInput, actor: ActorContext): Promise<LabOrder>;
  updateStatus(labOrderId: LabOrderId, newStatus: LabOrderStatus, expectedVersion: number, actor: ActorContext): Promise<LabOrder>;
  approveQuality(labOrderId: LabOrderId, expectedVersion: number, actor: ActorContext): Promise<LabOrder>;
  reportRework(input: ReportReworkInput, actor: ActorContext): Promise<LabOrder>;
  getOrder(labOrderId: LabOrderId, actor: ActorContext): Promise<LabOrder | null>;
  listOrders(branchId: BranchId, actor: ActorContext): Promise<LabOrder[]>;
  getTraySlip(labOrderId: LabOrderId, actor: ActorContext): Promise<TraySlipData>;
}
