import { describe, expect, it } from 'vitest';
import { GET as getReceptionQueue } from '../../../src/app/api/frontdesk/queue/route';
import { clinicalService, patientService, salesService } from '../../../src/lib/services';
import { inventoryRepository } from '../../../src/modules/inventory/repository';
import { patientRepository } from '../../../src/modules/patients/repository';
import { optometrist, receptionist } from '../../fixtures/actors';
import { validLeftEye, validRightEye } from '../../fixtures/refractions';

describe('Flujo gabinete a recepción y cotización', () => {
  it('envía una receta cerrada a recepción, crea una cotización vinculada y solo descuenta stock al anticipo', async () => {
    const actorOpt = optometrist('req-handoff-opt');
    const actorRec = receptionist('req-handoff-rec');
    const patient = await patientService.create({
      branchId: 'branch-001',
      firstName: 'Mariana',
      lastName: 'Salcedo',
      birthDate: new Date('1988-05-14'),
      sex: 'female',
      phone: '8715551234',
      email: 'mariana@example.test',
      allergies: 'Sin alergias conocidas',
      conditions: 'Antecedente de miopía',
    }, actorOpt);
    await patientService.recordConsent({
      patientId: patient.id,
      noticeId: patientRepository.getCurrentPrivacyNotice().id,
      source: 'tablet-gabinete',
    }, actorOpt);

    const consultation = await clinicalService.open({ patientId: patient.id, branchId: 'branch-001' }, actorOpt);
    const withClinicalDetails = await clinicalService.updateClinicalDetails({
      consultationId: consultation.id,
      diagnosis: 'Miopía con astigmatismo leve',
      clinicalNotes: 'Sugerir antirreflejante y filtro azul para trabajo en pantalla.',
      expectedVersion: consultation.version,
    }, actorOpt);
    await clinicalService.addRefraction({
      consultationId: consultation.id,
      ...validRightEye,
      expectedVersion: withClinicalDetails.version,
    }, actorOpt);
    await clinicalService.addRefraction({
      consultationId: consultation.id,
      ...validLeftEye,
      expectedVersion: withClinicalDetails.version,
    }, actorOpt);
    const prescription = await clinicalService.issuePrescription({
      consultationId: consultation.id,
      usage: 'progresivo',
      observations: 'Filtro azul recomendado',
      expectedVersion: withClinicalDetails.version,
    }, actorOpt);

    const queueResponse = await getReceptionQueue(new Request('http://localhost/api/frontdesk/queue', {
      headers: { 'x-demo-role': 'frontdesk:receptionist', 'x-actor-id': actorRec.actorId },
    }));
    expect(queueResponse.status).toBe(200);
    const queuePayload = await queueResponse.json() as { queue: Array<{ prescription: { id: string }; consultation: { diagnosis?: string }; patient: { id: string; phone: string } }> };
    const handoff = queuePayload.queue.find((entry) => entry.prescription.id === prescription.id);
    expect(handoff?.patient.id).toBe(patient.id);
    expect(handoff?.patient.phone).toBe(patient.phone);
    expect(handoff?.consultation.diagnosis).toBe('Miopía con astigmatismo leve');

    const frame = inventoryRepository.getProduct('prod-001');
    expect(frame).toBeDefined();
    const stockBeforeQuote = frame!.stock;
    const quote = await salesService.createOrder({
      branchId: 'branch-001',
      patientId: patient.id,
      patientName: 'Mariana Salcedo',
      prescriptionId: prescription.id,
      items: [{
        itemType: 'frame',
        productId: frame!.id,
        description: 'Armazón para cotización',
        quantity: 1,
        unitPrice: frame!.retailPrice,
      }],
    }, actorRec);
    expect(quote.status).toBe('quote');
    expect(inventoryRepository.getProduct(frame!.id)?.stock).toBe(stockBeforeQuote);

    await expect(salesService.createOrder({
      branchId: 'branch-001',
      prescriptionId: prescription.id,
      items: [{ itemType: 'service', description: 'Cotización duplicada', quantity: 1, unitPrice: 0 }],
    }, actorRec)).rejects.toThrow(/cotización u orden activa/i);

    const afterQuoteQueue = await clinicalService.listReceptionQueue(actorRec);
    expect(afterQuoteQueue.some((entry) => entry.prescription.id === prescription.id)).toBe(false);

    const confirmed = await salesService.recordPayment({
      orderId: quote.id,
      amount: 500,
      method: 'cash',
      expectedVersion: quote.version,
    }, actorRec);
    expect(confirmed.status).toBe('confirmed_in_process');
    expect(inventoryRepository.getProduct(frame!.id)?.stock).toBe(stockBeforeQuote - 1);
  });
});
