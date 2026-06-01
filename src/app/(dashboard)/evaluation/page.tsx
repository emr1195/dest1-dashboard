import EvaluationForm from "@/components/EvaluationForm";
import { getCurrentUser } from "@/lib/auth";
import { isEvaluationDay } from "@/lib/evaluations";

const EvaluationPage = async () => {
  const currentUser = await getCurrentUser();
  const active = currentUser?.role === "admin" || isEvaluationDay();

  if (!active) {
    return (
      <div className="flex-1 p-4">
        <div className="max-w-3xl rounded-md bg-white p-6">
          <h1 className="text-xl font-semibold">Evaluacion</h1>
          <p className="mt-2 text-sm text-gray-500">
            La evaluacion solo estara activa el primer dia de marzo, junio, septiembre y diciembre.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <EvaluationForm />
    </div>
  );
};

export default EvaluationPage;
