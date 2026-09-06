import { describe, it, expect } from 'vitest';
import { ConsultationStateMachine } from '../../../src/modules/clinical/state-machine';

describe('RF-005 — Máquina de estados de consulta', () => {
  const machine = new ConsultationStateMachine();

  it('permite in_progress → closed vía issuePrescription', () => {
    expect(machine.canTransition('in_progress', 'issuePrescription')).toBe(true);
  });

  it('permite in_progress → abandoned vía abandon', () => {
    expect(machine.canTransition('in_progress', 'abandon')).toBe(true);
  });

  it('no permite transiciones desde closed', () => {
    expect(machine.canTransition('closed', 'issuePrescription')).toBe(false);
    expect(machine.canTransition('closed', 'abandon')).toBe(false);
  });

  it('no permite transiciones desde abandoned', () => {
    expect(machine.canTransition('abandoned', 'issuePrescription')).toBe(false);
    expect(machine.canTransition('abandoned', 'abandon')).toBe(false);
  });

  it('no permite volver a in_progress desde cualquier estado', () => {
    expect(machine.canTransition('in_progress', 'open')).toBe(false);
    expect(machine.canTransition('closed', 'open')).toBe(false);
    expect(machine.canTransition('abandoned', 'open')).toBe(false);
  });

  it('lista los estados finales', () => {
    expect(machine.isFinal('closed')).toBe(true);
    expect(machine.isFinal('abandoned')).toBe(true);
    expect(machine.isFinal('in_progress')).toBe(false);
  });
});
