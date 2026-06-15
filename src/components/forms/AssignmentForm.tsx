"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { createAssignment, updateAssignment } from "@/lib/actions";
import {
  assignmentSchema,
  AssignmentSchema,
} from "@/lib/formValidationSchemas";
import InputField from "../InputField";

const assignmentCategories = [
  "Premio de adiestramiento",
  "Estudio biblico",
  "Premio liderazgo",
] as const;

const assignmentPoints = [25, 50, 75, 100];

const getAssignmentCategory = (category?: string) => {
  if (category === "Premio de destreza") return "Premio de adiestramiento";
  if (category === "Premio de liderazgo") return "Premio liderazgo";
  return category || "";
};

const toDateTimeLocal = (value?: Date | string) => {
  if (!value) return undefined;

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const AssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const awardImageInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
  });

  const router = useRouter();
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAwardImage, setSelectedAwardImage] = useState<File | null>(null);

  const uploadAssignmentFile = async (
    assignmentId: number,
    file: File,
    fileKind?: "award-image"
  ) => {
    const uploadData = new FormData();
    uploadData.append("assignmentId", String(assignmentId));
    uploadData.append("file", file);
    if (fileKind) uploadData.append("fileKind", fileKind);

    const response = await fetch("/api/assignment-files", {
      method: "POST",
      body: uploadData,
    });

    return response.ok;
  };

  const onSubmit = handleSubmit(async (formData) => {
    setError(false);
    setSaving(true);

    const action = type === "create" ? createAssignment : updateAssignment;
    const result = await action({ success: false, error: false }, formData);

    if (result.success) {
      const assignmentId = result.id || formData.id;
      const uploadResults = assignmentId
        ? await Promise.all([
            selectedFile
              ? uploadAssignmentFile(assignmentId, selectedFile)
              : Promise.resolve(true),
            selectedAwardImage
              ? uploadAssignmentFile(
                  assignmentId,
                  selectedAwardImage,
                  "award-image"
                )
              : Promise.resolve(true),
          ])
        : [!selectedFile && !selectedAwardImage];
      const fileSaved = uploadResults.every(Boolean);

      setSaving(false);

      if (!fileSaved) {
        toast("La tarea se guardo, pero el archivo no pudo subirse.");
        setError(true);
        return;
      }

      toast(`Tarea ${type === "create" ? "creada" : "actualizada"}!`);
      setOpen(false);
      router.refresh();
      return;
    }

    setSaving(false);
    setError(true);
  });

  const lessons = relatedData?.lessons || [];
  const defaultLessonId = data?.lessonId || lessons[0]?.id;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear nueva tarea" : "Actualizar tarea"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nombre de la tarea"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Descripcion</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full min-h-28"
            defaultValue={data?.description || ""}
            placeholder="Escribe las instrucciones o informacion necesaria para esta tarea"
            {...register("description")}
          />
          {errors.description?.message && (
            <p className="text-xs text-lamaPurple">
              {errors.description.message.toString()}
            </p>
          )}
        </div>
        <InputField
          label="Fecha de inicio"
          name="startDate"
          defaultValue={toDateTimeLocal(data?.startDate)}
          register={register}
          error={errors?.startDate}
          type="datetime-local"
        />
        <InputField
          label="Fecha limite"
          name="dueDate"
          defaultValue={toDateTimeLocal(data?.dueDate)}
          register={register}
          error={errors?.dueDate}
          type="datetime-local"
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        {defaultLessonId && (
          <input
            type="hidden"
            value={defaultLessonId}
            {...register("lessonId")}
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Categoria</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("category")}
            defaultValue={getAssignmentCategory(data?.category)}
          >
            <option value="" disabled>
              Seleccionar
            </option>
            {assignmentCategories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category?.message && (
            <p className="text-xs text-lamaPurple">
              {errors.category.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Puntaje</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("points")}
            defaultValue={data?.points || 25}
          >
            {assignmentPoints.map((points) => (
              <option value={points} key={points}>
                {points} puntos
              </option>
            ))}
          </select>
          {errors.points?.message && (
            <p className="text-xs text-lamaPurple">
              {errors.points.message.toString()}
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2">
          <label className="text-xs text-gray-500">Imagen del premio</label>
          <input
            ref={awardImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              setSelectedAwardImage(event.target.files?.[0] || null)
            }
          />
          <div className="flex flex-col gap-3 rounded-md border border-dashed border-lamaSky p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700">
                {selectedAwardImage
                  ? selectedAwardImage.name
                  : "Selecciona la imagen del premio a ganar"}
              </p>
              <p className="text-xs text-gray-500">
                Esta imagen se mostrara como el premio asociado a la tarea.
              </p>
            </div>
            <div className="flex gap-2">
              {selectedAwardImage && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAwardImage(null);
                    if (awardImageInputRef.current) {
                      awardImageInputRef.current.value = "";
                    }
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600"
                >
                  Quitar
                </button>
              )}
              <button
                type="button"
                onClick={() => awardImageInputRef.current?.click()}
                className="rounded-md bg-lamaSky px-4 py-2 text-sm font-semibold text-white"
              >
                Subir imagen
              </button>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2">
          <label className="text-xs text-gray-500">Archivo de la tarea</label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] || null)
            }
          />
          <div className="flex flex-col gap-3 rounded-md border border-dashed border-lamaSky p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700">
                {selectedFile
                  ? selectedFile.name
                  : "Selecciona el documento que acompana esta tarea"}
              </p>
              <p className="text-xs text-gray-500">
                Puedes subir un archivo por tarea desde este formulario.
              </p>
            </div>
            <div className="flex gap-2">
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600"
                >
                  Quitar
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-lamaSky px-4 py-2 text-sm font-semibold text-white"
              >
                Subir archivo
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <span className="text-lamaPurple">Algo salio mal!</span>
      )}
      <button
        type="submit"
        disabled={saving}
        className="bg-lamaSky text-white p-2 rounded-md disabled:opacity-60"
      >
        {saving ? "Guardando..." : type === "create" ? "Crear" : "Actualizar"}
      </button>
    </form>
  );
};

export default AssignmentForm;
