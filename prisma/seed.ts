import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
// bcrypt is usually used, but for seed we can use a dummy or just use crypto if not available
// we'll assume bcryptjs is installed since they have passwords
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  // 1. Create Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created:", adminUser.email);

  // 2. Create Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: "TruFlow",
        code: "TRU",
        email: "contact@truflow.com",
        status: "ACTIVE",
      },
    }),
    prisma.company.create({
      data: {
        name: "Zeetork",
        code: "ZTK",
        email: "info@zeetork.com",
        status: "ACTIVE",
      },
    }),
  ]);
  console.log("Companies created:", companies.map(c => c.name).join(", "));

  // 3. Create Employees
  const empPassword = await bcrypt.hash("emp123", 10);
  
  const user1 = await prisma.user.create({
    data: { name: "Arun Kumar", email: "arun@example.com", password: empPassword, role: "EMPLOYEE" }
  });
  const emp1 = await prisma.employee.create({
    data: { userId: user1.id, designation: "Sales Executive" }
  });

  const user2 = await prisma.user.create({
    data: { name: "Ravi Shankar", email: "ravi@example.com", password: empPassword, role: "EMPLOYEE" }
  });
  const emp2 = await prisma.employee.create({
    data: { userId: user2.id, designation: "Senior Sales" }
  });

  // Assign Employees to Companies
  await prisma.employeeCompany.createMany({
    data: [
      { employeeId: emp1.id, companyId: companies[0].id, role: "SALES", isPrimary: true }, // Arun -> TechNova
      { employeeId: emp1.id, companyId: companies[1].id, role: "SALES", isPrimary: false }, // Arun -> Global Ind
      { employeeId: emp2.id, companyId: companies[1].id, role: "SALES", isPrimary: true },  // Ravi -> Global Ind
    ]
  });
  console.log("Employees created and assigned.");

  // 4. Create Customers (Shared)
  const customer1 = await prisma.customer.create({
    data: {
      name: "Rajesh Kumar",
      phone: "9876543210",
      email: "rajesh@email.com",
      city: "Coimbatore",
      companyName: "Rajesh Enterprises"
    }
  });

  // 5. Create Assignments
  await prisma.customerAssignment.createMany({
    data: [
      {
        customerId: customer1.id,
        companyId: companies[0].id,
        employeeId: emp1.id, // Rajesh -> TechNova -> Arun
        status: "ACTIVE"
      },
      {
        customerId: customer1.id,
        companyId: companies[1].id,
        employeeId: emp2.id, // Rajesh -> Global Ind -> Ravi
        status: "ACTIVE"
      }
    ]
  });
  console.log("Customers and assignments created.");

  // 6. Create Visits
  await prisma.visit.create({
    data: {
      customerId: customer1.id,
      companyId: companies[0].id,
      employeeId: emp1.id,
      visitDate: new Date(),
      visitType: "DEMO",
      status: "COMPLETED",
      visitReport: "Showed the new software to Rajesh.",
    }
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
