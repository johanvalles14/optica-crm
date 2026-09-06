import type { OrderStatus } from '../../../contracts/sales.contract';

export type OrderAction =
  | 'request_deposit'
  | 'receive_deposit'
  | 'mark_ready'
  | 'deliver'
  | 'cancel';

const transitions: Record<OrderStatus, Record<OrderAction, OrderStatus | undefined>> = {
  quote: {
    request_deposit: 'pending_deposit',
    receive_deposit: 'confirmed_in_process',
    mark_ready: undefined,
    deliver: undefined,
    cancel: 'cancelled',
  },
  pending_deposit: {
    request_deposit: undefined,
    receive_deposit: 'confirmed_in_process',
    mark_ready: undefined,
    deliver: undefined,
    cancel: 'cancelled',
  },
  confirmed_in_process: {
    request_deposit: undefined,
    receive_deposit: undefined,
    mark_ready: 'ready_for_delivery',
    deliver: undefined,
    cancel: 'cancelled',
  },
  ready_for_delivery: {
    request_deposit: undefined,
    receive_deposit: undefined,
    mark_ready: undefined,
    deliver: 'delivered_paid',
    cancel: 'cancelled',
  },
  delivered_paid: {
    request_deposit: undefined,
    receive_deposit: undefined,
    mark_ready: undefined,
    deliver: undefined,
    cancel: undefined,
  },
  cancelled: {
    request_deposit: undefined,
    receive_deposit: undefined,
    mark_ready: undefined,
    deliver: undefined,
    cancel: undefined,
  },
};

const finalStates: OrderStatus[] = ['delivered_paid', 'cancelled'];

export class OrderStateMachine {
  canTransition(from: OrderStatus, action: OrderAction): boolean {
    return transitions[from][action] !== undefined;
  }

  transition(from: OrderStatus, action: OrderAction): OrderStatus {
    const to = transitions[from][action];
    if (!to) {
      throw new Error(`Invalid transition ${action} from ${from}`);
    }
    return to;
  }

  isFinal(status: OrderStatus): boolean {
    return finalStates.includes(status);
  }
}
