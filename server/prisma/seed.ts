import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const dataDir = path.join(__dirname, '../data');
  
  const destinations = JSON.parse(fs.readFileSync(path.join(dataDir, 'destinations.json'), 'utf-8'));
  const guides = JSON.parse(fs.readFileSync(path.join(dataDir, 'guides.json'), 'utf-8'));

  console.log('Seeding destinations...');
  for (const dest of destinations) {
    await prisma.destination.upsert({
      where: { id: dest.id },
      update: {},
      create: {
        id: dest.id,
        name: dest.name,
        description: dest.description,
        image: dest.image,
        region: dest.region,
        tags: dest.tags,
      },
    });
  }

  console.log('Seeding guides...');
  for (const guide of guides) {
    await prisma.guide.upsert({
      where: { id: guide.id },
      update: {},
      create: {
        id: guide.id,
        destinationId: guide.destinationId,
        title: guide.title,
        author: guide.author,
        rating: guide.rating,
        budget: guide.budget,
        transportation: guide.transportation,
        itinerary: guide.itinerary,
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
