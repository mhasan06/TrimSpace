import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getShopCustomers } from "./actions";
import CustomerManager from "@/components/CustomerManager";
import styles from "../page.module.css";

import { getActiveTenantContext } from "@/lib/support";

export default async function ShopCustomersPage() {
    const context = await getActiveTenantContext();
    if (!context?.tenantId) redirect("/login");

    const customers = await getShopCustomers(context.tenantId);
    const tenant = await prisma.tenant.findUnique({ where: { id: context.tenantId } });

    return (
        <div style={{ padding: '2rem' }}>
            <header className={`${styles.header} glass`} style={{ marginBottom: '2rem' }}>
                <div>
                   <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Customer Directory</h1>
                   <p style={{ opacity: 0.6 }}>Manage users who have registered with {tenant?.name}.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>Total Database</p>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{customers.length}</p>
                </div>
            </header>

            <CustomerManager 
                initialCustomers={customers as any} 
                tenantId={context.tenantId} 
                isAdmin={false} 
            />
        </div>
    );
}
