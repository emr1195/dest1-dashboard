import FinanceChart from "@/components/FinanceChart";
import FinanceEntryForm from "@/components/FinanceEntryForm";
import FinanceTransactionsList from "@/components/FinanceTransactionsList";
import { getCurrentUser } from "@/lib/auth";
import { currentFinanceYearRange, getFinanceChartData } from "@/lib/finances";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const FinancesPage = async () => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin") redirect("/");

  const { from, to } = currentFinanceYearRange();
  const [transactions, chartTransactions] = await Promise.all([
    prisma.financeTransaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.financeTransaction.findMany({
      where: { date: { gte: from, lt: to } },
      select: { type: true, category: true, title: true, amount: true, date: true },
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
        <FinanceTransactionsList
          transactions={transactions.map((transaction) => ({
            ...transaction,
            date: transaction.date.toISOString(),
          }))}
        />
      </section>
    </div>
  );
};

export default FinancesPage;
