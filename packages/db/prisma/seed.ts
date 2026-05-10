// Seed-скрипт. Запуск: npx prisma db seed (из packages/db).
// Идемпотентный: можно запускать многократно — данные не дублируются.
// Хеширование паролей через bcryptjs — совместимо с AuthService на бэке.

import { PrismaClient, MealPlan, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function generateReferralCode(): string {
  const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return code;
}

async function main() {
  console.log("🌱 Seeding database...");

  // -----------------------------
  // USERS — пароли всегда обновляются (на случай смены алгоритма хеширования)
  // -----------------------------
  const adminEmail = "admin@tours.local";
  const clientEmail = "alice@tours.local";
  const partnerEmail = "bob@tours.local";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hashPassword("admin123") },
    create: {
      email: adminEmail,
      passwordHash: hashPassword("admin123"),
      fullName: "Admin User",
      role: UserRole.ADMIN,
      referralCode: generateReferralCode(),
      emailVerifiedAt: new Date(),
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: clientEmail },
    update: { passwordHash: hashPassword("client123") },
    create: {
      email: clientEmail,
      passwordHash: hashPassword("client123"),
      fullName: "Alice Tourist",
      role: UserRole.CLIENT,
      referralCode: generateReferralCode(),
      emailVerifiedAt: new Date(),
      referralCount: 3,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: partnerEmail },
    update: { passwordHash: hashPassword("partner123") },
    create: {
      email: partnerEmail,
      passwordHash: hashPassword("partner123"),
      fullName: "Bob Blogger",
      role: UserRole.PARTNER,
      isPartnerApproved: true,
      referralCode: generateReferralCode(),
      emailVerifiedAt: new Date(),
      balance: 250.0,
    },
  });

  console.log(`✓ Users: ${admin.email}, ${alice.email}, ${bob.email}`);

  // -----------------------------
  // TOURS (10 штук, разные страны)
  // -----------------------------
  const tours = [
    {
      slug: "turkey-antalya-7days",
      title: { ru: "Анталия, Турция — 7 дней", en: "Antalya, Turkey — 7 days", tj: "Анталия, Туркия — 7 рӯз" },
      description: {
        ru: "Отличный пляжный отдых в 5* отеле с системой 'всё включено' на берегу Средиземного моря.",
        en: "Beach holiday at a 5* all-inclusive hotel on the Mediterranean coast.",
        tj: "Дам гирифтан дар соҳили баҳри Миёназамин дар меҳмонхонаи 5*.",
      },
      country: "Turkey",
      city: "Antalya",
      hotelName: "Crystal Resort & Spa 5*",
      hotelStars: 5,
      mealPlan: MealPlan.ALL_INCLUSIVE,
      durationDays: 7,
      priceUsd: 850,
      coverImage: "https://images.unsplash.com/photo-1589394692-04ce0301cee8?w=1200",
      images: [
        "https://images.unsplash.com/photo-1589394692-04ce0301cee8?w=1600",
        "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1600",
      ],
      isHot: true,
    },
    {
      slug: "egypt-hurghada-10days",
      title: { ru: "Хургада, Египет — 10 дней", en: "Hurghada, Egypt — 10 days", tj: "Ҳурғада, Миср — 10 рӯз" },
      description: {
        ru: "Дайвинг в Красном море, белоснежные пляжи и роскошные отели.",
        en: "Diving in the Red Sea, white beaches and luxury hotels.",
        tj: "Шиновар дар Баҳри Сурх ва соҳилҳои зебо.",
      },
      country: "Egypt",
      city: "Hurghada",
      hotelName: "Steigenberger Aldau Beach 5*",
      hotelStars: 5,
      mealPlan: MealPlan.ALL_INCLUSIVE,
      durationDays: 10,
      priceUsd: 1100,
      coverImage: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200",
      images: ["https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1600"],
      isHot: true,
    },
    {
      slug: "uae-dubai-5days",
      title: { ru: "Дубай, ОАЭ — 5 дней", en: "Dubai, UAE — 5 days", tj: "Дубай, АИМ — 5 рӯз" },
      description: {
        ru: "Шопинг, небоскрёбы, пустынное сафари и Бурдж-Халифа.",
        en: "Shopping, skyscrapers, desert safari and Burj Khalifa.",
        tj: "Харидорӣ, осмонхарошҳо ва Бурҷ-Халифа.",
      },
      country: "UAE",
      city: "Dubai",
      hotelName: "Atlantis The Palm 5*",
      hotelStars: 5,
      mealPlan: MealPlan.HALF_BOARD,
      durationDays: 5,
      priceUsd: 1500,
      coverImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
      images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600"],
      isHot: false,
    },
    {
      slug: "thailand-phuket-12days",
      title: { ru: "Пхукет, Таиланд — 12 дней", en: "Phuket, Thailand — 12 days", tj: "Пхукет, Таиланд — 12 рӯз" },
      description: {
        ru: "Тропический рай: пляжи, экзотическая кухня и культура буддизма.",
        en: "Tropical paradise: beaches, exotic cuisine and Buddhist culture.",
        tj: "Биҳишти тропикӣ: соҳилҳо ва маданият.",
      },
      country: "Thailand",
      city: "Phuket",
      hotelName: "JW Marriott Phuket 5*",
      hotelStars: 5,
      mealPlan: MealPlan.BREAKFAST,
      durationDays: 12,
      priceUsd: 1800,
      coverImage: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200",
      images: ["https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600"],
      isHot: true,
    },
    {
      slug: "maldives-7days",
      title: { ru: "Мальдивы — 7 дней", en: "Maldives — 7 days", tj: "Малдив — 7 рӯз" },
      description: {
        ru: "Бунгало над водой, кристально чистый океан и dolce vita.",
        en: "Overwater bungalows, crystal-clear ocean and dolce vita.",
        tj: "Хонаҳо дар об ва уқёнуси соф.",
      },
      country: "Maldives",
      city: "Malé",
      hotelName: "Conrad Maldives 5*",
      hotelStars: 5,
      mealPlan: MealPlan.ALL_INCLUSIVE,
      durationDays: 7,
      priceUsd: 4200,
      coverImage: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200",
      images: ["https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600"],
      isHot: false,
    },
    {
      slug: "italy-rome-6days",
      title: { ru: "Рим, Италия — 6 дней", en: "Rome, Italy — 6 days", tj: "Рим, Италия — 6 рӯз" },
      description: {
        ru: "Колизей, Ватикан, паста и итальянское вино.",
        en: "Colosseum, Vatican, pasta and Italian wine.",
        tj: "Колизей ва Ватикан.",
      },
      country: "Italy",
      city: "Rome",
      hotelName: "Hotel Artemide 4*",
      hotelStars: 4,
      mealPlan: MealPlan.BREAKFAST,
      durationDays: 6,
      priceUsd: 1350,
      coverImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200",
      images: ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600"],
      isHot: false,
    },
    {
      slug: "spain-barcelona-7days",
      title: { ru: "Барселона, Испания — 7 дней", en: "Barcelona, Spain — 7 days", tj: "Барселона, Испания — 7 рӯз" },
      description: {
        ru: "Гауди, тапас, паэлья и Средиземное море.",
        en: "Gaudi, tapas, paella and the Mediterranean.",
        tj: "Гауди ва баҳри Миёназамин.",
      },
      country: "Spain",
      city: "Barcelona",
      hotelName: "H10 Casanova 4*",
      hotelStars: 4,
      mealPlan: MealPlan.BREAKFAST,
      durationDays: 7,
      priceUsd: 1250,
      coverImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200",
      images: ["https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600"],
      isHot: true,
    },
    {
      slug: "georgia-tbilisi-5days",
      title: { ru: "Тбилиси, Грузия — 5 дней", en: "Tbilisi, Georgia — 5 days", tj: "Тбилиси, Гурҷистон — 5 рӯз" },
      description: {
        ru: "Хинкали, хачапури, серные бани и кавказское гостеприимство.",
        en: "Khinkali, khachapuri, sulfur baths and Caucasian hospitality.",
        tj: "Хинкалӣ ва хачапурӣ.",
      },
      country: "Georgia",
      city: "Tbilisi",
      hotelName: "Rooms Hotel Tbilisi 4*",
      hotelStars: 4,
      mealPlan: MealPlan.BREAKFAST,
      durationDays: 5,
      priceUsd: 550,
      coverImage: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200",
      images: ["https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1600"],
      isHot: true,
    },
    {
      slug: "japan-tokyo-9days",
      title: { ru: "Токио, Япония — 9 дней", en: "Tokyo, Japan — 9 days", tj: "Токио, Япония — 9 рӯз" },
      description: {
        ru: "Сакура, суши, технологии и древние храмы.",
        en: "Sakura, sushi, technology and ancient temples.",
        tj: "Сакура ва маъбадҳо.",
      },
      country: "Japan",
      city: "Tokyo",
      hotelName: "Park Hyatt Tokyo 5*",
      hotelStars: 5,
      mealPlan: MealPlan.BREAKFAST,
      durationDays: 9,
      priceUsd: 2800,
      coverImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200",
      images: ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600"],
      isHot: false,
    },
    {
      slug: "greece-santorini-6days",
      title: { ru: "Санторини, Греция — 6 дней", en: "Santorini, Greece — 6 days", tj: "Санторини, Юнон — 6 рӯз" },
      description: {
        ru: "Белые дома, синее море и закаты, которые не забыть.",
        en: "White houses, blue sea and unforgettable sunsets.",
        tj: "Хонаҳои сафед ва баҳри кабуд.",
      },
      country: "Greece",
      city: "Santorini",
      hotelName: "Astro Palace Suites 4*",
      hotelStars: 4,
      mealPlan: MealPlan.BREAKFAST,
      durationDays: 6,
      priceUsd: 1650,
      coverImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200",
      images: ["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600"],
      isHot: false,
    },
  ];

  for (const t of tours) {
    await prisma.tour.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        ...t,
        programIncluded: { ru: ["Перелёт", "Трансфер", "Проживание", "Страховка"], en: ["Flight", "Transfer", "Accommodation", "Insurance"] },
        programExcluded: { ru: ["Личные расходы", "Виза"], en: ["Personal expenses", "Visa"] },
        referralThreshold: 50,
      },
    });
  }
  console.log(`✓ Tours: ${tours.length} seeded`);

  // -----------------------------
  // REVIEWS
  // -----------------------------
  const turkeyTour = await prisma.tour.findUnique({ where: { slug: "turkey-antalya-7days" } });
  const georgiaTour = await prisma.tour.findUnique({ where: { slug: "georgia-tbilisi-5days" } });

  if (turkeyTour) {
    await prisma.review.upsert({
      where: { id: "seed-review-1" },
      update: {},
      create: {
        id: "seed-review-1",
        tourId: turkeyTour.id,
        userId: alice.id,
        rating: 5,
        text: "Великолепный отдых! Отель шикарный, море чистейшее, персонал внимательный. Обязательно поедем ещё!",
        status: "APPROVED",
        moderatedAt: new Date(),
        moderatedBy: admin.id,
        photos: {
          create: [
            { url: "https://images.unsplash.com/photo-1589394692-04ce0301cee8?w=600", order: 0 },
            { url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600", order: 1 },
          ],
        },
      },
    });
  }

  if (georgiaTour) {
    await prisma.review.upsert({
      where: { id: "seed-review-2" },
      update: {},
      create: {
        id: "seed-review-2",
        tourId: georgiaTour.id,
        userId: bob.id,
        rating: 5,
        text: "Грузия — это любовь с первого взгляда. Кухня, вино, гостеприимство — всё на высшем уровне.",
        status: "APPROVED",
        moderatedAt: new Date(),
        moderatedBy: admin.id,
        photos: {
          create: [{ url: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600", order: 0 }],
        },
      },
    });
  }

  console.log(`✓ Reviews: 2 seeded`);

  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Admin:   admin@tours.local / admin123");
  console.log("  Client:  alice@tours.local / client123");
  console.log("  Partner: bob@tours.local / partner123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
