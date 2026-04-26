SELECT t.name, b."openTime", b."closeTime", b."activeStaff", b."dayOfWeek"
FROM "Tenant" t
JOIN "BusinessHours" b ON t.id = b."tenantId"
WHERE t.name ILIKE '%Mohammad Shop one%'
AND b."dayOfWeek" = (SELECT EXTRACT(DOW FROM TIMESTAMP '2026-04-27'));
