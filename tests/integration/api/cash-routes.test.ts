import { describe, it, expect } from 'vitest';
import { POST as postOpenShift, GET as getActiveShift } from '../../../src/app/api/cash/shift/route';
import { POST as postExpense } from '../../../src/app/api/cash/shift/[id]/expense/route';
import { POST as postCloseShift } from '../../../src/app/api/cash/shift/[id]/close/route';
import { GET as getReceivables } from '../../../src/app/api/cash/reports/accounts-receivable/route';

describe('T309..T312 — API Routes de Caja y Arqueo Ciego (SPEC-004)', () => {
  let createdShiftId = '';

  it('POST y GET /api/cash/shift abre y consulta turno activo', async () => {
    const reqOpen = new Request('http://localhost/api/cash/shift', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        branchId: 'branch-api-cash-01',
        initialFloat: 500,
      }),
    });

    const resOpen = await postOpenShift(reqOpen);
    expect(resOpen.status).toBe(201);
    const dataOpen = await resOpen.json();
    expect(dataOpen.shift.status).toBe('open');
    expect(dataOpen.shift.initialFloat).toBe(500);
    createdShiftId = dataOpen.shift.id;

    // GET
    const reqGet = new Request('http://localhost/api/cash/shift?branchId=branch-api-cash-01', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });
    const resGet = await getActiveShift(reqGet);
    expect(resGet.status).toBe(200);
    const dataGet = await resGet.json();
    expect(dataGet.shift.id).toBe(createdShiftId);
  });

  it('POST /api/cash/shift/[id]/expense registra gasto menor de caja chica', async () => {
    const req = new Request(`http://localhost/api/cash/shift/${createdShiftId}/expense`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        amount: 80,
        description: 'Pago de mensajería y entrega urgente',
        receiptNumber: 'VOUCH-881',
      }),
    });

    const res = await postExpense(req, { params: Promise.resolve({ id: createdShiftId }) });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.expense.amount).toBe(80);
    expect(data.expense.description).toContain('mensajería');
  });

  it('POST /api/cash/shift/[id]/close realiza corte y arqueo ciego', async () => {
    // Fondo = 500, Gasto = 80 -> Esperado = $420
    // Cajera declara $420
    const req = new Request(`http://localhost/api/cash/shift/${createdShiftId}/close`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-demo-role': 'frontdesk:receptionist',
      },
      body: JSON.stringify({
        declaredCash: 420,
        notes: 'Corte cuadrado de turno vespertino',
        expectedVersion: 2,
      }),
    });

    const res = await postCloseShift(req, { params: Promise.resolve({ id: createdShiftId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.shift.status).toBe('closed');
    expect(data.shift.expectedCash).toBe(420);
    expect(data.shift.declaredCash).toBe(420);
    expect(data.shift.cashDifference).toBe(0); // Cuadrado
  });

  it('GET /api/cash/reports/accounts-receivable consulta cartera en la calle', async () => {
    const req = new Request('http://localhost/api/cash/reports/accounts-receivable?branchId=branch-api-cash-01', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    });

    const res = await getReceivables(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.report).toBeDefined();
    expect(typeof data.report.totalOutstandingBalance).toBe('number');
  });
});
