import { NextResponse } from 'next/server';
import { actorFromRequest } from '../../../../lib/request-context';
import { billingService } from '../../../../lib/services';
import { billingRepository } from '../../../../modules/billing/repository';
import type { IssueInvoiceInput } from '../../../../../contracts/billing.contract';

export async function GET(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const url = new URL(request.url);
    const branchId = url.searchParams.get('branchId') ?? undefined;

    const invoices = billingRepository.listInvoices(branchId);
    return NextResponse.json({ invoices });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al listar facturas';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = actorFromRequest(request);
    const body = (await request.json()) as IssueInvoiceInput;

    const invoice = await billingService.issueInvoice(body, actor);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al emitir factura';
    const status = message.toLowerCase().includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
