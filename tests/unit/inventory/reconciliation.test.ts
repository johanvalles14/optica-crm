import { describe, it, expect } from 'vitest';
import { InventoryService } from '../../../src/modules/inventory/service';
import { inventoryManager } from '../../fixtures/actors';

describe('RF-104 — Reconciliación Rápida de Vitrina por Escaneo Físico', () => {
  const service = new InventoryService();
  const actorMgr = inventoryManager('req-rec-01');

  it('detecta piezas faltantes al comparar códigos escaneados contra stock esperado', async () => {
    // Damos de alta 3 armazones en una vitrina
    const items = await service.quickBatchIntake({
      category: 'frame',
      brand: 'Exhibición Vitrina 1',
      retailPrice: 750,
      quantity: 3,
      branchId: 'branch-001',
    }, actorMgr);

    const code1 = items[0].internalCode;
    const code2 = items[1].internalCode;
    const codeMissing = items[2].internalCode;

    // Supongamos que en el escaneo físico solo se leen 2 armazones
    const scannedCodes = [code1, code2];

    const report = await service.reconcileCount(scannedCodes, 'branch-001', actorMgr);
    expect(report.totalCounted).toBe(2);
    // Verificamos que reporta la pieza no leída como discrepancia
    const missing = report.discrepancies.find((d) => d.internalCode === codeMissing);
    expect(missing).toBeDefined();
    expect(missing?.difference).toBe(-1); // Faltante
  });
});
