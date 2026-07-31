"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  examSchema,
  ExamSchema,
  subjectSchema,
  SubjectSchema,
} from "@/lib/formValidationSchemas";
import {
  createExam,
  createSubject,
  updateExam,
  updateSubject,
} from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import DateTimePicker from "../DateTimePicker";

const toDateTimeLocal = (value?: Date | string) => {
  if (!value) return undefined;

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const ExamForm = ({
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
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: data?.title || "",
      startTime: toDateTimeLocal(data?.startTime) as any,
      endTime: toDateTimeLocal(data?.endTime) as any,
      lessonId: data?.lessonId,
    },
  });

  // AFTER REACT 19 IT'LL BE USEACTIONSTATE

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const startTimeValue = watch("startTime") as unknown as string | undefined;
  const endTimeValue = watch("endTime") as unknown as string | undefined;

  useEffect(() => {
    if (state.success) {
      toast(`Examen ${type === "create" ? "creado" : "actualizado"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { lessons } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear nuevo examen" : "Actualizar examen"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Titulo del examen"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <input type="hidden" {...register("startTime")} />
        <input type="hidden" {...register("endTime")} />
        <div className="w-full md:w-1/4">
          <DateTimePicker
            id="exam-start-time"
            label="Fecha de inicio"
            required
            value={startTimeValue}
            onChange={(value) =>
              setValue("startTime", value as any, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.startTime?.message?.toString()}
            openPicker={openDatePicker}
            setOpenPicker={setOpenDatePicker}
          />
        </div>
        <div className="w-full md:w-1/4">
          <DateTimePicker
            id="exam-end-time"
            label="Fecha de fin"
            required
            value={endTimeValue}
            onChange={(value) =>
              setValue("endTime", value as any, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.endTime?.message?.toString()}
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
          <label className="text-xs text-gray-500">Leccion</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            defaultValue={data?.teachers}
          >
            {lessons.map((lesson: { id: number; name: string }) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-lamaPurple">
              {errors.lessonId.message.toString()}
            </p>
          )}
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

export default ExamForm;

