import { describe, it, expect } from 'vitest';
import { InventoryService } from '../../../src/modules/inventory/service';
import { inventoryManager, receptionist } from '../../fixtures/actors';

describe('RF-101, RF-102 — Alta Rápida de Inventario Caótico (Fast-Intake)', () => {
  const service = new InventoryService();
  const actorMgr = inventoryManager('req-intake-01');

  it('genera códigos secuenciales únicos para un lote de armazones sin código de proveedor', async () => {
    const products = await service.quickBatchIntake({
      category: 'frame',
      brand: 'Genérico Proveedor A',
      descriptionPattern: 'Armazón metálico económico',
      retailPrice: 850,
      costPrice: 220,
      quantity: 5,
      branchId: 'branch-001',
    }, actorMgr);

    expect(products).toHaveLength(5);
    const codes = products.map((p) => p.internalCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(5);

    for (const p of products) {
      expect(p.internalCode).toMatch(/^ARM-[0-9]{4,}$/);
      expect(p.stock).toBe(1);
      expect(p.retailPrice).toBe(850);
      expect(p.active).toBe(true);
    }
  });

  it('rechaza alta de lote con cantidad menor o igual a cero', async () => {
    await expect(
      service.quickBatchIntake({
        category: 'frame',
        retailPrice: 500,
        quantity: 0,
        branchId: 'branch-001',
      }, actorMgr)
    ).rejects.toThrow(/cantidad/i);
  });

  it('rechaza alta si el precio de venta es menor a cero', async () => {
    await expect(
      service.quickBatchIntake({
        category: 'frame',
        retailPrice: -50,
        quantity: 3,
        branchId: 'branch-001',
      }, actorMgr)
    ).rejects.toThrow(/precio/i);
  });

  it('oculta el costo de adquisición al rol de mostrador (receptionist)', async () => {
    const actorRec = receptionist('req-intake-02');
    const results = await service.search({ branchId: 'branch-001' }, actorRec);
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.costPrice).toBeUndefined();
      expect(p.retailPrice).toBeDefined();
    }
  });
});
