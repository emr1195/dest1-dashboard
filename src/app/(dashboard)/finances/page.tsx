import FinanceChart from "@/components/FinanceChart";
import FinanceEntryForm from "@/components/FinanceEntryForm";
import { getCurrentUser } from "@/lib/auth";
import { currentFinanceYearRange, getFinanceChartData } from "@/lib/finances";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";

const FinancesPage = async () => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") redirect("/");

  const { from, to } = currentFinanceYearRange();
  const [transactions, chartTransactions] = await Promise.all([
    prisma.financeTransaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.financeTransaction.findMany({
      where: { date: { gte: from, lt: to } },
      select: { type: true, amount: true, date: true },
    }),
  ]);
  const chartData = getFinanceChartData(chartTransactions);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <section className="rounded-md bg-white p-5">
        <h1 className="text-xl font-semibold">Registrar movimiento financiero</h1>
        <p className="mb-5 mt-1 text-sm text-gray-500">
          Registra ingresos y gastos del destacamento.
        </p>
        <FinanceEntryForm />
      </section>

      <section className="h-[460px] rounded-md">
        <FinanceChart data={chartData} />
      </section>

      <section className="rounded-md bg-white p-5">
        <h2 className="mb-4 text-xl font-semibold">Movimientos registrados</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No hay movimientos registrados.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="grid gap-3 py-4 md:grid-cols-[120px_1fr_150px_100px] md:items-center">
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
                  <p className="mt-1 text-sm text-gray-500">{transaction.description}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Intl.DateTimeFormat("es-PA").format(transaction.date)}
                  </p>
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FinancesPage;
