# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Optometrists capture clinical consultations from a tablet in the examination room. Receptionists receive completed consultations at the front desk and prepare optical quotations and sales orders.

## Product Purpose

Optica CRM connects the clinical consultation with the commercial workflow so a prescription completed in the examination room is immediately actionable at reception.

## Operating Context

The application is used during in-person optical appointments across a tablet in the examination room and a desktop or tablet at reception. The operational sequence is patient search, consultation, refraction, diagnosis, prescription, reception handoff, quotation, payment, and fulfillment.

## Capabilities and Constraints

- A completed prescription enters a reception queue for quotation.
- Reception currently needs access to the complete clinical and patient data for the quotation workflow. This temporary policy must remain isolated in RBAC for later reversal.
- A quotation must not reduce inventory; inventory is committed only when a payment confirms the order.
- The existing application uses Next.js, Prisma, and a temporary demo role mechanism during local development.

## Brand Commitments

Use the existing Optica CRM visual language and Spanish operational terminology.

## Evidence on Hand

Clinical, patient, sales, inventory, and role modules are implemented under `src/modules/`; the existing interface is in `src/app/`.

## Product Principles

- Make the handoff from clinical work to reception explicit and automatic.
- Preserve patient and prescription linkage through quotation and sale.
- Prevent accidental inventory commitments during quotation.
- Keep tablet interactions legible, touch-friendly, and role-focused.
