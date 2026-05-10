import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding HET PMS database...");

  // Create Roles
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: "super_admin" }, update: {}, create: { name: "super_admin", description: "Full system access" } }),
    prisma.role.upsert({ where: { name: "admin" }, update: {}, create: { name: "admin", description: "Company admin" } }),
    prisma.role.upsert({ where: { name: "accountant" }, update: {}, create: { name: "accountant", description: "Manage accounts and finance" } }),
    prisma.role.upsert({ where: { name: "project_manager" }, update: {}, create: { name: "project_manager", description: "Manage projects" } }),
    prisma.role.upsert({ where: { name: "site_engineer" }, update: {}, create: { name: "site_engineer", description: "Site operations" } }),
    prisma.role.upsert({ where: { name: "inventory_manager" }, update: {}, create: { name: "inventory_manager", description: "Manage stock and inventory" } }),
    prisma.role.upsert({ where: { name: "procurement_officer" }, update: {}, create: { name: "procurement_officer", description: "Manage procurement" } }),
  ]);

  const superAdminRole = roles[0];
  const adminRole = roles[1];

  // Create Super Admin user
  const hashedPassword = await bcrypt.hash("admin@123", 10);
  await prisma.user.upsert({
    where: { email: "superadmin@hetpms.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@hetpms.com",
      password: hashedPassword,
      phone: "01700000000",
      roleId: superAdminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@hetpms.com" },
    update: {},
    create: {
      name: "Md. Aminul Islam",
      email: "admin@hetpms.com",
      password: hashedPassword,
      phone: "01711111111",
      roleId: adminRole.id,
    },
  });

  // Create Chart of Accounts
  const accountDefs = [
    { code: "1001", name: "Cash in Hand", type: "CASH" as const },
    { code: "1002", name: "BRAC Bank - Current Account", type: "BANK" as const },
    { code: "1003", name: "Dutch Bangla Bank - Current", type: "BANK" as const },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" as const },
    { code: "1200", name: "Inventory / Materials", type: "ASSET" as const },
    { code: "2001", name: "Accounts Payable - Suppliers", type: "LIABILITY" as const },
    { code: "2002", name: "Accounts Payable - Contractors", type: "LIABILITY" as const },
    { code: "3001", name: "Apartment Sales Income", type: "INCOME" as const },
    { code: "3002", name: "Booking Money Income", type: "INCOME" as const },
    { code: "3003", name: "Service Charge Income", type: "INCOME" as const },
    { code: "4001", name: "Material Purchase Expense", type: "EXPENSE" as const },
    { code: "4002", name: "Labor Cost Expense", type: "EXPENSE" as const },
    { code: "4003", name: "Contractor Payment Expense", type: "EXPENSE" as const },
    { code: "4004", name: "Equipment & Transport Expense", type: "EXPENSE" as const },
    { code: "4005", name: "Office & Admin Expense", type: "EXPENSE" as const },
    { code: "5001", name: "Owner Equity", type: "EQUITY" as const },
  ];

  for (const acc of accountDefs) {
    await prisma.account.upsert({ where: { code: acc.code }, update: {}, create: acc });
  }

  // Create Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({ where: { id: "sup-bsrm" }, update: {}, create: { id: "sup-bsrm", name: "BSRM Steel", contact: "Md. Rahim", phone: "01911000001", email: "sales@bsrm.com", address: "Chittagong" } }),
    prisma.supplier.upsert({ where: { id: "sup-bcc" }, update: {}, create: { id: "sup-bcc", name: "Bashundhara Cement", contact: "Karim Ahmed", phone: "01711000002", email: "cement@bashundhara.com", address: "Dhaka" } }),
    prisma.supplier.upsert({ where: { id: "sup-rak" }, update: {}, create: { id: "sup-rak", name: "RAK Ceramics", contact: "Shahin", phone: "01611000003", email: "info@rak.com.bd", address: "Dhaka" } }),
    prisma.supplier.upsert({ where: { id: "sup-akij" }, update: {}, create: { id: "sup-akij", name: "Akij Pipe", contact: "Faruk", phone: "01511000004", email: "sales@akij.net", address: "Dhaka" } }),
  ]);

  // Create Products
  const products = [
    { name: "Cement (50kg bag)", category: "Building Material", unit: "Bag", stock: 450, minStock: 200, purchasePrice: 550, supplierId: suppliers[1].id },
    { name: "Steel Rod (10mm)", category: "Steel", unit: "Ton", stock: 25, minStock: 50, purchasePrice: 95000, supplierId: suppliers[0].id },
    { name: "Red Brick", category: "Building Material", unit: "Piece", stock: 15000, minStock: 10000, purchasePrice: 12 },
    { name: "Sand (River)", category: "Raw Material", unit: "CFT", stock: 800, minStock: 500, purchasePrice: 45 },
    { name: "Stone Chips", category: "Raw Material", unit: "CFT", stock: 120, minStock: 300, purchasePrice: 65 },
    { name: "Paint Berger 5L", category: "Finishing", unit: "Can", stock: 85, minStock: 100, purchasePrice: 2800 },
    { name: "Ceramic Tiles 600x600", category: "Finishing", unit: "SqFt", stock: 2500, minStock: 1000, purchasePrice: 85, supplierId: suppliers[2].id },
    { name: "PVC Pipe 1 inch", category: "Plumbing", unit: "Piece", stock: 180, minStock: 200, purchasePrice: 320, supplierId: suppliers[3].id },
    { name: "MS Rod (12mm)", category: "Steel", unit: "Ton", stock: 30, minStock: 30, purchasePrice: 98000, supplierId: suppliers[0].id },
    { name: "Electrical Wire 2.5mm", category: "Electrical", unit: "Meter", stock: 1200, minStock: 500, purchasePrice: 85 },
    { name: "Sanitary Fitting Set", category: "Plumbing", unit: "Set", stock: 45, minStock: 20, purchasePrice: 8500 },
    { name: "Door (Solid Wood)", category: "Wood & Glass", unit: "Piece", stock: 60, minStock: 30, purchasePrice: 12000 },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod }).catch(() => {});
  }

  // Create Projects
  const project1 = await prisma.project.upsert({
    where: { id: "proj-bashundhara" },
    update: {},
    create: {
      id: "proj-bashundhara",
      name: "Bashundhara Residential Complex",
      location: "Bashundhara, Dhaka",
      type: "Residential",
      status: "ACTIVE",
      budget: 120000000,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-06-30"),
      manager: "Md. Rafiqul Islam",
      totalUnits: 48,
      soldUnits: 31,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "proj-gulshan" },
    update: {},
    create: {
      id: "proj-gulshan",
      name: "Gulshan Commercial Tower",
      location: "Gulshan-2, Dhaka",
      type: "Commercial",
      status: "ACTIVE",
      budget: 250000000,
      startDate: new Date("2023-08-01"),
      endDate: new Date("2026-02-28"),
      manager: "Eng. Kamal Hossain",
      totalUnits: 20,
      soldUnits: 12,
    },
  });

  // Create Contractors
  await prisma.contractor.upsert({
    where: { id: "cont-rahman" },
    update: {},
    create: {
      id: "cont-rahman",
      name: "Rahman Construction Ltd.",
      specialty: "Civil Work",
      phone: "01711222333",
      email: "rahman@construction.com",
      assignments: {
        create: { projectId: project1.id, contractValue: 15000000, paid: 9000000, startDate: new Date("2024-02-01") },
      },
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📧 Login Credentials:");
  console.log("   Super Admin: superadmin@hetpms.com / admin@123");
  console.log("   Admin: admin@hetpms.com / admin@123\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
