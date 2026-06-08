"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FinanceTransactionItem = {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  receiptImage: string | null;
};

const CATEGORIES = {
  INGRESO: ["Ofrendas", "Ventas", "Donaciones"],
  GASTO: ["Pago", "Reembolso", "Deuda"],
} as const;

const getDateInputValue = (date: string) => date.slice(0, 10);

const formatDate = (date: string) => new Intl.DateTimeFormat("es-PA").format(new Date(date));

const FinanceTransactionsList = ({ transactions }: { transactions: FinanceTransactionItem[] }) => {
  const router = useRouter();
  const [editing, setEditing] = useState<FinanceTransactionItem | null>(null);
  const [type, setType] = useState("INGRESO");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const openEditor = (transaction: FinanceTransactionItem) => {
    setEditing(transaction);
    setType(transaction.type);
    setCategory(transaction.category === "Sin categoria" ? "" : transaction.category);
    setTitle(transaction.title);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
    setDate(getDateInputValue(transaction.date));
    setReceipt(null);
    setMessage("");
  };

  const selectReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    setReceipt(event.target.files?.[0] || null);
  };

  const closeEditor = () => {
    setEditing(null);
    setMessage("");
    setReceipt(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("id", editing.id);
    formData.append("type", type);
    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("amount", amount);
    formData.append("date", date);
    if (receipt) formData.append("receipt", receipt);

    try {
      const response = await fetch("/api/finances", { method: "PATCH", body: formData });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message || "No se pudo actualizar el movimiento.");
        return;
      }

      closeEditor();
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  if (transactions.length === 0) {
    return <p className="text-sm text-gray-500">No hay movimientos registrados.</p>;
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="grid gap-3 py-4 md:grid-cols-[120px_1fr_150px_100px_60px] md:items-center"
          >
            <span
              className={`w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                transaction.type === "INGRESO"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {transaction.type === "INGRESO" ? "Ingreso" : "Gasto"}
            </span>
            <div>
              <p className="font-semibold text-gray-700">{transaction.title}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">{transaction.category}</p>
              <p className="mt-1 text-sm text-gray-500">{transaction.description}</p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(transaction.date)}</p>
            </div>
            <p className="font-semibold text-lamaSky">${transaction.amount.toFixed(2)}</p>
            {transaction.receiptImage ? (
              <a href={transaction.receiptImage} target="_blank" rel="noreferrer">
                <Image
                  src={transaction.receiptImage}
                  alt={`Factura de ${transaction.title}`}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded object-cover"
                />
              </a>
            ) : (
              <span className="text-xs text-gray-500">Sin factura</span>
            )}
            <button
              type="button"
              onClick={() => openEditor(transaction)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lamaSky transition hover:bg-gray-100"
              title="Editar movimiento"
            >
              <Image src="/update.png" alt="Editar" width={20} height={20} />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submit}
            className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-md bg-white p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">Editar movimiento financiero</h3>
              <button
                type="button"
                onClick={closeEditor}
                className="text-2xl leading-none text-gray-500"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Tipo de movimiento
                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setCategory("");
                  }}
                  className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="GASTO">Gasto</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Categoria
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
                >
                  <option value="">Seleccionar categoria</option>
                  {CATEGORIES[type as keyof typeof CATEGORIES].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Monto
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600 lg:col-span-3">
                Nombre del ingreso o gasto
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600 lg:col-span-3">
                Descripcion
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  className="min-h-28 resize-y rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600">
                Fecha
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-600 lg:col-span-2">
                Reemplazar factura o comprobante (opcional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={selectReceipt}
                  className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-lamaSky file:px-3 file:py-3 file:text-white"
                />
                {receipt && <span className="text-xs text-gray-500">{receipt.name}</span>}
              </label>
              {message && <p className="text-sm text-red-600 lg:col-span-3">{message}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-lamaSky px-6 py-3 text-sm font-medium text-white disabled:opacity-60 lg:col-span-3"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default FinanceTransactionsList;
