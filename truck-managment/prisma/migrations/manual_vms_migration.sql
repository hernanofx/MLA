-- VMS Module Migration
-- Agregar campo providerId a User si no existe
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "providerId" TEXT;

-- Crear enums
DO $$ BEGIN
  CREATE TYPE "ShipmentStatus" AS ENUM ('PRE_ALERTA', 'PRE_RUTEO', 'VERIFICACION', 'FINALIZADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('OK', 'SOBRANTE', 'FUERA_COBERTURA', 'PREVIO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agregar nuevos tipos a NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_PRE_ALERTA';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_PRE_RUTEO';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'VERIFICATION_COMPLETED';

-- Crear tabla Shipment
CREATE TABLE IF NOT EXISTS "Shipment" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "shipmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'PRE_ALERTA',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "finalizedAt" TIMESTAMP(3),

  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- Crear tabla PreAlerta
CREATE TABLE IF NOT EXISTS "PreAlerta" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "client" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "buyerNormalizedId" TEXT,
  "buyer" TEXT NOT NULL,
  "buyerAddress1" TEXT NOT NULL,
  "buyerAddress1Number" TEXT,
  "buyerAddress2" TEXT,
  "buyerCity" TEXT NOT NULL,
  "buyerState" TEXT NOT NULL,
  "buyerLocation" TEXT,
  "buyerZip" TEXT NOT NULL,
  "buyerPhone" TEXT,
  "buyerEmail" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verificationStatus" "VerificationStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PreAlerta_pkey" PRIMARY KEY ("id")
);

-- Crear tabla PreRuteo
CREATE TABLE IF NOT EXISTS "PreRuteo" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "codigoCliente" TEXT NOT NULL,
  "razonSocial" TEXT NOT NULL,
  "domicilio" TEXT NOT NULL,
  "tipoCliente" TEXT NOT NULL,
  "fechaReparto" TIMESTAMP(3) NOT NULL,
  "codigoReparto" TEXT NOT NULL,
  "maquina" TEXT,
  "chofer" TEXT,
  "fechaPedido" TIMESTAMP(3) NOT NULL,
  "codigoPedido" TEXT NOT NULL,
  "ventanaHoraria" TEXT,
  "arribo" TIMESTAMP(3),
  "partida" TIMESTAMP(3),
  "pesoKg" DOUBLE PRECISION,
  "volumenM3" DOUBLE PRECISION,
  "dinero" DOUBLE PRECISION,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verificationStatus" "VerificationStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PreRuteo_pkey" PRIMARY KEY ("id")
);

-- Crear tabla ScannedPackage
CREATE TABLE IF NOT EXISTS "ScannedPackage" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "scanTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scannedBy" TEXT NOT NULL,
  "preAlertaId" TEXT,
  "preRuteoId" TEXT,
  "status" "VerificationStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ScannedPackage_pkey" PRIMARY KEY ("id")
);

-- Crear índices
CREATE INDEX IF NOT EXISTS "Shipment_providerId_idx" ON "Shipment"("providerId");
CREATE INDEX IF NOT EXISTS "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX IF NOT EXISTS "Shipment_shipmentDate_idx" ON "Shipment"("shipmentDate");

CREATE INDEX IF NOT EXISTS "PreAlerta_shipmentId_idx" ON "PreAlerta"("shipmentId");
CREATE INDEX IF NOT EXISTS "PreAlerta_trackingNumber_idx" ON "PreAlerta"("trackingNumber");

CREATE INDEX IF NOT EXISTS "PreRuteo_shipmentId_idx" ON "PreRuteo"("shipmentId");
CREATE INDEX IF NOT EXISTS "PreRuteo_codigoPedido_idx" ON "PreRuteo"("codigoPedido");

CREATE INDEX IF NOT EXISTS "ScannedPackage_shipmentId_idx" ON "ScannedPackage"("shipmentId");
CREATE INDEX IF NOT EXISTS "ScannedPackage_trackingNumber_idx" ON "ScannedPackage"("trackingNumber");
CREATE INDEX IF NOT EXISTS "ScannedPackage_status_idx" ON "ScannedPackage"("status");

-- Crear constraints únicos
CREATE UNIQUE INDEX IF NOT EXISTS "PreAlerta_shipmentId_trackingNumber_key" ON "PreAlerta"("shipmentId", "trackingNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PreRuteo_shipmentId_codigoPedido_key" ON "PreRuteo"("shipmentId", "codigoPedido");
CREATE UNIQUE INDEX IF NOT EXISTS "ScannedPackage_preAlertaId_key" ON "ScannedPackage"("preAlertaId");
CREATE UNIQUE INDEX IF NOT EXISTS "ScannedPackage_preRuteoId_key" ON "ScannedPackage"("preRuteoId");

-- Agregar foreign keys
ALTER TABLE "Shipment" 
  ADD CONSTRAINT "Shipment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PreAlerta"
  ADD CONSTRAINT "PreAlerta_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PreRuteo"
  ADD CONSTRAINT "PreRuteo_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScannedPackage"
  ADD CONSTRAINT "ScannedPackage_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ScannedPackage_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ScannedPackage_preAlertaId_fkey" FOREIGN KEY ("preAlertaId") REFERENCES "PreAlerta"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ScannedPackage_preRuteoId_fkey" FOREIGN KEY ("preRuteoId") REFERENCES "PreRuteo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
