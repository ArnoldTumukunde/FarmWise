import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { name: "Crop Farming", slug: "crop-farming", iconName: "ractor", description: "Learn about planting and harvesting." },
    { name: "Livestock & Poultry", slug: "livestock-poultry", iconName: "bird", description: "Animal husbandry and care." },
    { name: "Soil Health", slug: "soil-health", iconName: "leaf", description: "Nutrients, composting, and land prep." },
    { name: "Pest & Disease Control", slug: "pest-disease-control", iconName: "bug", description: "Protect your harvest." },
    { name: "Water & Irrigation", slug: "water-irrigation", iconName: "droplets", description: "Efficient watering techniques." },
    { name: "Agribusiness", slug: "agribusiness", iconName: "briefcase", description: "Market strategy and finance." },
    { name: "Post-Harvest", slug: "post-harvest", iconName: "wheat", description: "Storage and processing." },
    { name: "Farm Technology", slug: "farm-technology", iconName: "cpu", description: "Drones, sensors, and equipment." },
    { name: "Climate & Environment", slug: "climate-environment", iconName: "cloud-sun", description: "Resilience and adaptation." },
    { name: "Organic Farming", slug: "organic-farming", iconName: "sprout", description: "Chemical-free agriculture." }
];

async function main() {
    console.log('Seeding categories...');
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
