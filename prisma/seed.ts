import { PrismaClient } from '@prisma/client';
import { CANONICAL_CATEGORIES } from '../lib/categories/canonicalCategories.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Delete existing categories (optional - comment out if you want to preserve existing)
  // await prisma.category.deleteMany({});
  // console.log('✓ Cleared existing categories');
  
  // Insert all 20 canonical categories
  let created = 0;
  let skipped = 0;
  
  for (const category of CANONICAL_CATEGORIES) {
    try {
      // Check if category already exists
      const existing = await prisma.category.findUnique({
        where: { slug: category.slug }
      });
      
      if (existing) {
        console.log(`⊘ Category "${category.label}" (${category.slug}) already exists - skipping`);
        skipped++;
      } else {
        await prisma.category.create({
          data: {
            name: category.label,
            slug: category.slug,
            description: category.description,
            icon: category.icon
          }
        });
        console.log(`✓ Created category: "${category.label}" (${category.slug})`);
        created++;
      }
    } catch (error) {
      console.error(`✗ Error creating category "${category.label}":`, error.message);
    }
  }
  
  console.log(`\n📊 Seed Summary:`);
  console.log(`  ✓ Created: ${created} categories`);
  console.log(`  ⊘ Skipped: ${skipped} categories (already exist)`);
  console.log(`  📦 Total: ${created + skipped}/20 categories in database`);
  
  // Verify all categories exist
  const count = await prisma.category.count();
  console.log(`\n✅ Database verification: ${count} categories found in database`);
  
  if (count === 20) {
    console.log('✅ All 20 canonical categories are ready!');
  } else {
    console.warn(`⚠️  Warning: Expected 20 categories but found ${count}`);
  }
}

main()
  .catch((e) => {
    console.error('🚨 Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
