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
  | 'takeOwnership'
  | 'quickBatchIntake'
  | 'adjust'
  | 'reconcile'
  | 'createOrder'
  | 'recordPayment'
  | 'deliver'
  | 'cancel';

export type RbacResource =
  | 'Patient'
  | 'Consultation'
  | 'Refraction'
  | 'Prescription'
  | 'FullConsultation'
  | 'SafeSummary'
  | 'Product'
  | 'InventoryMovement'
  | 'SaleOrder';

const grants: Record<Role, Record<RbacResource, RbacAction[]>> = {
  'clinical:optometrist': {
    Patient: ['create', 'update', 'search'],
    Consultation: ['open', 'abandon', 'setNonClinicalNote', 'takeOwnership'],
    Refraction: ['addRefraction', 'amendRefraction'],
    Prescription: ['issuePrescription', 'amendPrescription'],
    FullConsultation: ['read'],
    SafeSummary: ['getSafeSummary', 'listConsultations'],
    Product: ['search', 'read'],
    InventoryMovement: [],
    SaleOrder: ['createOrder', 'read'],
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
  },
  'frontdesk:receptionist': {
    Patient: ['search'],
    Consultation: ['getSafeSummary'],
    Refraction: [],
    Prescription: [],
    FullConsultation: [],
    SafeSummary: ['getSafeSummary', 'listConsultations'],
    Product: ['search', 'read'],
    InventoryMovement: [],
    SaleOrder: ['createOrder', 'read', 'recordPayment', 'deliver'],
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
