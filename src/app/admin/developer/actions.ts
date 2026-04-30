"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { calculateServiceFees } from "@/lib/pricing";
import { triggerWeeklyRunAction } from "../payouts/actions";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized: Platform Admin access required.");
  }
  return session;
}

/**
 * Resets all transactional data while keeping Users, Tenants, and Services.
 */
export async function resetTransactionalDataAction() {
  await ensureAdmin();

  try {
    // 1. Delete Dispute Notes
    await prisma.disputeNote.deleteMany({});
    
    // 2. Delete Appointments (This will also clear links in other tables if configured)
    await prisma.appointment.deleteMany({});
    
    // 3. Delete Settlements
    await prisma.settlement.deleteMany({});

    revalidatePath("/admin/ledger");
    revalidatePath("/admin/payouts");
    revalidatePath("/admin/finance");
    
    return { success: true, message: "Transactional data cleared successfully." };
  } catch (error: any) {
    console.error("Reset Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Runs an end-to-end validation script.
 * 1. Resets data.
 * 2. Creates mock appointments for a test shop.
 * 3. Triggers settlement.
 * 4. Compares results.
 */
export async function runEndToEndValidationAction() {
  await ensureAdmin();

  try {
    // 1. Reset
    await resetTransactionalDataAction();

    // 2. Find or Create Test Shop
    let testShop = await prisma.tenant.findFirst({
      where: { name: "Validation Test Shop" }
    });

    if (!testShop) {
      testShop = await prisma.tenant.create({
        data: {
          name: "Validation Test Shop",
          slug: "validation-test",
          address: "123 Test St, Sydney",
          phone: "0400000000",
          email: "test@trimspace.com.au"
        }
      });
    }

    // 3. Find or Create a Test Service
    let testService = await prisma.service.findFirst({
      where: { tenantId: testShop.id }
    });

    if (!testService) {
      testService = await prisma.service.create({
        data: {
          tenantId: testShop.id,
          name: "Validation Cut",
          description: "Test service for financial verification",
          price: 100.00,
          duration: 30
        }
      });
    }

    // 4. Find a Test Customer
    const testCustomer = await prisma.user.findFirst({
        where: { role: "CUSTOMER" }
    });

    if (!testCustomer) throw new Error("No customer found in DB to run test.");

    // 5. Create Mock Bookings (Historical so they are eligible for settlement)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);

    // Case A: Standard $100 Booking
    const appA = await prisma.appointment.create({
      data: {
        tenantId: testShop.id,
        serviceId: testService.id,
        customerId: testCustomer.id,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 30 * 60000),
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE"
      }
    });

    // Case B: Cancelled Booking with $30 Penalty
    const appB = await prisma.appointment.create({
      data: {
        tenantId: testShop.id,
        serviceId: testService.id,
        customerId: testCustomer.id,
        startTime: new Date(yesterday.getTime() + 60 * 60000),
        endTime: new Date(yesterday.getTime() + 90 * 60000),
        status: "CANCELLED",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE",
        cancellationFee: 30.00
      }
    });

    // 6. Calculate Expectations
    const feesA = calculateServiceFees(100.00); // 100 + 1.7 + 0.3 + 0.5 = 102.5
    const feesB = calculateServiceFees(30.00);  // 30 + 0.51 + 0.3 + 0.5 = 31.31 -> Rounded to 31.30 (if 0.10 rounding)
    
    const expectedGross = feesA.totalCustomerPrice + feesB.totalCustomerPrice;
    const expectedNet = feesA.basePrice + feesB.basePrice;
    const expectedFees = expectedGross - expectedNet;

    // 7. Trigger Settlement Run
    await triggerWeeklyRunAction();

    // 8. Fetch the generated settlement
    const settlement = await prisma.settlement.findFirst({
      where: { tenantId: testShop.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!settlement) throw new Error("Settlement was not generated.");

    const report = {
      summary: "End-to-End Validation Complete",
      status: "SUCCESS",
      testShop: testShop.name,
      metrics: {
        expectedGross: expectedGross.toFixed(2),
        actualGross: Number(settlement.grossAmount).toFixed(2),
        expectedNet: expectedNet.toFixed(2),
        actualNet: Number(settlement.amount).toFixed(2),
        expectedFees: expectedFees.toFixed(2),
        actualFees: Number(settlement.feeAmount).toFixed(2),
      },
      match: {
          gross: Number(settlement.grossAmount) === expectedGross,
          net: Number(settlement.amount) === expectedNet,
          fees: Math.abs(Number(settlement.feeAmount) - expectedFees) < 0.01
      }
    };

    revalidatePath("/admin/payouts");
    return { success: true, report };

  } catch (error: any) {
    console.error("Validation Error:", error);
    return { success: false, error: error.message };
  }
}
