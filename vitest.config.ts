import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Configuración de Vitest. Las pruebas cubren la lógica de dominio pura
// (src/lib/dominio), que no depende de Prisma ni de Next, por lo que corren en
// entorno node sin base de datos. El alias "@" replica el de tsconfig por si
// futuras pruebas importan desde "@/...".
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
