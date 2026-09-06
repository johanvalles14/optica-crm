ALTER TABLE "branches"
  ADD COLUMN "nextProductSequence" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "nextSaleSequence" INTEGER NOT NULL DEFAULT 1;

CREATE TYPE "ProductCategory" AS ENUM ('frame', 'lens_blank', 'contact_lens', 'solution', 'accessory', 'lens_service');
CREATE TYPE "MovementType" AS ENUM ('in', 'out', 'adjust');
CREATE TYPE "MovementReason" AS ENUM ('intake_batch', 'intake_individual', 'sale', 'sale_cancelled', 'damage_breakage', 'vendor_return', 'warranty', 'physical_count', 'theft_loss');
CREATE TYPE "OrderStatus" AS ENUM ('quote', 'pending_deposit', 'confirmed_in_process', 'ready_for_delivery', 'delivered_paid', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card_debit', 'card_credit', 'transfer');
CREATE TYPE "SaleItemType" AS ENUM ('frame', 'lens_complete', 'contact_lens', 'accessory', 'service');

CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "internalCode" VARCHAR(16) NOT NULL,
  "vendorBarcode" VARCHAR(64),
  "category" "ProductCategory" NOT NULL,
  "brand" VARCHAR(100),
  "model" VARCHAR(100),
  "color" VARCHAR(60),
  "description" VARCHAR(255),
  "retailPrice" DECIMAL(10,2) NOT NULL,
  "costPrice" DECIMAL(10,2),
  "stock" INTEGER NOT NULL DEFAULT 0,
  "minStockAlert" INTEGER NOT NULL DEFAULT 2,
  "branchId" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_movements" (
  "id" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "branchId" UUID NOT NULL,
  "movementType" "MovementType" NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  "previousStock" INTEGER NOT NULL,
  "newStock" INTEGER NOT NULL,
  "reason" "MovementReason" NOT NULL,
  "notes" VARCHAR(500),
  "actorId" UUID NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sale_orders" (
  "id" UUID NOT NULL,
  "folio" VARCHAR(16) NOT NULL,
  "branchId" UUID NOT NULL,
  "patientId" UUID,
  "prescriptionId" UUID,
  "status" "OrderStatus" NOT NULL DEFAULT 'quote',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "total" DECIMAL(10,2) NOT NULL,
  "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  "balanceDue" DECIMAL(10,2) NOT NULL,
  "promisedDeliveryDate" DATE,
  "deliveredAt" TIMESTAMPTZ(3),
  "notes" VARCHAR(500),
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sale_order_items" (
  "id" UUID NOT NULL,
  "saleOrderId" UUID NOT NULL,
  "productId" UUID,
  "itemType" "SaleItemType" NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "lensConfig" JSONB,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "sale_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" UUID NOT NULL,
  "saleOrderId" UUID NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" VARCHAR(64),
  "receivedBy" UUID NOT NULL,
  "paidAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_internalCode_key" ON "products"("internalCode");
CREATE INDEX "products_branchId_category_idx" ON "products"("branchId", "category");
CREATE INDEX "products_vendorBarcode_idx" ON "products"("vendorBarcode");
CREATE INDEX "products_internalCode_idx" ON "products"("internalCode");
CREATE INDEX "inventory_movements_productId_occurredAt_idx" ON "inventory_movements"("productId", "occurredAt");
CREATE INDEX "inventory_movements_branchId_reason_idx" ON "inventory_movements"("branchId", "reason");
CREATE UNIQUE INDEX "sale_orders_folio_key" ON "sale_orders"("folio");
CREATE INDEX "sale_orders_branchId_status_idx" ON "sale_orders"("branchId", "status");
CREATE INDEX "sale_orders_patientId_idx" ON "sale_orders"("patientId");
CREATE INDEX "sale_orders_folio_idx" ON "sale_orders"("folio");
CREATE INDEX "sale_order_items_saleOrderId_idx" ON "sale_order_items"("saleOrderId");
CREATE INDEX "payments_saleOrderId_idx" ON "payments"("saleOrderId");
CREATE INDEX "payments_receivedBy_paidAt_idx" ON "payments"("receivedBy", "paidAt");

ALTER TABLE "products" ADD CONSTRAINT "products_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_order_items" ADD CONSTRAINT "sale_order_items_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_order_items" ADD CONSTRAINT "sale_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
