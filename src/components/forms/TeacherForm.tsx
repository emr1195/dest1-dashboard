"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DateTimePicker from "../DateTimePicker";

const toDateValue = (value?: Date | string) => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().split("T")[0];
};

const TeacherForm = ({
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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      birthday: toDateValue(data?.birthday) as any,
    },
  });

  const [img, setImg] = useState<string>(data?.img || "");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const birthdayValue = watch("birthday") as unknown as string | undefined;

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction({ ...data, img: img || undefined });
  });

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImg(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Lider ${type === "create" ? "creado" : "actualizado"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const subjects = relatedData?.subjects || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear nuevo lider" : "Actualizar lider"}
      </h1>
      <span className="text-xs text-gray-500 font-medium">
        Informacion de autenticacion
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Usuario"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Correo"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Contrasena"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-500 font-medium">
        Informacion personal
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nombre"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Apellido"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Telefono"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Direccion"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Tipo de sangre"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <input type="hidden" {...register("birthday")} />
        <div className="w-full md:w-1/4">
          <DateTimePicker
            id="teacher-birthday"
            label="Fecha de nacimiento"
            required
            dateOnly
            value={birthdayValue}
            onChange={(value) =>
              setValue("birthday", value as any, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.birthday?.message?.toString()}
            openPicker={openDatePicker}
            setOpenPicker={setOpenDatePicker}
          />
        </div>
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sexo</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-lamaPurple">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">AS</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjects")}
            defaultValue={data?.subjects}
          >
            {subjects.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjects?.message && (
            <p className="text-xs text-lamaPurple">
              {errors.subjects.message.toString()}
            </p>
          )}
        </div>
        <div className="flex w-full items-center gap-3 md:w-1/2">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={selectPhoto}
            className="hidden"
          />
          {img ? (
            <Image
              src={img}
              alt="Vista previa de la fotografía del líder"
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
            </span>
          )}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="min-h-11 rounded-xl border border-[var(--border-default)] px-4 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary-soft)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]"
          >
            {img ? "Cambiar fotografía" : "Subir fotografía"}
          </button>
        </div>
      </div>
      {state.error && (
        <span className="text-lamaPurple">Algo salio mal!</span>
      )}
      <button className="bg-lamaSky text-white p-2 rounded-md">
        {type === "create" ? "Crear" : "Actualizar"}
      </button>
    </form>
  );
};

export default TeacherForm;



