# ClasesYa

Marketplace de clases particulares que conecta profesores y estudiantes.
Next.js 14 (App Router) + PostgreSQL vía Prisma. Toda la interfaz y el dominio
están en español.

## Desarrollo local

Requisitos: Node 20+ y una base de datos PostgreSQL.

```bash
npm install
cp .env.example .env      # completa DATABASE_URL y JWT_SECRET (host: localhost fuera de Docker)
npx prisma db push        # crea el esquema
npx prisma db seed        # datos de prueba (usuarios con password 123456)
npm run dev               # http://localhost:3000
```

Con Docker (Next.js + PostgreSQL):

```bash
docker compose up --build
```

## Pruebas

La lógica de negocio pura vive en `src/lib/dominio/` (solapamientos de horarios,
conversión de día de la semana, promedio de calificaciones y máquina de estados
de las reservas) y está cubierta por pruebas unitarias con Vitest, sin necesidad
de base de datos.

```bash
npm test          # ejecuta la suite una vez
npm run test:watch
```

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción (output: standalone)
npm run lint     # ESLint
npm test         # pruebas unitarias (Vitest)

npx prisma db push    # sincroniza el esquema (no se usan archivos de migración)
npx prisma db seed    # carga datos de prueba (borra los existentes)
npx prisma generate   # regenera el cliente tras cambios de esquema
```

## Variables de entorno

| Variable       | Requerida | Descripción |
|----------------|-----------|-------------|
| `DATABASE_URL` | Sí        | Cadena de conexión a PostgreSQL. |
| `JWT_SECRET`   | Sí        | Secreto para firmar los JWT de sesión. Genera uno con `openssl rand -base64 32`. |
| `TZ`           | Recomendada en producción | Zona horaria del servidor. Ver nota abajo. |
| `NODE_ENV`     | Automática | En `production` la cookie de sesión se marca `secure` automáticamente. |
| `CLOUDINARY_CLOUD_NAME` | Para el aula virtual | Almacenamiento de archivos del material. Ver abajo. |
| `CLOUDINARY_API_KEY`    | Para el aula virtual | |
| `CLOUDINARY_API_SECRET` | Para el aula virtual | |

### Almacenamiento de archivos (Cloudinary)

El material del aula virtual (`/cursos`) se sube a [Cloudinary](https://cloudinary.com)
(capa gratuita). Sin estas variables, el resto de la app funciona con normalidad
pero **subir material** devuelve un error 503 indicando que falta configurarlo.

1. Crea una cuenta gratuita en Cloudinary.
2. En el Dashboard copia **Cloud name**, **API Key** y **API Secret**.
3. Añade las tres variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`) en el servicio de la app en Railway (o en tu `.env`).

> La antigua variable `COOKIE_SECURE` ya no se usa: la cookie se marca `secure`
> cuando `NODE_ENV === "production"`.

### Zona horaria (`TZ`)

Las fechas de las reservas se guardan como día calendario y se comparan usando la
zona horaria del proceso Node. En un contenedor (Railway/Docker) el valor por
defecto es **UTC**, lo que puede desplazar el límite de "hoy" para usuarios en
otras zonas (p. ej. UTC-4). Para un despliegue de una sola región, define la
variable `TZ` con la zona local, por ejemplo:

```
TZ=America/La_Paz
```

## Administración (rol ADMIN)

Los profesores se verifican manualmente desde el panel `/admin` (insignia
"Verificado"). El registro no permite crear administradores por seguridad, así
que el primer admin se crea promoviendo una cuenta existente:

```bash
# 1) Regístrate normalmente en la app con el correo que será admin.
# 2) Con DATABASE_URL apuntando a la base de datos objetivo, ejecuta:
node scripts/promover-admin.js tu-correo@ejemplo.com
```

Tras promoverla, cierra sesión y vuelve a entrar: aparecerá "Administración" en
el menú. Para hacerlo contra la base de Railway, usa temporalmente su
`DATABASE_PUBLIC_URL` como `DATABASE_URL` al ejecutar el script.

## Despliegue en Railway

El repositorio incluye `Dockerfile` y `entrypoint.sh`; Railway detecta el
`Dockerfile` y construye la imagen. El `entrypoint.sh` ejecuta `prisma db push`
al arrancar, por lo que el esquema se sincroniza en cada despliegue. Variables a
configurar en el servicio de la app: `DATABASE_URL` (referencia a
`${{Postgres.DATABASE_URL}}`), `JWT_SECRET`, `PORT=3000` y, recomendado, `TZ`.
