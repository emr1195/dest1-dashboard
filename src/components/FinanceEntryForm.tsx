"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const FinanceEntryForm = () => {
  const router = useRouter();
  const [type, setType] = useState("INGRESO");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selectReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    setReceipt(event.target.files?.[0] || null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("type", type);
    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("amount", amount);
    formData.append("date", date);
    if (receipt) formData.append("receipt", receipt);

    try {
      const response = await fetch("/api/finances", { method: "POST", body: formData });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.message || "No se pudo guardar el movimiento.");
        return;
      }

      setType("INGRESO");
      setCategory("");
      setTitle("");
      setDescription("");
      setAmount("");
      setDate("");
      setReceipt(null);
      setMessage("Movimiento registrado.");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
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
          {(type === "INGRESO"
            ? ["Ofrendas", "Ventas", "Donaciones"]
            : ["Pago", "Reembolso", "Deuda"]
          ).map((option) => (
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
          placeholder="0.00"
          className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-gray-600 lg:col-span-3">
        Nombre del ingreso o gasto
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder="Nombre del movimiento"
          className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-gray-600 lg:col-span-3">
        Descripcion
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          placeholder="Detalle del ingreso o gasto"
          className="min-h-28 resize-y rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-gray-600 lg:col-span-2">
        Fecha
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
          className="rounded-md border border-gray-300 p-3 outline-none focus:border-lamaSky"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Factura o comprobante (opcional)
        <input
          type="file"
          accept="image/*"
          onChange={selectReceipt}
          className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-lamaSky file:px-3 file:py-3 file:text-white"
        />
        {receipt && <span className="text-xs text-gray-500">{receipt.name}</span>}
      </label>
      {message && <p className="text-sm text-lamaSky lg:col-span-3">{message}</p>}
      <div className="lg:col-span-3">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-lamaSky px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Registrar movimiento"}
        </button>
      </div>
    </form>
  );
};

export default FinanceEntryForm;
