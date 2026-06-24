import { z } from "zod";

const panamaDateTimeLocalToUtc = (value: string) => {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) return new Date(value);

  const [, year, month, day, hour, minute] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) + 5,
      Number(minute)
    )
  );
};

const dateTimeField = (message: string) =>
  z.any().transform((value, ctx) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    let date = new Date("");

    if (typeof value === "string") {
      if (value.includes("T")) {
        date = panamaDateTimeLocalToUtc(value);
      } else if (value.includes("-")) {
        date = new Date(`${value}T05:00:00.000Z`);
      } else {
        const match = value.match(
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/
        );

        if (match) {
          const [, day, month, year, hour, minute] = match;
          date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute)
          );
        }
      }
    }

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      return z.NEVER;
    }

    return date;
  });

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "El nombre de la AS es obligatorio!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "El nombre del Premio B es obligatorio!" }),
  capacity: z.coerce.number().min(1, { message: "La capacidad es obligatoria!" }),
  gradeId: z.coerce.number().min(1, { message: "El grado es obligatorio!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "El usuario debe tener al menos 3 caracteres!" })
    .max(20, { message: "El usuario debe tener maximo 20 caracteres!" }),
  password: z
    .string()
    .min(8, { message: "La contrasena debe tener al menos 8 caracteres!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "El nombre es obligatorio!" }),
  surname: z.string().min(1, { message: "El apellido es obligatorio!" }),
  email: z
    .string()
    .email({ message: "Correo invalido!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "El tipo de sangre es obligatorio!" }),
  birthday: z.coerce.date({ message: "La fecha de nacimiento es obligatoria!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "El sexo es obligatorio!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "El usuario debe tener al menos 3 caracteres!" })
    .max(20, { message: "El usuario debe tener maximo 20 caracteres!" }),
  password: z
    .string()
    .min(8, { message: "La contrasena debe tener al menos 8 caracteres!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "El nombre es obligatorio!" }),
  surname: z.string().min(1, { message: "El apellido es obligatorio!" }),
  email: z
    .string()
    .email({ message: "Correo invalido!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "El tipo de sangre es obligatorio!" }),
  birthday: z.coerce.date({ message: "La fecha de nacimiento es obligatoria!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "El sexo es obligatorio!" }),
  gradeId: z.coerce.number().min(1, { message: "El grado es obligatorio!" }),
  classId: z.coerce.number().min(1, { message: "El Premio B es obligatorio!" }),
  parentId: z.string().min(1, { message: "El ID del padre es obligatorio!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "El titulo es obligatorio!" }),
  startTime: z.coerce.date({ message: "La hora de inicio es obligatoria!" }),
  endTime: z.coerce.date({ message: "La hora de fin es obligatoria!" }),
  lessonId: z.coerce.number({ message: "La leccion es obligatoria!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "El titulo es obligatorio!" }),
  description: z.string().optional(),
  startDate: dateTimeField("La fecha de inicio es obligatoria!"),
  dueDate: dateTimeField("La fecha limite es obligatoria!"),
  category: z.enum(
    ["Premio de adiestramiento", "Estudio biblico", "Premio liderazgo", "Otros"],
    { message: "La categoria es obligatoria!" }
  ),
  points: z.coerce
    .number({ message: "El puntaje es obligatorio!" })
    .refine((value) => [25, 50, 75, 100].includes(value), {
      message: "Selecciona un puntaje valido!",
    }),
  lessonId: z.coerce.number().optional(),
  createdById: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().optional()
  ),
  assignmentGroup: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .enum(["navegantes", "pioneros", "seguidores", "exploradores"])
      .optional()
  ),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;
