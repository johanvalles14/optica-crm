import { describe, it, expect } from 'vitest';
import { GET as getPrivacyNotice } from '../../../src/app/api/privacy-notice/route';
import { GET as getConsent, POST as postConsent } from '../../../src/app/api/patients/[folio]/consent/route';
import { POST as postPatient, PATCH as patchPatient } from '../../../src/app/api/patients/route';
import { GET as searchPatients } from '../../../src/app/api/patients/search/route';
import { POST as openConsultation } from '../../../src/app/api/consultations/route';
import { GET as getConsultation, PATCH as patchConsultation } from '../../../src/app/api/consultations/[id]/route';
import { POST as postRefraction, PATCH as patchRefraction } from '../../../src/app/api/consultations/[id]/refraction/route';
import { POST as postPrescription } from '../../../src/app/api/consultations/[id]/prescription/route';
import { PATCH as patchNonClinicalNote } from '../../../src/app/api/consultations/[id]/non-clinical-note/route';
import { GET as getFrontdeskSummary } from '../../../src/app/api/frontdesk/summary/route';

describe('T041 — API Routes & HTTP Contracts de SPEC-001', () => {
  it('GET /api/privacy-notice devuelve el aviso vigente', async () => {
    const res = await getPrivacyNotice();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notice).toBeDefined();
    expect(data.notice.id).toBe('notice-v2-2026');
  });

  it('GET y POST /api/patients/[folio]/consent verifica y registra consentimiento', async () => {
    // GET
    const reqGet = new Request('http://localhost/api/patients/PT000002/consent', {
      headers: { 'x-demo-role': 'clinical:optometrist' },
    });
    const resGet = await getConsent(reqGet, { params: Promise.resolve({ folio: 'PT000002' }) });
    expect(resGet.status).toBe(200);
    const dataGet = await resGet.json();
    expect(dataGet.patientId).toBe('patient-002');
    expect(typeof dataGet.valid).toBe('boolean');

    // POST
    const reqPost = new Request('http://localhost/api/patients/PT000002/consent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'clinical:optometrist',
        'x-actor-id': 'user-opt-001',
      },
      body: JSON.stringify({ source: 'tablet-gabinete' }),
    });
    const resPost = await postConsent(reqPost, { params: Promise.resolve({ folio: 'PT000002' }) });
    expect(resPost.status).toBe(201);
    const dataPost = await resPost.json();
    expect(dataPost.consent).toBeDefined();
    expect(dataPost.consent.patientId).toBe('patient-002');
  });

  it('GET /api/patients/search retorna solo campos de lista blanca', async () => {
    const req = new Request('http://localhost/api/patients/search?name=Garcia', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const res = await searchPatients(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toBeInstanceOf(Array);
    if (data.results.length > 0) {
      const item = data.results[0];
      expect(item).toHaveProperty('folio');
      expect(item).toHaveProperty('fullName');
      expect(item).toHaveProperty('maskedPhone');
      expect(item).not.toHaveProperty('sphere');
      expect(item).not.toHaveProperty('diagnosis');
    }
  });

  it('GET /api/consultations/[id] protege datos clínicos ante recepcionista (403 con view=full)', async () => {
    const req = new Request('http://localhost/api/consultations/consultation-001?view=full', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const res = await getConsultation(req, { params: Promise.resolve({ id: 'consultation-001' }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/no autorizado/i);
  });

  it('GET /api/consultations/[id] permite resumen seguro a recepcionista', async () => {
    const req = new Request('http://localhost/api/consultations/consultation-001', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const res = await getConsultation(req, { params: Promise.resolve({ id: 'consultation-001' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.folio).toBeDefined();
    expect(data.patientName).toBeDefined();
    expect(data).not.toHaveProperty('refractions');
  });

  it('POST /api/consultations/[id]/refraction agrega refracción OD/OI', async () => {
    const req = new Request('http://localhost/api/consultations/consultation-001/refraction', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'clinical:optometrist',
        'x-actor-id': 'user-opt-001',
      },
      body: JSON.stringify({
        eye: 'OD',
        sphere: -1.25,
        cylinder: -0.5,
        axis: 180,
        expectedVersion: 1,
      }),
    });
    const res = await postRefraction(req, { params: Promise.resolve({ id: 'consultation-001' }) });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.refraction).toBeDefined();
    expect(data.refraction.eye).toBe('OD');
    expect(data.refraction.sphere).toBe(-1.25);
  });

  it('PATCH /api/consultations/[id]/non-clinical-note asigna nota de catálogo cerrado', async () => {
    const req = new Request('http://localhost/api/consultations/consultation-001/non-clinical-note', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'clinical:optometrist',
        'x-actor-id': 'user-opt-001',
      },
      body: JSON.stringify({
        noteKey: 'follow_up',
        expectedVersion: 1,
      }),
    });
    const res = await patchNonClinicalNote(req, { params: Promise.resolve({ id: 'consultation-001' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.consultation.nonClinicalNoteKey).toBe('follow_up');
  });

  it('GET /api/frontdesk/summary consulta resumen por folio', async () => {
    const req = new Request('http://localhost/api/frontdesk/summary?folio=PT000002', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const res = await getFrontdeskSummary(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.folio).toBe('PT000002');
  });
});
