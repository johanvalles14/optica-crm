import type { Role } from '../../../contracts/auth.contract';

export type RbacAction =
  | 'create'
  | 'update'
  | 'search'
  | 'read'
  | 'open'
  | 'abandon'
  | 'releaseConsultation'
  | 'addRefraction'
  | 'amendRefraction'
  | 'issuePrescription'
  | 'amendPrescription'
  | 'getSafeSummary'
  | 'listConsultations'
  | 'setNonClinicalNote'
  | 'updateClinicalDetails'
  | 'takeOwnership'
  | 'quickBatchIntake'
  | 'adjust'
  | 'reconcile'
  | 'createOrder'
  | 'recordPayment'
  | 'deliver'
  | 'cancel'
  | 'approveQuality'
  | 'reportRework'
  | 'openShift'
  | 'recordExpense'
  | 'closeShift'
  | 'issueInvoice'
  | 'cancelInvoice'
  | 'readInvoice';

export type RbacResource =
  | 'Patient'
  | 'Consultation'
  | 'Refraction'
  | 'Prescription'
  | 'FullConsultation'
  | 'SafeSummary'
  | 'Product'
  | 'InventoryMovement'
  | 'SaleOrder'
  | 'LabOrder'
  | 'CashShift'
  | 'Invoice';

const grants: Record<Role, Record<RbacResource, RbacAction[]>> = {
  'clinical:optometrist': {
    Patient: ['create', 'update', 'search'],
    Consultation: ['open', 'abandon', 'setNonClinicalNote', 'updateClinicalDetails', 'takeOwnership'],
    Refraction: ['addRefraction', 'amendRefraction'],
    Prescription: ['issuePrescription', 'amendPrescription'],
    FullConsultation: ['read'],
    SafeSummary: ['getSafeSummary', 'listConsultations'],
    Product: ['search', 'read'],
    InventoryMovement: [],
    SaleOrder: ['createOrder', 'read'],
    LabOrder: ['read'],
    CashShift: [],
    Invoice: ['readInvoice'],
  },
  'clinical:assistant': {
    Patient: ['create', 'update', 'search'],
    Consultation: [],
    Refraction: [],
    Prescription: [],
    FullConsultation: [],
    SafeSummary: ['getSafeSummary', 'listConsultations'],
    Product: ['search', 'read'],
    InventoryMovement: [],
    SaleOrder: [],
    LabOrder: ['read'],
    CashShift: [],
    Invoice: [],
  },
  'frontdesk:receptionist': {
    Patient: ['search'],
    Consultation: ['getSafeSummary'],
    Refraction: [],
    Prescription: ['read'],
    FullConsultation: [],
    SafeSummary: ['getSafeSummary', 'listConsultations'],
    Product: ['search', 'read'],
    InventoryMovement: [],
    SaleOrder: ['createOrder', 'read', 'recordPayment', 'deliver'],
    LabOrder: ['read', 'create'],
    CashShift: ['openShift', 'recordExpense', 'closeShift', 'read'],
    Invoice: ['issueInvoice', 'readInvoice'],
  },
  'inventory:manager': {
    Patient: ['search'],
    Consultation: [],
    Refraction: [],
    Prescription: [],
    FullConsultation: [],
    SafeSummary: [],
    Product: ['create', 'update', 'search', 'read', 'quickBatchIntake'],
    InventoryMovement: ['adjust', 'read', 'reconcile'],
    SaleOrder: ['read'],
    LabOrder: ['read'],
    CashShift: [],
    Invoice: [],
  },
  'laboratory:technician': {
    Patient: [],
    Consultation: [],
    Refraction: [],
    Prescription: [],
    FullConsultation: [],
    SafeSummary: [],
    Product: ['read', 'search'],
    InventoryMovement: ['adjust', 'read'],
    SaleOrder: ['read'],
    LabOrder: ['read', 'create', 'update', 'approveQuality', 'reportRework'],
    CashShift: [],
    Invoice: [],
  },
  admin: {
    Patient: ['search'],
    Consultation: ['releaseConsultation'],
    Refraction: [],
    Prescription: [],
    FullConsultation: [],
    SafeSummary: ['getSafeSummary', 'listConsultations'],
    Product: ['create', 'update', 'search', 'read', 'quickBatchIntake'],
    InventoryMovement: ['adjust', 'read', 'reconcile'],
    SaleOrder: ['createOrder', 'read', 'recordPayment', 'deliver', 'cancel'],
    LabOrder: ['read', 'create', 'update', 'approveQuality', 'reportRework', 'cancel'],
    CashShift: ['openShift', 'recordExpense', 'closeShift', 'read'],
    Invoice: ['issueInvoice', 'readInvoice', 'cancelInvoice'],
  },
};

export function authorize(
  role: Role,
  action: string,
  resource: string
): boolean {
  const resourceGrants = grants[role]?.[resource as RbacResource];
  if (!resourceGrants) return false;
  return resourceGrants.includes(action as RbacAction);
}
