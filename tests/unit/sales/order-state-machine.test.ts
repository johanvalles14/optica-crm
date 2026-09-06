import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../../../src/modules/sales/state-machine';

describe('RF-106 — Máquina de Estados de Órdenes de Venta', () => {
  const sm = new OrderStateMachine();

  it('permite transicionar de cotización a pendiente de anticipo', () => {
    expect(sm.canTransition('quote', 'request_deposit')).toBe(true);
    expect(sm.transition('quote', 'request_deposit')).toBe('pending_deposit');
  });

  it('permite confirmar orden al recibir anticipo', () => {
    expect(sm.canTransition('pending_deposit', 'receive_deposit')).toBe(true);
    expect(sm.transition('pending_deposit', 'receive_deposit')).toBe('confirmed_in_process');
  });

  it('permite marcar orden como lista para entrega', () => {
    expect(sm.canTransition('confirmed_in_process', 'mark_ready')).toBe(true);
    expect(sm.transition('confirmed_in_process', 'mark_ready')).toBe('ready_for_delivery');
  });

  it('permite entregar orden liquidada', () => {
    expect(sm.canTransition('ready_for_delivery', 'deliver')).toBe(true);
    expect(sm.transition('ready_for_delivery', 'deliver')).toBe('delivered_paid');
  });

  it('impide transiciones desde estado entregado o cancelado', () => {
    expect(sm.isFinal('delivered_paid')).toBe(true);
    expect(sm.isFinal('cancelled')).toBe(true);
    expect(sm.canTransition('delivered_paid', 'cancel')).toBe(false);
    expect(() => sm.transition('delivered_paid', 'cancel')).toThrow(/invalid transition/i);
  });
});
