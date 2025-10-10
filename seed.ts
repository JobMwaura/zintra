import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      name: 'Building & Structural Materials',
      slug: 'building-structural-materials',
      description: 'Cement, concrete, bricks, blocks, and structural steel',
      icon: 'Building2'
    },
    {
      name: 'Wood & Timber Solutions',
      slug: 'wood-timber-solutions',
      description: 'Lumber, plywood, engineered wood, and timber products',
      icon: 'Trees'
    },
    {
      name: 'Roofing & Waterproofing',
      slug: 'roofing-waterproofing',
      description: 'Tiles, waterproofing sheets, sealants, and membranes',
      icon: 'Home'
    },
    {
      name: 'Doors, Windows & Hardware',
      slug: 'doors-windows-hardware',
      description: 'Doors, windows, frames, locks, handles, and fittings',
      icon: 'DoorOpen'
    },
    {
      name: 'Flooring & Wall Finishes',
      slug: 'flooring-wall-finishes',
      description: 'Tiles, laminates, paints, wallpapers, and finishes',
      icon: 'Layers'
    },
    {
      name: 'Plumbing & Sanitation',
      slug: 'plumbing-sanitation',
      description: 'Pipes, fittings, fixtures, and sanitary ware',
      icon: 'Droplet'
    },
    {
      name: 'Electrical & Lighting',
      slug: 'electrical-lighting',
      description: 'Wiring, fixtures, switches, panels, and lighting',
      icon: 'Zap'
    },
    {
      name: 'Kitchen & Interior Fittings',
      slug: 'kitchen-interior-fittings',
      description: 'Cabinets, countertops, appliances, and interior fittings',
      icon: 'ChefHat'
    },
    {
      name: 'HVAC & Climate Solutions',
      slug: 'hvac-climate-solutions',
      description: 'Heating, ventilation, air conditioning, and climate control',
      icon: 'Wind'
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('Categories seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });