import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const quran = await prisma.course.upsert({
    where: { slug: "quran-with-tajweed" },
    update: {},
    create: {
      slug: "quran-with-tajweed",
      name: "Quran with Tajweed",
      description: "Tajweed, Translation, Tafseer",
      summary:
        "Learn to recite the Quran with correct Tajweed rules, understand its meaning through Translation, and deepen your understanding with Tafseer — taught one-to-one by experienced, qualified teachers.",
      topics: ["Tajweed", "Translation", "Tafseer"],
      color: "text-teal-600 bg-teal-100",
      icon: "Landmark",
    },
  });

  const computer = await prisma.course.upsert({
    where: { slug: "computer-courses" },
    update: {},
    create: {
      slug: "computer-courses",
      name: "Computer Courses",
      description: "MS Word, PowerPoint, Programming Languages",
      summary:
        "Build practical computer skills from the ground up — from everyday office tools like MS Word and PowerPoint to the fundamentals of programming languages.",
      topics: ["MS Word", "PowerPoint", "Programming Languages"],
      color: "text-indigo-600 bg-indigo-100",
      icon: "Monitor",
    },
  });

  const adminPassword = await hash("Admin@12345");
  await prisma.user.upsert({
    where: { email: "admin@edusphereacademy.com" },
    update: {},
    create: {
      name: "Site Admin",
      email: "admin@edusphereacademy.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const teacherPassword = await hash("Teacher@12345");

  const hafsa = await prisma.user.upsert({
    where: { email: "hafsa.siddiqui@edusphereacademy.com" },
    update: {},
    create: {
      name: "Hafsa Siddiqui",
      email: "hafsa.siddiqui@edusphereacademy.com",
      passwordHash: teacherPassword,
      role: "TEACHER",
      teacher: { create: { courses: { connect: [{ id: quran.id }] } } },
    },
    include: { teacher: true },
  });

  const bilal = await prisma.user.upsert({
    where: { email: "bilal.ahmed@edusphereacademy.com" },
    update: {},
    create: {
      name: "Bilal Ahmed",
      email: "bilal.ahmed@edusphereacademy.com",
      passwordHash: teacherPassword,
      role: "TEACHER",
      teacher: { create: { courses: { connect: [{ id: computer.id }] } } },
    },
    include: { teacher: true },
  });

  const hafsaTeacherId = hafsa.teacher!.id;
  const bilalTeacherId = bilal.teacher!.id;

  const staffPassword = await hash("Staff@12345");
  const staffUser = await prisma.user.upsert({
    where: { email: "sana.tariq@edusphereacademy.com" },
    update: {},
    create: {
      name: "Sana Tariq",
      email: "sana.tariq@edusphereacademy.com",
      passwordHash: staffPassword,
      role: "STAFF",
    },
  });

  const hrCategory = await prisma.sopCategory.upsert({
    where: { name: "HR & Onboarding" },
    update: {},
    create: { name: "HR & Onboarding" },
  });
  const teachingCategory = await prisma.sopCategory.upsert({
    where: { name: "Teaching Standards" },
    update: {},
    create: { name: "Teaching Standards" },
  });

  await prisma.sopDocument.createMany({
    data: [
      {
        categoryId: hrCategory.id,
        title: "New Hire Checklist",
        description: "Steps for onboarding a new teacher or staff member.",
        fileUrl: "https://docs.google.com/document/d/example-new-hire-checklist",
        status: "APPROVED",
        createdById: staffUser.id,
      },
      {
        categoryId: teachingCategory.id,
        title: "Tajweed Class Delivery Guide",
        description: "Standard structure for a 30-minute Quran with Tajweed lesson.",
        fileUrl: "https://docs.google.com/document/d/example-tajweed-guide",
        status: "APPROVED",
        createdById: staffUser.id,
      },
    ],
    skipDuplicates: true,
  });

  const studentPassword = await hash("Student@12345");

  const aliUser = await prisma.user.upsert({
    where: { email: "ali.raza@example.com" },
    update: {},
    create: {
      name: "Ali Raza",
      email: "ali.raza@example.com",
      passwordHash: studentPassword,
      role: "STUDENT",
      student: {
        create: {
          name: "Ali Raza",
          email: "ali.raza@example.com",
          phone: "+92 300 1234567",
          whatsapp: "+92 300 1234567",
          parentName: "Muhammad Raza",
          parentContact: "+92 300 7654321",
          monthlyFee: "PKR 5,000",
          enrollments: {
            create: [
              {
                courseId: quran.id,
                classStartTime: "17:00",
                classEndTime: "18:00",
                classDays: ["TUESDAY", "THURSDAY"],
              },
            ],
          },
          teacherId: hafsaTeacherId,
          level: "INTERMEDIATE",
          progress: 65,
          status: "ACTIVE",
          notes: {
            create: [
              { note: "Enrollment confirmed." },
              { note: "Good progress on Tajweed rules this week." },
            ],
          },
          invoices: {
            create: [
              {
                invoiceNumber: "INV-2026-0001",
                description: "Quran with Tajweed — August",
                amount: "PKR 5,000",
                status: "PAID",
              },
              {
                invoiceNumber: "INV-2026-0002",
                description: "Quran with Tajweed — September",
                amount: "PKR 5,000",
                status: "PENDING",
                dueDate: new Date("2026-09-01"),
              },
            ],
          },
          notifications: {
            create: [
              { message: "Your next class is scheduled for August 20, 5:00 PM." },
              { message: "Invoice for September is due on September 1." },
              { message: "Welcome to EduSphere Academy! Your enrollment is confirmed." },
            ],
          },
        },
      },
    },
  });

  const aliStudent = await prisma.student.findUniqueOrThrow({
    where: { email: "ali.raza@example.com" },
  });

  const parentPassword = await hash("Parent@12345");
  await prisma.user.upsert({
    where: { email: "muhammad.raza@example.com" },
    update: {},
    create: {
      name: "Muhammad Raza",
      email: "muhammad.raza@example.com",
      passwordHash: parentPassword,
      role: "PARENT",
      parent: { create: { students: { connect: { id: aliStudent.id } } } },
    },
  });

  await prisma.student.upsert({
    where: { email: "mahnoor.ali@example.com" },
    update: {},
    create: {
      name: "Mahnoor Ali",
      email: "mahnoor.ali@example.com",
      enrollments: { create: [{ courseId: quran.id }, { courseId: computer.id }] },
      teacherId: hafsaTeacherId,
      level: "BEGINNER",
      progress: 30,
      status: "ACTIVE",
    },
  });

  await prisma.student.upsert({
    where: { email: "hassan.raza@example.com" },
    update: {},
    create: {
      name: "Hassan Raza",
      email: "hassan.raza@example.com",
      enrollments: { create: [{ courseId: computer.id }] },
      teacherId: bilalTeacherId,
      level: "ADVANCED",
      progress: 85,
      status: "ACTIVE",
      notes: { create: [{ note: "Completed MS Word module." }] },
    },
  });

  await prisma.student.upsert({
    where: { email: "areeba.khan@example.com" },
    update: {},
    create: {
      name: "Areeba Khan",
      email: "areeba.khan@example.com",
      enrollments: { create: [{ courseId: computer.id }] },
      teacherId: null,
      level: "BEGINNER",
      progress: 10,
      status: "INACTIVE",
    },
  });

  console.log("Seed complete.");
  console.log("Admin login:   admin@edusphereacademy.com / Admin@12345");
  console.log("Teacher login: hafsa.siddiqui@edusphereacademy.com / Teacher@12345");
  console.log("Teacher login: bilal.ahmed@edusphereacademy.com / Teacher@12345");
  console.log("Staff login:   sana.tariq@edusphereacademy.com / Staff@12345");
  console.log("Student login: ali.raza@example.com / Student@12345 (userId:", aliUser.id, ")");
  console.log("Parent login:  muhammad.raza@example.com / Parent@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
