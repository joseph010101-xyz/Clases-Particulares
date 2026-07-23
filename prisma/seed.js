// =============================================
// ClasesYa - Seed de base de datos
// Carga datos iniciales para desarrollo y testing
// Ejecutar: npx prisma db seed
// =============================================

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Limpiar datos existentes (en orden por dependencias)
  await prisma.resena.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.disponibilidad.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.usuario.deleteMany();

  // Crear contraseña hasheada para los usuarios de prueba
  const passwordHash = await bcrypt.hash("123456", 10);

  // ---- Crear profesores ----
  const profesor1 = await prisma.usuario.create({
    data: {
      nombre: "María García López",
      email: "maria@ejemplo.com",
      password: passwordHash,
      rol: "PROFESOR",
      bio: "Profesora de matemáticas con 10 años de experiencia. Especializada en cálculo y álgebra universitaria.",
      ubicacion: "Madrid",
      telefono: "+34 612 345 678",
    },
  });

  const profesor2 = await prisma.usuario.create({
    data: {
      nombre: "Carlos Rodríguez Sánchez",
      email: "carlos@ejemplo.com",
      password: passwordHash,
      rol: "PROFESOR",
      bio: "Ingeniero de software y profesor de programación. Enseño Python, JavaScript y desarrollo web.",
      ubicacion: "Barcelona",
      telefono: "+34 623 456 789",
    },
  });

  const profesor3 = await prisma.usuario.create({
    data: {
      nombre: "Ana Martínez Ruiz",
      email: "ana@ejemplo.com",
      password: passwordHash,
      rol: "PROFESOR",
      bio: "Licenciada en Filología Inglesa. Preparo para exámenes Cambridge y TOEFL.",
      ubicacion: "Valencia",
    },
  });

  // ---- Crear estudiantes ----
  const estudiante1 = await prisma.usuario.create({
    data: {
      nombre: "Pedro Fernández Gil",
      email: "pedro@ejemplo.com",
      password: passwordHash,
      rol: "ESTUDIANTE",
      ubicacion: "Madrid",
    },
  });

  const estudiante2 = await prisma.usuario.create({
    data: {
      nombre: "Laura Díaz Torres",
      email: "laura@ejemplo.com",
      password: passwordHash,
      rol: "ESTUDIANTE",
      ubicacion: "Barcelona",
    },
  });

  // ---- Crear servicios ----
  const servicio1 = await prisma.servicio.create({
    data: {
      profesorId: profesor1.id,
      materia: "Matemáticas",
      descripcion: "Clases de matemáticas para todos los niveles. Cálculo, álgebra, estadística y geometría. Metodología práctica con ejercicios resueltos.",
      precioHora: 25.00,
      modalidad: "AMBOS",
      nivel: "Universitario",
      duracionMin: 60,
    },
  });

  const servicio2 = await prisma.servicio.create({
    data: {
      profesorId: profesor2.id,
      materia: "Programación en Python",
      descripcion: "Aprende Python desde cero hasta nivel avanzado. Cubro fundamentos, POO, estructuras de datos y proyectos reales.",
      precioHora: 30.00,
      modalidad: "VIRTUAL",
      nivel: "Todos los niveles",
      duracionMin: 90,
    },
  });

  await prisma.servicio.create({
    data: {
      profesorId: profesor2.id,
      materia: "JavaScript y React",
      descripcion: "Desarrollo web frontend con JavaScript moderno y React. Incluye Next.js, TypeScript y proyectos prácticos.",
      precioHora: 35.00,
      modalidad: "VIRTUAL",
      nivel: "Intermedio",
      duracionMin: 60,
    },
  });

  const servicio4 = await prisma.servicio.create({
    data: {
      profesorId: profesor3.id,
      materia: "Inglés",
      descripcion: "Clases de inglés personalizadas. Conversación, gramática y preparación de exámenes Cambridge (B1, B2, C1).",
      precioHora: 20.00,
      modalidad: "AMBOS",
      nivel: "Todos los niveles",
      duracionMin: 60,
    },
  });

  // ---- Crear disponibilidad ----
  // Profesor 1: Lunes a Viernes, 9:00-14:00 y 16:00-20:00
  for (let dia = 0; dia <= 4; dia++) {
    await prisma.disponibilidad.create({
      data: { profesorId: profesor1.id, diaSemana: dia, horaInicio: "09:00", horaFin: "14:00" },
    });
    await prisma.disponibilidad.create({
      data: { profesorId: profesor1.id, diaSemana: dia, horaInicio: "16:00", horaFin: "20:00" },
    });
  }

  // Profesor 2: Lunes a Sábado (solo tardes)
  for (let dia = 0; dia <= 5; dia++) {
    await prisma.disponibilidad.create({
      data: { profesorId: profesor2.id, diaSemana: dia, horaInicio: "15:00", horaFin: "21:00" },
    });
  }

  // Profesor 3: Martes, Jueves y Sábado
  for (const dia of [1, 3, 5]) {
    await prisma.disponibilidad.create({
      data: { profesorId: profesor3.id, diaSemana: dia, horaInicio: "10:00", horaFin: "18:00" },
    });
  }

  // ---- Crear reservas ----
  const reserva1 = await prisma.reserva.create({
    data: {
      servicioId: servicio1.id,
      estudianteId: estudiante1.id,
      fecha: new Date("2026-04-05"),
      horaInicio: "10:00",
      horaFin: "11:00",
      estado: "COMPLETADA",
      notas: "Necesito repasar integrales para el examen.",
    },
  });

  await prisma.reserva.create({
    data: {
      servicioId: servicio2.id,
      estudianteId: estudiante2.id,
      fecha: new Date("2026-04-07"),
      horaInicio: "16:00",
      horaFin: "17:30",
      estado: "CONFIRMADA",
    },
  });

  await prisma.reserva.create({
    data: {
      servicioId: servicio4.id,
      estudianteId: estudiante1.id,
      fecha: new Date("2026-04-10"),
      horaInicio: "11:00",
      horaFin: "12:00",
      estado: "PENDIENTE",
    },
  });

  // ---- Crear reseñas (solo para reservas completadas) ----
  await prisma.resena.create({
    data: {
      reservaId: reserva1.id,
      calificacion: 5,
      comentario: "Excelente profesora, explica muy bien los conceptos difíciles. Aprobé mi examen gracias a ella.",
    },
  });

  console.log("✅ Seed completado exitosamente");
  console.log(`   - ${3} profesores creados`);
  console.log(`   - ${2} estudiantes creados`);
  console.log(`   - ${4} servicios creados`);
  console.log(`   - ${3} reservas creadas`);
  console.log(`   - ${1} reseña creada`);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
