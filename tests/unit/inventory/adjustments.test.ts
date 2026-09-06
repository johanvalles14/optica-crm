import { describe, it, expect } from 'vitest';
import { InventoryService } from '../../../src/modules/inventory/service';
import { inventoryManager } from '../../fixtures/actors';

describe('RF-104, RF-110 — Bajas por Merma, Rotura y Ajustes de Stock', () => {
  const service = new InventoryService();
  const actorMgr = inventoryManager('req-adj-01');

  it('descuenta inventario y crea movimiento inmutable al registrar rotura en taller', async () => {
    // Primero damos de alta una pieza
    const [item] = await service.quickBatchIntake({
      category: 'frame',
      brand: 'Titanio Flex',
      retailPrice: 1200,
      quantity: 1,
      branchId: 'branch-001',
    }, actorMgr);

    expect(item.stock).toBe(1);

    // Registramos la baja por rotura
    const movement = await service.recordAdjustment({
      productId: item.id,
      quantity: -1,
      reason: 'damage_breakage',
      notes: 'Biseladora fracturó puente nasal en taller',
    }, actorMgr);

    expect(movement.previousStock).toBe(1);
    expect(movement.newStock).toBe(0);
    expect(movement.quantityChange).toBe(-1);
    expect(movement.reason).toBe('damage_breakage');
    expect(movement.notes).toContain('Biseladora');

    // Verificamos que el producto ahora tiene stock 0
    const updated = await service.findByCode(item.internalCode, 'branch-001', actorMgr);
    expect(updated?.stock).toBe(0);
  });

  it('rechaza ajuste sin justificación o notas explicativas', async () => {
    const [item] = await service.quickBatchIntake({
      category: 'accessory',
      retailPrice: 60,
      quantity: 5,
      branchId: 'branch-001',
    }, actorMgr);

    await expect(
      service.recordAdjustment({
        productId: item.id,
        quantity: -1,
        reason: 'damage_breakage',
        notes: '', // Vacío
      }, actorMgr)
    ).rejects.toThrow(/motivo|justificaci[oó]n|nota/i);
  });

  it('rechaza descontar más unidades de las disponibles en inventario', async () => {
    const [item] = await service.quickBatchIntake({
      category: 'frame',
      retailPrice: 900,
      quantity: 2,
      branchId: 'branch-001',
    }, actorMgr);

    await expect(
      service.recordAdjustment({
        productId: item.id,
        quantity: -5,
        reason: 'theft_loss',
        notes: 'Faltante reportado en vitrina',
      }, actorMgr)
    ).rejects.toThrow(/stock insuficiente|disponible/i);
  });
});
