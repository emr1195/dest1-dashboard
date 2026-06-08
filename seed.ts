import { PrismaClient, UserSex } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "crypto";

const prisma = new PrismaClient();

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");

  return `${salt}:${hash}`;
};

const seedPassword = "Prueba123";

async function upsertAuthUser(data: {
  id: string;
  email: string;
  name: string;
  role: string;
  sex?: UserSex;
}) {
  await prisma.authUser.upsert({
    where: { email: data.email },
    update: {
      id: data.id,
      name: data.name,
      role: data.role,
      sex: data.sex,
    },
    create: {
      ...data,
      passwordHash: hashPassword(seedPassword),
      provider: "credentials",
    },
  });
}

async function main() {
  await prisma.admin.upsert({
    where: { id: "admin1" },
    update: { username: "admin1" },
    create: {
      id: "admin1",
      username: "admin1",
    },
  });

  const grade = await prisma.grade.upsert({
    where: { level: 1 },
    update: {},
    create: { level: 1 },
  });

  const classItem = await prisma.class.upsert({
    where: { name: "1A" },
    update: {
      capacity: 20,
      gradeId: grade.id,
      supervisorId: null,
    },
    create: {
      name: "1A",
      capacity: 20,
      gradeId: grade.id,
    },
  });

  await prisma.parent.upsert({
    where: { id: "padre-prueba-001" },
    update: {
      username: "padre.prueba",
      name: "Padre",
      surname: "Prueba",
      email: "padre.prueba@destacamento.local",
      phone: "809-000-0003",
      address: "Destacamento",
    },
    create: {
      id: "padre-prueba-001",
      username: "padre.prueba",
      name: "Padre",
      surname: "Prueba",
      email: "padre.prueba@destacamento.local",
      phone: "809-000-0003",
      address: "Destacamento",
    },
  });

  await prisma.lider.upsert({
    where: { id: "lider-prueba-001" },
    update: {
      username: "lider.prueba",
      name: "Lider",
      surname: "Prueba",
      email: "lider.prueba@destacamento.local",
      phone: "809-000-0001",
      address: "Destacamento",
      bloodType: "O+",
      sex: UserSex.MALE,
      birthday: new Date("1990-01-01T00:00:00.000Z"),
    },
    create: {
      id: "lider-prueba-001",
      username: "lider.prueba",
      name: "Lider",
      surname: "Prueba",
      email: "lider.prueba@destacamento.local",
      phone: "809-000-0001",
      address: "Destacamento",
      bloodType: "O+",
      sex: UserSex.MALE,
      birthday: new Date("1990-01-01T00:00:00.000Z"),
    },
  });

  await prisma.muchacho.upsert({
    where: { id: "muchacho-prueba-001" },
    update: {
      username: "muchacho.prueba",
      name: "Muchacho",
      surname: "Prueba",
      email: "muchacho.prueba@destacamento.local",
      phone: "809-000-0002",
      address: "Destacamento",
      bloodType: "O+",
      sex: UserSex.MALE,
      parentId: "padre-prueba-001",
      gradeId: grade.id,
      classId: classItem.id,
      birthday: new Date("2012-01-01T00:00:00.000Z"),
    },
    create: {
      id: "muchacho-prueba-001",
      username: "muchacho.prueba",
      name: "Muchacho",
      surname: "Prueba",
      email: "muchacho.prueba@destacamento.local",
      phone: "809-000-0002",
      address: "Destacamento",
      bloodType: "O+",
      sex: UserSex.MALE,
      parentId: "padre-prueba-001",
      gradeId: grade.id,
      classId: classItem.id,
      birthday: new Date("2012-01-01T00:00:00.000Z"),
    },
  });

  await upsertAuthUser({
    id: "lider-prueba-001",
    email: "lider.prueba@destacamento.local",
    name: "Lider Prueba",
    role: "teacher",
    sex: UserSex.MALE,
  });
  await upsertAuthUser({
    id: "muchacho-prueba-001",
    email: "muchacho.prueba@destacamento.local",
    name: "Muchacho Prueba",
    role: "student",
    sex: UserSex.MALE,
  });
  await upsertAuthUser({
    id: "padre-prueba-001",
    email: "padre.prueba@destacamento.local",
    name: "Padre Prueba",
    role: "parent",
  });

  console.log("Seed minimo completado sin data dummy.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
