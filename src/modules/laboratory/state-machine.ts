import type { LabOrderStatus } from '../../../contracts/laboratory.contract';

export type LabAction =
  | 'start_process'
  | 'send_qc'
  | 'approve'
  | 'reject'
  | 'report_damage'
  | 'restart'
  | 'cancel';

const transitions: Record<LabOrderStatus, Record<LabAction, LabOrderStatus | undefined>> = {
  queued: {
    start_process: 'in_process',
    send_qc: undefined,
    approve: undefined,
    reject: undefined,
    report_damage: 'rework_needed',
    restart: undefined,
    cancel: 'cancelled',
  },
  in_process: {
    start_process: undefined,
    send_qc: 'quality_control',
    approve: 'completed', // Permite 1-clic directo desde en proceso si ya se verificó
    reject: 'rework_needed',
    report_damage: 'rework_needed',
    restart: undefined,
    cancel: 'cancelled',
  },
  quality_control: {
    start_process: undefined,
    send_qc: undefined,
    approve: 'completed',
    reject: 'rework_needed',
    report_damage: 'rework_needed',
    restart: undefined,
    cancel: 'cancelled',
  },
  rework_needed: {
    start_process: undefined,
    send_qc: undefined,
    approve: 'completed',
    reject: undefined,
    report_damage: undefined,
    restart: 'in_process',
    cancel: 'cancelled',
  },
  completed: {
    start_process: undefined,
    send_qc: undefined,
    approve: undefined,
    reject: undefined,
    report_damage: undefined,
    restart: undefined,
    cancel: undefined,
  },
  cancelled: {
    start_process: undefined,
    send_qc: undefined,
    approve: undefined,
    reject: undefined,
    report_damage: undefined,
    restart: undefined,
    cancel: undefined,
  },
};

export class LabStateMachine {
  canTransition(from: LabOrderStatus, action: LabAction): boolean {
    return transitions[from][action] !== undefined;
  }

  transition(from: LabOrderStatus, action: LabAction): LabOrderStatus {
    const to = transitions[from][action];
    if (!to) {
      throw new Error(`Invalid transition ${action} from ${from}`);
    }
    return to;
  }

  isFinal(status: LabOrderStatus): boolean {
    return status === 'completed' || status === 'cancelled';
  }
}
