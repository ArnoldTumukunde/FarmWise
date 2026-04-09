import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { name: "Crop Farming", slug: "crop-farming", iconName: "tractor", description: "Learn about planting and harvesting." },
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

// Pre-computed bcrypt hash for password "Test1234!" (10 rounds)
// Generated with: bcrypt.hashSync('Test1234!', 10)
const DUMMY_PASSWORD_HASH = '$2b$10$0Q6BSUZLF6hdq4FcM61cxeXDjWMbFqUePpET1DGIqZFJqzOrw.xmy';

async function main() {
    console.log('Seeding categories...');
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log('Categories seeded.');

    // ─── Subcategories ─────────────────────────────────────────────────────────
    console.log('Seeding subcategories...');

    const subcategories: { parent: string; children: { name: string; slug: string; description: string }[] }[] = [
        {
            parent: 'crop-farming',
            children: [
                { name: 'Maize & Cereals', slug: 'maize-cereals', description: 'Growing maize, wheat, millet, and sorghum.' },
                { name: 'Root Crops', slug: 'root-crops', description: 'Cassava, sweet potatoes, and yams.' },
                { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Tomatoes, bananas, mangoes, and more.' },
                { name: 'Cash Crops', slug: 'cash-crops', description: 'Coffee, tea, cotton, and tobacco.' },
                { name: 'Rice Farming', slug: 'rice-farming', description: 'Lowland and upland rice cultivation.' },
            ],
        },
        {
            parent: 'livestock-poultry',
            children: [
                { name: 'Poultry Farming', slug: 'poultry-farming', description: 'Chicken, turkey, and duck rearing.' },
                { name: 'Dairy Farming', slug: 'dairy-farming', description: 'Milk production and cattle management.' },
                { name: 'Goat & Sheep', slug: 'goat-sheep', description: 'Small ruminant husbandry.' },
                { name: 'Pig Farming', slug: 'pig-farming', description: 'Swine production and management.' },
                { name: 'Beekeeping', slug: 'beekeeping', description: 'Honey production and apiary management.' },
            ],
        },
        {
            parent: 'soil-health',
            children: [
                { name: 'Composting', slug: 'composting', description: 'Making and using organic compost.' },
                { name: 'Soil Testing', slug: 'soil-testing', description: 'Understanding soil nutrients and pH.' },
                { name: 'Mulching & Cover Crops', slug: 'mulching-cover-crops', description: 'Soil conservation techniques.' },
            ],
        },
        {
            parent: 'pest-disease-control',
            children: [
                { name: 'Integrated Pest Management', slug: 'integrated-pest-management', description: 'Biological and cultural pest control.' },
                { name: 'Plant Diseases', slug: 'plant-diseases', description: 'Identifying and treating crop diseases.' },
                { name: 'Weed Management', slug: 'weed-management', description: 'Controlling weeds effectively.' },
            ],
        },
        {
            parent: 'water-irrigation',
            children: [
                { name: 'Drip Irrigation', slug: 'drip-irrigation', description: 'Low-cost drip systems for smallholders.' },
                { name: 'Rainwater Harvesting', slug: 'rainwater-harvesting', description: 'Collecting and storing rain for farming.' },
                { name: 'Sprinkler Systems', slug: 'sprinkler-systems', description: 'Sprinkler setup and maintenance.' },
            ],
        },
        {
            parent: 'agribusiness',
            children: [
                { name: 'Farm Accounting', slug: 'farm-accounting', description: 'Tracking costs, revenue, and profit.' },
                { name: 'Market Access', slug: 'market-access', description: 'Finding buyers and selling produce.' },
                { name: 'Value Addition', slug: 'value-addition', description: 'Processing and packaging for higher returns.' },
                { name: 'Cooperative Management', slug: 'cooperative-management', description: 'Running farmer groups and SACCOs.' },
            ],
        },
        {
            parent: 'post-harvest',
            children: [
                { name: 'Grain Storage', slug: 'grain-storage', description: 'Hermetic bags, silos, and drying.' },
                { name: 'Food Processing', slug: 'food-processing', description: 'Milling, drying, and preservation.' },
                { name: 'Cold Chain', slug: 'cold-chain', description: 'Keeping perishables fresh.' },
            ],
        },
        {
            parent: 'farm-technology',
            children: [
                { name: 'Precision Farming', slug: 'precision-farming', description: 'GPS, sensors, and data-driven decisions.' },
                { name: 'Farm Mechanisation', slug: 'farm-mechanisation', description: 'Tractors, tillers, and equipment.' },
                { name: 'Mobile Apps for Farmers', slug: 'mobile-apps-farmers', description: 'Using smartphone tools on the farm.' },
            ],
        },
        {
            parent: 'climate-environment',
            children: [
                { name: 'Climate-Smart Agriculture', slug: 'climate-smart-agriculture', description: 'Adapting to changing weather patterns.' },
                { name: 'Agroforestry', slug: 'agroforestry', description: 'Trees and crops on the same land.' },
                { name: 'Soil & Water Conservation', slug: 'soil-water-conservation', description: 'Terracing, contour farming, and more.' },
            ],
        },
        {
            parent: 'organic-farming',
            children: [
                { name: 'Organic Certification', slug: 'organic-certification', description: 'Getting certified for premium markets.' },
                { name: 'Natural Pesticides', slug: 'natural-pesticides', description: 'Homemade pest solutions.' },
                { name: 'Permaculture', slug: 'permaculture', description: 'Designing self-sustaining farm systems.' },
            ],
        },
    ];

    for (const group of subcategories) {
        const parent = await prisma.category.findUnique({ where: { slug: group.parent } });
        if (!parent) continue;
        for (const child of group.children) {
            await prisma.category.upsert({
                where: { slug: child.slug },
                update: { parentId: parent.id },
                create: { ...child, parentId: parent.id },
            });
        }
    }
    console.log('Subcategories seeded.');

    // ─── Dummy Instructor (Teacher) ──────────────────────────────────────────
    console.log('Seeding dummy instructor...');
    const instructor = await prisma.user.upsert({
        where: { email: 'instructor@farmwise.test' },
        update: {},
        create: {
            email: 'instructor@farmwise.test',
            passwordHash: DUMMY_PASSWORD_HASH,
            role: 'INSTRUCTOR',
            isVerified: true,
            profile: {
                create: {
                    displayName: 'Dr. Sarah Nakamya',
                    headline: 'Agricultural Scientist & Maize Specialist',
                    bio: 'With 15 years of experience in tropical agriculture, Dr. Nakamya helps smallholder farmers increase their maize yields through practical, research-backed techniques.',
                    farmLocation: 'Wakiso, Uganda',
                    cropSpecialities: ['Maize', 'Beans', 'Cassava'],
                },
            },
        },
        include: { profile: true },
    });
    console.log(`  Instructor: ${instructor.email} (${instructor.id})`);

    // ─── Dummy Student (Farmer) ──────────────────────────────────────────────
    console.log('Seeding dummy student...');
    const student = await prisma.user.upsert({
        where: { email: 'farmer@farmwise.test' },
        update: {},
        create: {
            email: 'farmer@farmwise.test',
            passwordHash: DUMMY_PASSWORD_HASH,
            role: 'FARMER',
            isVerified: true,
            profile: {
                create: {
                    displayName: 'John Okello',
                    headline: 'Smallholder Farmer',
                    bio: 'A passionate farmer from Eastern Uganda looking to improve crop yields and learn modern farming techniques.',
                    farmLocation: 'Jinja, Uganda',
                    cropSpecialities: ['Maize', 'Rice'],
                },
            },
        },
        include: { profile: true },
    });
    console.log(`  Student: ${student.email} (${student.id})`);

    // ─── Dummy Admin ─────────────────────────────────────────────────────────
    console.log('Seeding dummy admin...');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@farmwise.test' },
        update: {},
        create: {
            email: 'admin@farmwise.test',
            passwordHash: DUMMY_PASSWORD_HASH,
            role: 'ADMIN',
            isVerified: true,
            profile: {
                create: {
                    displayName: 'FarmWise Admin',
                    headline: 'Platform Administrator',
                },
            },
        },
    });
    console.log(`  Admin: ${admin.email} (${admin.id})`);

    // ─── Get Crop Farming category ───────────────────────────────────────────
    const cropCategory = await prisma.category.findUnique({
        where: { slug: 'crop-farming' },
    });
    if (!cropCategory) throw new Error('Crop Farming category not found');

    // ─── Dummy Course ────────────────────────────────────────────────────────
    console.log('Seeding dummy course...');
    const course = await prisma.course.upsert({
        where: { slug: 'growing-maize-in-uganda-demo01' },
        update: {},
        create: {
            slug: 'growing-maize-in-uganda-demo01',
            title: 'Growing Maize in Uganda: A Complete Guide',
            subtitle: 'From seed selection to harvest — practical techniques for smallholder farmers',
            description: `This comprehensive course covers everything you need to know about growing maize in Uganda's diverse climate zones. You'll learn seed selection, land preparation, planting techniques, pest management, and post-harvest handling.

Whether you're a beginner or experienced farmer, this course provides actionable knowledge backed by the latest agricultural research. All lessons include real-world examples from Ugandan farms.`,
            price: 25000, // 25,000 UGX
            level: 'BEGINNER',
            language: 'English',
            status: 'PUBLISHED',
            isOfflineEnabled: true,
            isFeatured: true,
            averageRating: 4.5,
            reviewCount: 2,
            enrollmentCount: 1,
            totalDuration: 3600, // 1 hour total
            instructorId: instructor.id,
            categoryId: cropCategory.id,
            outcomes: [
                'Select the right maize variety for your region',
                'Prepare land efficiently for planting',
                'Identify and manage common maize pests',
                'Apply proper fertilization techniques',
                'Handle post-harvest storage to minimize losses',
            ],
            requirements: [
                'Access to a small plot of farmland',
                'Basic farming tools (hoe, panga)',
                'No prior formal training required',
            ],
            publishedAt: new Date(),
        },
    });
    console.log(`  Course: "${course.title}" (${course.id})`);

    // ─── Sections & Lectures ─────────────────────────────────────────────────
    console.log('Seeding sections & lectures...');

    // Check if sections already exist (for idempotency)
    const existingSections = await prisma.section.count({ where: { courseId: course.id } });
    if (existingSections === 0) {
        const section1 = await prisma.section.create({
            data: {
                courseId: course.id,
                title: 'Getting Started',
                order: 0,
                lectures: {
                    create: [
                        {
                            title: 'Welcome & Course Overview',
                            order: 0,
                            type: 'VIDEO',
                            duration: 300, // 5 min
                            isPreview: true, // Free preview
                            videoStatus: 'READY',
                        },
                        {
                            title: 'Understanding Uganda\'s Climate Zones',
                            order: 1,
                            type: 'VIDEO',
                            duration: 600, // 10 min
                            videoStatus: 'READY',
                        },
                        {
                            title: 'Choosing the Right Maize Variety',
                            order: 2,
                            type: 'ARTICLE',
                        },
                    ],
                },
            },
        });

        const section2 = await prisma.section.create({
            data: {
                courseId: course.id,
                title: 'Land Preparation & Planting',
                order: 1,
                lectures: {
                    create: [
                        {
                            title: 'Soil Testing & Preparation',
                            order: 0,
                            type: 'VIDEO',
                            duration: 900, // 15 min
                            videoStatus: 'READY',
                        },
                        {
                            title: 'Planting Techniques for Maximum Yield',
                            order: 1,
                            type: 'VIDEO',
                            duration: 720, // 12 min
                            videoStatus: 'READY',
                        },
                    ],
                },
            },
        });

        const section3 = await prisma.section.create({
            data: {
                courseId: course.id,
                title: 'Crop Management & Harvest',
                order: 2,
                lectures: {
                    create: [
                        {
                            title: 'Fertilization Schedule',
                            order: 0,
                            type: 'VIDEO',
                            duration: 480, // 8 min
                            videoStatus: 'READY',
                        },
                        {
                            title: 'Pest & Disease Identification',
                            order: 1,
                            type: 'VIDEO',
                            duration: 600, // 10 min
                            videoStatus: 'READY',
                        },
                        {
                            title: 'Harvesting & Post-Harvest Storage',
                            order: 2,
                            type: 'VIDEO',
                            duration: 540, // 9 min  (total ~69 min ≈ 1hr)
                            videoStatus: 'READY',
                        },
                    ],
                },
            },
        });

        console.log(`  Created 3 sections with 8 lectures`);
    } else {
        console.log(`  Sections already exist, skipping.`);
    }

    // ─── Enroll student in the course (ACTIVE — simulates completed payment) ─
    console.log('Seeding enrollment...');
    const enrollment = await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: course.id,
            },
        },
        update: {},
        create: {
            userId: student.id,
            courseId: course.id,
            paidAmount: 25000,
            status: 'ACTIVE',
        },
    });
    console.log(`  Enrolled student in course (${enrollment.id})`);

    // ─── Dummy Tags ──────────────────────────────────────────────────────────
    console.log('Seeding tags...');
    const tagNames = ['maize', 'uganda', 'beginner', 'crop-farming'];
    for (const name of tagNames) {
        const tag = await prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        // Link tag to course (ignore if already linked)
        await prisma.tagsOnCourses.upsert({
            where: { courseId_tagId: { courseId: course.id, tagId: tag.id } },
            update: {},
            create: { courseId: course.id, tagId: tag.id },
        });
    }
    console.log(`  Tags linked to course.`);

    // ─── Dummy Coupon ────────────────────────────────────────────────────────
    console.log('Seeding test coupon...');
    await prisma.coupon.upsert({
        where: { code: 'TESTFARM50' },
        update: {},
        create: {
            code: 'TESTFARM50',
            type: 'PERCENTAGE',
            value: 50, // 50% off
            maxUses: 100,
            usedCount: 0,
            courseId: course.id,
            expiresAt: new Date('2027-12-31'),
        },
    });
    console.log(`  Coupon TESTFARM50 (50% off) created.`);

    console.log('\n✅ Seed complete! Test credentials:');
    console.log('  Instructor: instructor@farmwise.test / Test1234!');
    console.log('  Student:    farmer@farmwise.test    / Test1234!');
    console.log('  Admin:      admin@farmwise.test     / Test1234!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
