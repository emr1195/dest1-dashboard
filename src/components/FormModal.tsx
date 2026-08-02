"use client";

import {
  deleteAnnouncement,
  deleteAttendance,
  deleteClass,
  deleteEvent,
  deleteExam,
  deleteAssignment,
  deleteLesson,
  deleteParent,
  deleteResult,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
} from "@/lib/actions";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const FormLoading = () => (
  <div className="flex min-h-48 items-center justify-center p-8" role="status">
    <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[var(--primary)]" aria-hidden="true" />
    <span className="sr-only">Cargando formulario</span>
  </div>
);

const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), { loading: FormLoading });
const ClassForm = dynamic(() => import("./forms/ClassForm"), { loading: FormLoading });
const ExamForm = dynamic(() => import("./forms/ExamForm"), { loading: FormLoading });
const StudentForm = dynamic(() => import("./forms/StudentForm"), { loading: FormLoading });
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), { loading: FormLoading });
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), { loading: FormLoading });

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  assignment: deleteAssignment,
  parent: deleteParent,
  lesson: deleteLesson,
  result: deleteResult,
  attendance: deleteAttendance,
  event: deleteEvent,
  announcement: deleteAnnouncement,
};

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const DeleteSubmitButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-wait disabled:opacity-60">
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
      {pending ? "Eliminando..." : label}
    </button>
  );
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
  triggerLabel,
  triggerClassName,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const buttonClass =
    type === "create"
      ? `${size} flex items-center justify-center rounded-full bg-lamaYellow`
      : `${size} flex items-center justify-center rounded-full bg-transparent transition hover:bg-gray-100`;

  const TriggerIcon = () => {
    if (type === "update") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-lamaSky"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    }

    if (type === "delete") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-red-600"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );
    }

    return <Image src={`/${type}.png`} alt="" width={16} height={16} />;
  };

  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isAssignmentForm = table === "assignment" && type !== "delete";
  const requestClose = useCallback(() => {
    const closeEvent = new CustomEvent("codex:modal-close-request", {
      cancelable: true,
      detail: { table, type },
    });

    if (!window.dispatchEvent(closeEvent)) return;

    setOpen(false);
  }, [table, type]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerElement?.focus();
    };
  }, [open, requestClose]);

  const Form = () => {
    const [state, formAction] = useFormState(deleteActionMap[table], {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast("Registro eliminado!");
        setOpen(false);
        router.refresh();
      }

      if (state.error) {
        toast.error("No se pudo eliminar el registro.");
      }
    }, [state, router]);

    const displayName = data?.displayName as string | undefined;

    return type === "delete" && id ? (
      <form action={formAction} className="flex flex-col gap-5 p-5 sm:p-7">
        <input type="hidden" name="id" value={id} readOnly />
        <div className="pr-10">
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{table === "teacher" ? "Eliminar líder" : table === "student" ? "Eliminar muchacho" : table === "assignment" ? "Eliminar tarea" : table === "result" ? "Eliminar resultado" : "Eliminar registro"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {table === "teacher" && displayName
              ? `¿Estás seguro de que deseas eliminar a ${displayName}? Esta acción no se puede deshacer.`
              : table === "student" && displayName
                ? `¿Estás seguro de que deseas eliminar a ${displayName}? Esta acción no se puede deshacer.`
              : table === "assignment" && displayName
                ? `¿Estás seguro de que deseas eliminar la tarea “${displayName}”? Esta acción no se puede deshacer.`
              : table === "result" && displayName
                ? `¿Estás seguro de que deseas eliminar el resultado de ${displayName}? Esta acción no se puede deshacer.`
              : "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."}
          </p>
        </div>
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">No se pudo eliminar el registro. Inténtalo nuevamente.</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={requestClose} className="min-h-11 rounded-xl border border-[var(--border-default)] px-5 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--focus-ring)]">Cancelar</button>
          <DeleteSubmitButton label={table === "teacher" ? "Eliminar líder" : table === "student" ? "Eliminar muchacho" : table === "assignment" ? "Eliminar tarea" : table === "result" ? "Eliminar resultado" : "Eliminar"} />
        </div>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Formulario no encontrado!"
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={
          triggerClassName ||
          buttonClass
        }
        type="button"
        onClick={() => setOpen(true)}
      >
        {triggerLabel || <TriggerIcon />}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) requestClose();
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={
              isAssignmentForm
                ? "relative flex max-h-[90vh] w-[calc(100%-32px)] max-w-[850px] animate-[modalIn_180ms_ease-out] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none"
                : type === "delete"
                  ? "relative max-h-[92vh] w-full max-w-[520px] animate-[modalIn_180ms_ease-out] overflow-y-auto rounded-2xl border border-[var(--border-soft)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none"
                  : "relative max-h-[92vh] w-full animate-[modalIn_180ms_ease-out] overflow-y-auto rounded-md bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none sm:w-[92%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]"
            }
          >
            <Form />
            {!isAssignmentForm && (
              <button
                type="button"
                aria-label="Cerrar modal"
                className="absolute right-4 top-4 rounded-full p-2 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-lamaSky"
                onClick={requestClose}
              >
                <Image src="/close.png" alt="" width={14} height={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
