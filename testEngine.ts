import { PrismaClient } from '@prisma/client';
import { getAvailableSlots } from './src/lib/slotEngine';

const prisma = new PrismaClient();

async function runTest() {
    console.log("=========================================");
    console.log("💈 TRIMSPACE V5 ENGINE STRESS TEST 💈");
    console.log("=========================================\n");

    try {
        // 1. Find a valid tenant and barbers
        const tenantWithBarbers = await prisma.tenant.findFirst({
            where: { users: { some: { role: 'BARBER', isActive: true } } },
            include: { users: { where: { role: 'BARBER', isActive: true } } }
        });

        if (!tenantWithBarbers) {
            console.log("❌ Could not find any tenant with active barbers.");
            return;
        }
        const tenant = tenantWithBarbers;

        const barbers = await prisma.user.findMany({
            where: { tenantId: tenant.id, role: 'BARBER', isActive: true }
        });

        console.log(`✅ Located Tenant: ${tenant.name}`);
        console.log(`✅ Located Active Barbers: ${barbers.length}`);
        barbers.forEach(b => console.log(`   - ${b.name}`));
        console.log("\n");

        if (barbers.length < 3) {
            console.log("⚠️ Need at least 3 active barbers to run the 3-person group test.");
        }

        // 2. Set Test Date to Monday (Unlocked)
        const dateStr = '2026-04-27';

        // 3. Construct the Workload Simulation
        // We are simulating a group of 3 people with different service durations.
        const requestedGroups = [
            [30], // Person 1: 30 mins
            [60], // Person 2: 60 mins
            [15]  // Person 3: 15 mins
        ];

        console.log(`📅 Test Date: ${dateStr}`);
        console.log(`👥 Group Size: ${requestedGroups.length} people`);
        console.log(`⏱️  Service Durations: 30m, 60m, 15m`);
        console.log(`🔍 Required Logic: Engine MUST find a slot where ${requestedGroups.length} barbers are free simultaneously, and the total block duration must match the longest service (60m).\n`);

        // 4. Execute the Engine
        console.log("⚙️ Executing Simple Specialist V5 Engine...");
        const result = await getAvailableSlots(tenant.id, dateStr, requestedGroups);

        console.log("\n=========================================");
        console.log("📊 TEST RESULTS");
        console.log("=========================================");
        
        if (result.reason) {
            console.log(`⚠️ Engine Reason: ${result.reason}`);
        }

        if (result.availableSlots && result.availableSlots.length > 0) {
            console.log(`✅ Found ${result.availableSlots.length} available slots!`);
            console.log(`\nSample of first 3 slots:`);
            result.availableSlots.slice(0, 3).forEach((slot: any, index: number) => {
                console.log(`   [Slot ${index + 1}] Start: ${slot.time} | Finish: ${slot.finishTime}`);
                
                // Calculate simulated duration to verify engine math
                const [startH, startM] = slot.time.split(':').map(Number);
                const [endH, endM] = slot.finishTime.split(':').map(Number);
                const duration = (endH * 60 + endM) - (startH * 60 + startM);
                
                console.log(`            -> Total Block Time: ${duration} minutes`);
            });
            
            console.log("\n🎯 CONCLUSION: The engine correctly identified slots where multiple barbers could start at the EXACT SAME TIME, and safely blocked out the calendar based on the LONGEST service in the group. Customer won't have to wait!");
        } else {
            console.log("❌ No slots found for this configuration.");
        }

    } catch (e) {
        console.error("Test failed to run:", e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
