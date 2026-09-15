"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  studentSchema,
  StudentSchema,
  teacherSchema,
  TeacherSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createStudent,
  createTeacher,
  updateStudent,
  updateTeacher,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import DateTimePicker from "../DateTimePicker";
import { getStudentUsernameBase } from "@/lib/studentCredentials";
import { getStudentGroupName } from "@/lib/badgeCatalog";

const toDateValue = (value?: Date | string) => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().split("T")[0];
};

const StudentForm = ({
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
  const availableClass = relatedData?.classes?.find(
    (item: { capacity: number; _count: { students: number } }) =>
      item._count.students < item.capacity
  ) || relatedData?.classes?.[0];
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      birthday: toDateValue(data?.birthday) as any,
      classId: data?.classId || availableClass?.id,
      gradeId: data?.gradeId || availableClass?.gradeId || relatedData?.grades?.[0]?.id,
      group: relatedData?.initialGroup || "navegantes",
    },
  });

  const [img, setImg] = useState<any>();
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const birthdayValue = watch("birthday") as unknown as string | undefined;
  const nameValue = watch("name") || "";
  const surnameValue = watch("surname") || "";
  const groupValue = watch("group");

  useEffect(() => {
    if (type !== "create") return;
    setValue("username", getStudentUsernameBase(nameValue, surnameValue), {
      shouldValidate: false,
    });
  }, [type, nameValue, surnameValue, setValue]);

  useEffect(() => {
    if (type !== "create" || !birthdayValue) return;
    const groupName = getStudentGroupName(new Date(birthdayValue));
    const groupByName = {
      Navegantes: "navegantes",
      Pioneros: "pioneros",
      Seguidores: "seguidores",
      Exploradores: "exploradores",
    } as const;
    const ageGroup = groupByName[groupName as keyof typeof groupByName];
    if (ageGroup) setValue("group", ageGroup);
  }, [type, birthdayValue, setValue]);

  const [state, formAction] = useFormState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
      username: undefined as string | undefined,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction({ ...data, img: img?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(type === "create" && state.username
        ? `Muchacho creado. Usuario: ${state.username}`
        : `Muchacho ${type === "create" ? "creado" : "actualizado"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear nuevo muchacho" : "Actualizar muchacho"}
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
          inputProps={type === "create" ? { readOnly: true } : undefined}
        />
        <InputField
          label="Correo"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        {type === "update" && (
          <InputField
            label="Contrasena"
            name="password"
            type="password"
            register={register}
            error={errors?.password}
          />
        )}
      </div>
      <span className="text-xs text-gray-500 font-medium">
        Informacion personal
      </span>
      {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result, { widget }) => {
            setImg(result.info);
            widget.close();
          }}
        >
          {({ open }) => (
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-gray-500"
              onClick={() => open()}
            >
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Subir foto</span>
            </button>
          )}
        </CldUploadWidget>
      )}
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
        <input type="hidden" {...register("birthday")} />
        <div className="w-full md:w-1/4">
          <DateTimePicker
            id="student-birthday"
            label="Fecha de nacimiento (opcional)"
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
        <div className="flex w-full flex-col gap-2 md:w-1/4">
          <label htmlFor="student-group" className="text-xs text-gray-500">Grupo</label>
          <select
            id="student-group"
            className="w-full rounded-md p-2 text-sm ring-[1.5px] ring-gray-300"
            {...register("group")}
            value={groupValue}
          >
            <option value="navegantes">Navegantes (5-7 años)</option>
            <option value="pioneros">Pioneros (8-10 años)</option>
            <option value="seguidores">Seguidores (11-14 años)</option>
            <option value="exploradores">Exploradores (15-17 años)</option>
          </select>
          {errors.group?.message && <p className="text-xs text-lamaPurple">{errors.group.message}</p>}
        </div>
        <InputField
          label="ID del padre (opcional)"
          name="parentId"
          defaultValue={data?.parentId}
          register={register}
          error={errors.parentId}
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
        <input type="hidden" {...register("gradeId")} />
        <input type="hidden" {...register("classId")} />
      </div>
      {state.error && (
        <span className="text-lamaPurple">Algo salio mal!</span>
      )}
      <button type="submit" className="bg-lamaSky text-white p-2 rounded-md">
        {type === "create" ? "Crear" : "Actualizar"}
      </button>
    </form>
  );
};

export default StudentForm;



