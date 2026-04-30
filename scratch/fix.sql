UPDATE "PlatformSettings" SET "defaultPlatformFee" = 0.017 WHERE "id" = 'platform_global';
DELETE FROM "Settlement" WHERE "tenantId" IN (SELECT "id" FROM "Tenant" WHERE "name" = 'Validation Test Shop');
DELETE FROM "Appointment" WHERE "tenantId" IN (SELECT "id" FROM "Tenant" WHERE "name" = 'Validation Test Shop');
