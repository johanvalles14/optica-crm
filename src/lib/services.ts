import { PatientService } from '../modules/patients/service';
import { ClinicalService } from '../modules/clinical/service';
import { PrismaPatientRepository } from '../modules/patients/prisma-repository';
import { InventoryService } from '../modules/inventory/service';
import { SalesService } from '../modules/sales/service';

export const patientService = new PatientService();
export const clinicalService = new ClinicalService();
export const prismaPatientRepository = new PrismaPatientRepository();
export const inventoryService = new InventoryService();
export const salesService = new SalesService();
