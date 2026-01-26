import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default user
  const passwordHash = await bcrypt.hash('12345678', 12);
  const user = await prisma.user.upsert({
    where: { email: 'owner@store.local' },
    update: { passwordHash },
    create: {
      email: 'owner@store.local',
      passwordHash,
    },
  });
  console.log('Created user:', user.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Grains' },
      update: {},
      create: { name: 'Grains', description: 'Rice, flour, and other grains' },
    }),
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages', description: 'Drinks and beverages' },
    }),
    prisma.category.upsert({
      where: { name: 'Dairy' },
      update: {},
      create: { name: 'Dairy', description: 'Milk, cheese, and dairy products' },
    }),
    prisma.category.upsert({
      where: { name: 'Cooking' },
      update: {},
      create: { name: 'Cooking', description: 'Cooking oils and condiments' },
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks', description: 'Chips, cookies, and snacks' },
    }),
  ]);
  console.log('Created categories:', categories.map((c) => c.name).join(', '));

  // Create sample products with inventory
  const products = [
    {
      barcode: '5901234123457',
      name: 'Rice 1kg Premium',
      price: 2.5,
      cost: 1.8,
      categoryName: 'Grains',
      reorderLevel: 10,
      initialStock: 25,
    },
    {
      barcode: '5901234567890',
      name: 'Sugar 500g',
      price: 1.5,
      cost: 1.0,
      categoryName: 'Grains',
      reorderLevel: 15,
      initialStock: 42,
    },
    {
      barcode: '5901234111222',
      name: 'Cooking Oil 1L',
      price: 3.0,
      cost: 2.2,
      categoryName: 'Cooking',
      reorderLevel: 5,
      initialStock: 3, // Low stock for testing alerts
    },
    {
      barcode: '5901234333444',
      name: 'Milk 1L',
      price: 1.2,
      cost: 0.9,
      categoryName: 'Dairy',
      reorderLevel: 10,
      initialStock: 18,
    },
    {
      barcode: '5901234555666',
      name: 'Coffee 200g',
      price: 4.5,
      cost: 3.2,
      categoryName: 'Beverages',
      reorderLevel: 8,
      initialStock: 12,
    },
  ];

  for (const product of products) {
    const category = categories.find((c) => c.name === product.categoryName);
    const created = await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: {
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        cost: product.cost,
        categoryId: category?.id,
        reorderLevel: product.reorderLevel,
        inventory: {
          create: {
            quantity: product.initialStock,
          },
        },
      },
    });
    console.log('Created product:', created.name);
  }

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '+1234567890' },
      update: {},
      create: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+0987654321' },
      update: {},
      create: {
        name: 'Jane Smith',
        phone: '+0987654321',
        notes: 'Regular customer',
      },
    }),
  ]);
  console.log('Created customers:', customers.map((c) => c.name).join(', '));

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
