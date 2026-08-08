import { PrismaClient, UserRole, CustomerType, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'Password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Seed Users
  console.log('Seeding default personnel accounts...');
  const usersToSeed = [
    { email: 'admin@erp.com', name: 'System Admin', role: UserRole.Admin },
    { email: 'sales@erp.com', name: 'Sales Executive', role: UserRole.Sales },
    { email: 'warehouse@erp.com', name: 'Warehouse Manager', role: UserRole.Warehouse },
    { email: 'accounts@erp.com', name: 'Accountant', role: UserRole.Accounts }
  ];

  for (const user of usersToSeed) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash },
      create: { email: user.email, name: user.name, role: user.role, passwordHash }
    });
  }

  // 2. Seed Customers
  console.log('Seeding default customer accounts...');
  const customersToSeed = [
    {
      email: 'alice.freeman@acme.com',
      name: 'Alice Freeman',
      mobile: '+91 9876543210',
      businessName: 'Acme Corp',
      gstNumber: '22AAAAA1111A1Z1',
      customerType: CustomerType.Retail,
      address: '123 Corporate Blvd, Sector 5',
      status: CustomerStatus.Active
    },
    {
      email: 'john.peterson@globex.io',
      name: 'John Peterson',
      mobile: '+91 9865432107',
      businessName: 'Globex Ltd',
      gstNumber: '22BBBBB2222B2Z2',
      customerType: CustomerType.Wholesale,
      address: '456 Industrial Way, Block C',
      status: CustomerStatus.Active
    },
    {
      email: 'emma.watson@initech.com',
      name: 'Emma Watson',
      mobile: '+91 9543210987',
      businessName: 'Initech Inc',
      gstNumber: '22CCCCC3333C3Z3',
      customerType: CustomerType.Distributor,
      address: '789 Office Park, Suite 101',
      status: CustomerStatus.Inactive
    },
    {
      email: 'robert.chen@cyberdyne.co',
      name: 'Robert Chen',
      mobile: '+91 9432109876',
      businessName: 'Cyberdyne Systems',
      gstNumber: '22DDDDD4444D4Z4',
      customerType: CustomerType.Wholesale,
      address: '101 Cyber Center, Tower 2',
      status: CustomerStatus.Lead
    },
    {
      email: 'sarah.connor@umbrella.org',
      name: 'Sarah Connor',
      mobile: '+91 9321098765',
      businessName: 'Umbrella Corp',
      gstNumber: '22EEEEE5555E5Z5',
      customerType: CustomerType.Retail,
      address: '202 Underground Lab Road',
      status: CustomerStatus.Lead
    }
  ];

  for (const c of customersToSeed) {
    await prisma.customer.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        mobile: c.mobile,
        businessName: c.businessName,
        gstNumber: c.gstNumber,
        customerType: c.customerType,
        address: c.address,
        status: c.status
      },
      create: {
        email: c.email,
        name: c.name,
        mobile: c.mobile,
        businessName: c.businessName,
        gstNumber: c.gstNumber,
        customerType: c.customerType,
        address: c.address,
        status: c.status
      }
    });
  }

  // 3. Seed Products
  console.log('Seeding default inventory products...');
  const productsToSeed = [
    {
      name: 'Logitech MX Master 3S',
      sku: 'LOGI-MX3S-GRY',
      category: 'Peripherals',
      unitPrice: 99.99,
      currentStock: 25,
      minStockAlert: 5,
      location: 'Shelf A-1'
    },
    {
      name: 'Dell UltraSharp U2723QE',
      sku: 'DELL-U2723-4K',
      category: 'Monitors',
      unitPrice: 549.99,
      currentStock: 12,
      minStockAlert: 3,
      location: 'Shelf B-3'
    },
    {
      name: 'Keychron K8 Wireless Keyboard',
      sku: 'KEYC-K8-BLUE',
      category: 'Peripherals',
      unitPrice: 79.99,
      currentStock: 4, // 4 <= 5 (Low Stock alert will trigger!)
      minStockAlert: 5,
      location: 'Shelf A-4'
    },
    {
      name: 'MacBook Pro 14 M3',
      sku: 'APPL-MBP14-M3',
      category: 'Hardware',
      unitPrice: 1599.99,
      currentStock: 8,
      minStockAlert: 2,
      location: 'Shelf C-2'
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      sku: 'SONY-XM5-BLK',
      category: 'Audio',
      unitPrice: 349.99,
      currentStock: 15,
      minStockAlert: 4,
      location: 'Shelf D-1'
    }
  ];

  for (const p of productsToSeed) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        location: p.location
      },
      create: {
        sku: p.sku,
        name: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        location: p.location
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
