// =============================================
// ClasesYa - Script: promover una cuenta a ADMIN
// Uso:  node scripts/promover-admin.js correo@ejemplo.com
//
// El registro normal no permite crear administradores (por seguridad), así que
// el primer admin se crea promoviendo una cuenta existente con este script.
// Requiere la variable DATABASE_URL apuntando a la base de datos objetivo.
// =============================================

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: node scripts/promover-admin.js <email>");
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    console.error(`No existe ninguna cuenta con el email "${email}".`);
    console.error("Regístrate primero en la app con ese correo y vuelve a ejecutar el script.");
    process.exit(1);
  }

  const actualizado = await prisma.usuario.update({
    where: { email },
    data: { rol: "ADMIN" },
    select: { id: true, nombre: true, email: true, rol: true },
  });

  console.log(`✅ Cuenta promovida a ADMIN:`);
  console.log(`   ${actualizado.nombre} <${actualizado.email}> → ${actualizado.rol}`);
  console.log("   Cierra sesión y vuelve a entrar para que el nuevo rol tome efecto.");
}

main()
  .catch((e) => {
    console.error("Error promoviendo la cuenta:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
