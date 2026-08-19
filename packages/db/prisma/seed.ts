import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS: Array<{ subject: string; action: string }> = [
  { subject: "Product", action: "manage" },
  { subject: "Product", action: "read" },
  { subject: "Category", action: "manage" },
  { subject: "Category", action: "read" },
  { subject: "Order", action: "manage" },
  { subject: "Order", action: "read" },
  { subject: "Order", action: "create" },
  { subject: "Order", action: "update" },
  { subject: "Order", action: "refund" },
  { subject: "User", action: "manage" },
  { subject: "User", action: "read" },
  { subject: "User", action: "update" },
  { subject: "Finance", action: "read" },
  { subject: "Finance", action: "export" },
  { subject: "Finance", action: "manage" },
  { subject: "Coupon", action: "manage" },
  { subject: "Analytics", action: "read" },
  { subject: "Content", action: "manage" },
  { subject: "SEO", action: "manage" },
  { subject: "Settings", action: "manage" },
  { subject: "Role", action: "manage" },
  { subject: "AuditLog", action: "read" },
];

const ROLE_GRANTS: Record<string, string[]> = {
  "Super Administrator": ["*"],

  "Shop Manager": [
    "Order:manage",
    "Product:manage",
    "Category:manage",
    "Coupon:manage",
    "Analytics:read",
    "User:read",
    "User:update",
    "AuditLog:read",
  ],

  Accountant: [
    "Finance:read",
    "Finance:export",
    "Finance:manage",
    "Order:read",
    "Order:refund",
  ],

  "Inventory & Catalog Manager": [
    "Product:manage",
    "Category:manage",
    "Order:read",
  ],

  "Order Fulfillment Specialist": ["Order:read", "Order:update"],

  "Customer Support": [
    "User:read",
    "Order:read",
    "Order:update",
    "Order:create",
    "Order:refund",
  ],

  "Marketing & Analytics Specialist": [
    "Analytics:read",
    "Order:read",
    "Coupon:manage",
  ],

  Copywriter: ["Content:manage", "Product:read"],

  "SEO Specialist": ["SEO:manage", "Analytics:read", "Content:manage"],

  Customer: [],
};

interface PermissionRecord {
  id: string;
  subject: string;
  action: string;
}
async function main() {
  console.log("Seeding permissions...");
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((p) =>
      prisma.permission.upsert({
        where: { subject_action: { subject: p.subject, action: p.action } },
        update: {},
        create: p,
      }),
    ),
  );

  console.log("Seeding roles...");
  for (const [roleName, grants] of Object.entries(ROLE_GRANTS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, isSystemRole: true },
    });

    const grantedPermissionIds =
      grants[0] === "*"
        ? permissionRecords.map((p: PermissionRecord) => p.id)
        : permissionRecords
            .filter((p: PermissionRecord) =>
              grants.includes(`${p.subject}:${p.action}`),
            )
            .map((p: PermissionRecord) => p.id);

    await Promise.all(
      grantedPermissionIds.map((permissionId: string) =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId } },
          update: {},
          create: { roleId: role.id, permissionId },
        }),
      ),
    );

    console.log(`  ${roleName}: ${grantedPermissionIds.length} permission(s)`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
