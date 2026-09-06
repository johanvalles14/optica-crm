import type { ConsultationStatus } from '../../../contracts/clinical.contract';

export type TransitionAction = 'open' | 'issuePrescription' | 'abandon';

const transitions: Record<ConsultationStatus, Record<TransitionAction, ConsultationStatus | undefined>> = {
  in_progress: {
    open: undefined,
    issuePrescription: 'closed',
    abandon: 'abandoned',
  },
  closed: {
    open: undefined,
    issuePrescription: undefined,
    abandon: undefined,
  },
  abandoned: {
    open: undefined,
    issuePrescription: undefined,
    abandon: undefined,
  },
};

const finalStates: ConsultationStatus[] = ['closed', 'abandoned'];

export class ConsultationStateMachine {
  canTransition(
    from: ConsultationStatus,
    action: TransitionAction
  ): boolean {
    return transitions[from][action] !== undefined;
  }

  transition(
    from: ConsultationStatus,
    action: TransitionAction
  ): ConsultationStatus {
    const to = transitions[from][action];
    if (!to) {
      throw new Error(
        `Invalid transition ${action} from ${from}`
      );
    }
    return to;
  }

  isFinal(status: ConsultationStatus): boolean {
    return finalStates.includes(status);
  }
}
