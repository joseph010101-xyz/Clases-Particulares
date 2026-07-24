// =============================================
// ClasesYa - Schemas de validación con Zod
// Validaciones reutilizables para API routes y formularios
// =============================================

import { z } from "zod";

// ---- AUTH ----

// Validación para registro de usuario
export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("Debe ser un email válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
  rol: z.enum(["PROFESOR", "ESTUDIANTE"], {
    message: "El rol debe ser PROFESOR o ESTUDIANTE",
  }),
});

// Validación para login
export const loginSchema = z.object({
  email: z.string().email("Debe ser un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

// ---- SERVICIOS ----

// Validación para crear/editar un servicio
export const servicioSchema = z.object({
  materia: z
    .string()
    .trim()
    .min(2, "La materia debe tener al menos 2 caracteres")
    .max(100, "La materia no puede exceder 100 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(2000, "La descripción no puede exceder 2000 caracteres"),
  precioHora: z
    .number()
    .positive("El precio debe ser mayor a 0")
    .max(999999, "El precio es demasiado alto"),
  modalidad: z.enum(["PRESENCIAL", "VIRTUAL", "AMBOS"], {
    message: "Modalidad inválida",
  }),
  categoriaId: z.string().uuid("ID de categoría inválido").optional(),
  nivel: z.string().max(50).optional(),
  duracionMin: z
    .number()
    .int()
    .min(15, "La duración mínima es 15 minutos")
    .max(480, "La duración máxima es 8 horas")
    .optional(),
});

// ---- RESERVAS ----

// Validación para crear una reserva
export const reservaSchema = z.object({
  servicioId: z.string().uuid("ID de servicio inválido"),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha inválida",
  }),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)"),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)"),
  notas: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
}).refine((data) => data.horaFin > data.horaInicio, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["horaFin"],
});

// ---- RESEÑAS ----

// Validación para crear una reseña
export const resenaSchema = z.object({
  reservaId: z.string().uuid("ID de reserva inválido"),
  calificacion: z
    .number()
    .int()
    .min(1, "La calificación mínima es 1")
    .max(5, "La calificación máxima es 5"),
  comentario: z.string().max(1000, "El comentario no puede exceder 1000 caracteres").optional(),
});

// ---- DISPONIBILIDAD ----

// Validación para crear disponibilidad
export const disponibilidadSchema = z.object({
  diaSemana: z
    .number()
    .int()
    .min(0, "Día inválido")
    .max(6, "Día inválido"),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)"),
  horaFin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)"),
}).refine((data) => data.horaFin > data.horaInicio, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["horaFin"],
});

// ---- PERFIL ----

// Validación para actualizar perfil de usuario
export const perfilSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  telefono: z.string().max(20).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  ubicacion: z.string().max(200).optional().nullable(),
  foto: z.string().url("URL de foto inválida").optional().nullable(),
});

// ---- MENSAJES ----

// Validación para enviar un mensaje
export const mensajeSchema = z.object({
  receptorId: z.string().uuid("ID de receptor inválido"),
  contenido: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede exceder 2000 caracteres"),
});

// ---- CATEGORÍAS ----

// Validación para crear/editar una categoría (solo admin)
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  descripcion: z.string().max(500).optional(),
  icono: z.string().max(50).optional(),
});

// ---- AULA VIRTUAL ----

// Validación para crear/editar un curso
export const cursoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150, "El título no puede exceder 150 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(3000, "La descripción no puede exceder 3000 caracteres"),
});

// Validación para el título de un material (el archivo se valida aparte)
export const materialSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(150, "El título no puede exceder 150 caracteres"),
});

// Validación para crear una tarea
export const tareaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150, "El título no puede exceder 150 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(3000, "La descripción no puede exceder 3000 caracteres"),
  // Fecha límite opcional en formato ISO o datetime-local
  fechaLimite: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || !isNaN(Date.parse(v)), { message: "Fecha límite inválida" }),
});

// Validación para calificar una entrega
export const calificacionSchema = z.object({
  calificacion: z
    .number()
    .int()
    .min(0, "La calificación mínima es 0")
    .max(100, "La calificación máxima es 100"),
  retroalimentacion: z
    .string()
    .max(2000, "La retroalimentación no puede exceder 2000 caracteres")
    .optional()
    .nullable(),
});

// ---- TIPOS INFERIDOS ----
// Estos tipos se pueden usar en el frontend y backend

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ServicioInput = z.infer<typeof servicioSchema>;
export type ReservaInput = z.infer<typeof reservaSchema>;
export type ResenaInput = z.infer<typeof resenaSchema>;
export type DisponibilidadInput = z.infer<typeof disponibilidadSchema>;
export type PerfilInput = z.infer<typeof perfilSchema>;
export type MensajeInput = z.infer<typeof mensajeSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
