"use client";

import Image from "next/image";
import { leaderGroupOptions, rankOptionsByRole, roleOptions } from "@/lib/roles";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

const roles = [
  { value: "admin", label: "Admin", hint: "Codigo a + 5 numeros" },
  { value: "teacher", label: "Lider", hint: "Codigo l + 5 numeros" },
  { value: "student", label: "Muchacho", hint: "Codigo j + 5 numeros" },
  { value: "parent", label: "Padre", hint: "Codigo p + 5 numeros" },
];

const dashboardPaths = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.dashboardPath])
);

const AuthBox = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [childrenNames, setChildrenNames] = useState("");
  const [role, setRole] = useState("student");
  const [rank, setRank] = useState("");
  const [leaderGroup, setLeaderGroup] = useState("");
  const [gender, setGender] = useState("");
  const [rankMenuOpen, setRankMenuOpen] = useState(false);
  const [leaderGroupMenuOpen, setLeaderGroupMenuOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const availableRanks = rankOptionsByRole[role as "teacher" | "student"] || [];
  const selectedRank = availableRanks.find((item) => item.label === rank);
  const selectedLeaderGroup = leaderGroupOptions.find((item) => item.value === leaderGroup);
  const needsLeaderGroup = role === "teacher" && rank === "Lider de Grupo";

  const resetMessages = () => {
    setError("");
    setNotice("");
  };

  const getSafeCallbackPath = () => {
    const value = callbackUrl.trim();

    if (!value || value === "/") return "";

    try {
      const url = value.startsWith("/")
        ? new URL(value, window.location.origin)
        : new URL(value);

      if (url.origin !== window.location.origin) return "";
      if (url.pathname === "/" || url.pathname.startsWith("/api/auth")) return "";

      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "";
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setLoading(true);

    const targetResponse = await fetch("/api/auth/login-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const targetData = await targetResponse.json().catch(() => null);

    if (!targetResponse.ok) {
      setLoading(false);
      setError(targetData?.message || "Correo o contrasena incorrectos.");
      return;
    }

    await signIn("credentials", {
      email,
      password,
      callbackUrl: getSafeCallbackPath() || targetData?.dashboardPath || "/auth/redirect",
    });

    setLoading(false);
  };

  const handleRequestCode = async () => {
    resetMessages();

    if (!email) {
      setError("Escribe tu correo antes de pedir el codigo.");
      return;
    }

    if ((role === "teacher" || role === "student") && !rank) {
      setError("Selecciona un rango antes de pedir el codigo.");
      return;
    }

    if (needsLeaderGroup && !leaderGroup) {
      setError("Selecciona el grupo que atendera el lider.");
      return;
    }

    if (!gender) {
      setError("Selecciona un genero antes de pedir el codigo.");
      return;
    }

    setRequestingCode(true);

    const response = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        age,
        phone,
        guardianName: role === "student" ? guardianName : "",
        childrenNames: role === "parent" ? childrenNames : "",
        rank: role === "teacher" || role === "student" ? rank : "",
        leaderGroup: needsLeaderGroup ? leaderGroup : "",
        gender,
        role,
      }),
    });
    const data = await response.json().catch(() => null);

    setRequestingCode(false);

    if (!response.ok) {
      setError(data?.message || "No se pudo solicitar el codigo.");
      return;
    }

    setNotice(data?.message || "Solicitud enviada. Espera el codigo por correo.");
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if ((role === "teacher" || role === "student") && !rank) {
      setError("Selecciona un rango para crear la cuenta.");
      return;
    }

    if (needsLeaderGroup && !leaderGroup) {
      setError("Selecciona el grupo que atendera el lider.");
      return;
    }

    if (!gender) {
      setError("Selecciona un genero para crear la cuenta.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        age,
        phone,
        guardianName: role === "student" ? guardianName : "",
        childrenNames: role === "parent" ? childrenNames : "",
        rank: role === "teacher" || role === "student" ? rank : "",
        leaderGroup: needsLeaderGroup ? leaderGroup : "",
        gender,
        role,
        code,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.message || "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email,
      password,
      callbackUrl: getSafeCallbackPath() || dashboardPaths[role] || "/auth/redirect",
    });

    setLoading(false);
  };

  const handleGoogle = async () => {
    resetMessages();

    if (mode === "signup") {
      if (!code) {
        setError("Ingresa el codigo de acceso antes de registrarte con Google.");
        return;
      }

      const response = await fetch("/api/auth/prepare-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, code }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "No se pudo preparar el registro con Google.");
        return;
      }
    }

    signIn("google", { callbackUrl: getSafeCallbackPath() || "/auth/redirect" });
  };

  const inputClass = "p-3 rounded-md ring-1 ring-gray-300 outline-none focus:ring-lamaSky text-base";

  return (
    <div className="flex max-h-[92vh] min-h-[80vh] w-full max-w-[780px] flex-col justify-center gap-6 overflow-y-auto rounded-md bg-white p-6 shadow-2xl sm:p-10 md:w-[80vw] md:px-16 md:py-14">
      <Image
        src="/logo-catedral-de-vida.png"
        alt="Logo Catedral de Vida"
        width={132}
        height={132}
        priority
        className="mb-2 h-24 w-24 self-center object-contain sm:h-40 sm:w-40 md:h-80 md:w-80"
      />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-center">{mode === "signin" ? "Iniciar sesion" : "Crear cuenta"}</h1>
        <p className="text-base text-gray-500 mt-2">
          {mode === "signin" ? "Ingresa con tu correo o Google." : "Elige tu tipo de cuenta y valida tu codigo."}
        </p>
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
        {mode === "signup" && (
          <>
            <label className="flex flex-col gap-2 text-sm text-gray-500">
              Nombre
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
                placeholder="Tu nombre"
                type="text"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-gray-500">
              Tipo de cuenta
              <select
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  setRole(nextRole);
                  if (nextRole !== "student") setGuardianName("");
                  if (nextRole !== "parent") setChildrenNames("");
                  setRank("");
                  setLeaderGroup("");
                  setRankMenuOpen(false);
                  setLeaderGroupMenuOpen(false);
                }}
                className={inputClass}
              >
                {roles.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label} - {item.hint}
                  </option>
                ))}
              </select>
            </label>
            {(role === "teacher" || role === "student") && (
              <fieldset className="flex flex-col gap-2 text-sm text-gray-500">
                <legend className="mb-2">Rango</legend>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRankMenuOpen((open) => !open)}
                    className={`${inputClass} flex w-full items-center justify-between bg-white text-left`}
                    aria-expanded={rankMenuOpen}
                  >
                    {selectedRank ? (
                      <span className="flex items-center gap-3 text-gray-700">
                        <Image
                          src={selectedRank.image}
                          alt=""
                          width={38}
                          height={38}
                          className="h-9 w-9 shrink-0 object-contain"
                        />
                        {selectedRank.label}
                      </span>
                    ) : (
                      <span className="text-gray-500">Seleccionar</span>
                    )}
                    <span aria-hidden="true" className="text-gray-500">v</span>
                  </button>
                  {rankMenuOpen && (
                    <div className="absolute z-20 mt-1 grid max-h-60 w-full gap-1 overflow-y-auto rounded-md bg-white p-2 shadow-lg ring-1 ring-gray-300 md:grid-cols-2">
                    {availableRanks.map((item) => (
                      <button
                        type="button"
                        key={item.label}
                        onClick={() => {
                          setRank(item.label);
                          if (item.label !== "Lider de Grupo") setLeaderGroup("");
                          setRankMenuOpen(false);
                        }}
                        className={`flex min-h-14 items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition ${
                          rank === item.label ? "bg-lamaSkyLight ring-1 ring-lamaSky" : "hover:bg-gray-50"
                        }`}
                        aria-pressed={rank === item.label}
                      >
                        <Image
                          src={item.image}
                          alt=""
                          width={42}
                          height={42}
                          className="h-10 w-10 shrink-0 object-contain"
                        />
                        <span className="text-gray-700">{item.label}</span>
                      </button>
                    ))}
                    </div>
                  )}
                </div>
                <input type="hidden" name="rank" value={rank} required />
              </fieldset>
            )}
            {needsLeaderGroup && (
              <fieldset className="flex flex-col gap-2 text-sm text-gray-500">
                <legend className="mb-2">Grupo que atiende</legend>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setLeaderGroupMenuOpen((open) => !open)}
                    className={`${inputClass} flex w-full items-center justify-between bg-white text-left`}
                    aria-expanded={leaderGroupMenuOpen}
                  >
                    {selectedLeaderGroup ? (
                      <span className="flex items-center gap-3 text-gray-700">
                        <Image
                          src={selectedLeaderGroup.image}
                          alt=""
                          width={42}
                          height={42}
                          className="h-10 w-10 shrink-0 object-contain"
                        />
                        {selectedLeaderGroup.label}
                      </span>
                    ) : (
                      <span className="text-gray-500">Seleccionar</span>
                    )}
                    <span aria-hidden="true" className="text-gray-500">v</span>
                  </button>
                  {leaderGroupMenuOpen && (
                    <div className="absolute z-20 mt-1 grid max-h-72 w-full gap-1 overflow-y-auto rounded-md bg-white p-2 shadow-lg ring-1 ring-gray-300 md:grid-cols-2">
                      {leaderGroupOptions.map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          onClick={() => {
                            setLeaderGroup(item.value);
                            setLeaderGroupMenuOpen(false);
                          }}
                          className={`flex min-h-16 items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition ${
                            leaderGroup === item.value ? "bg-lamaSkyLight ring-1 ring-lamaSky" : "hover:bg-gray-50"
                          }`}
                          aria-pressed={leaderGroup === item.value}
                        >
                          <Image
                            src={item.image}
                            alt=""
                            width={50}
                            height={50}
                            className="h-12 w-12 shrink-0 object-contain"
                          />
                          <span className="text-gray-700">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="hidden" name="leaderGroup" value={leaderGroup} required />
              </fieldset>
            )}
            <label className="flex flex-col gap-2 text-sm text-gray-500">
              Genero
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className={inputClass}
                required
              >
                <option value="">Seleccionar</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-gray-500">
                Edad
                <input
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  className={inputClass}
                  placeholder="Tu edad"
                  type="number"
                  min={1}
                  max={120}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-gray-500">
                Numero de telefono
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  placeholder="809-000-0000"
                  type="tel"
                  required
                />
              </label>
            </div>
            {role === "student" && (
              <label className="flex flex-col gap-2 text-sm text-gray-500">
                Nombre del padre o madre
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                  className={inputClass}
                  placeholder="Nombre del padre o madre"
                  type="text"
                  required
                />
              </label>
            )}
            {role === "parent" && (
              <label className="flex flex-col gap-2 text-sm text-gray-500">
                Nombres de los hijos
                <textarea
                  value={childrenNames}
                  onChange={(event) => setChildrenNames(event.target.value)}
                  className={`${inputClass} min-h-24 resize-y`}
                  placeholder="Escribe los nombres separados por coma"
                  required
                />
              </label>
            )}
          </>
        )}
        <label className="flex flex-col gap-2 text-sm text-gray-500">
          Correo
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="correo@ejemplo.com"
            type="email"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-gray-500">
          Contrasena
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="Minimo 6 caracteres"
            type="password"
            minLength={6}
            required
          />
        </label>
        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-2 text-sm text-gray-500">
              Codigo de acceso
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toLowerCase())}
                className={inputClass}
                placeholder="Ejemplo: j12345"
                type="text"
                maxLength={6}
                required
              />
            </label>
            <button
              type="button"
              onClick={handleRequestCode}
              disabled={requestingCode}
              className="ring-1 ring-lamaSkyLight text-lamaSky rounded-md text-base p-3 disabled:opacity-60"
            >
              {requestingCode ? "Solicitando..." : "Solicitar codigo"}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-lamaPurple">{error}</p>}
        {notice && <p className="text-xs text-lamaBrown">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-lamaSky text-white rounded-md text-base p-3 disabled:opacity-60"
        >
          {loading ? "Procesando..." : mode === "signin" ? "Iniciar sesion" : "Crear cuenta"}
        </button>
      </form>

      {mode === "signin" && (
        <>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px bg-gray-200 flex-1" />
            o
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="ring-1 ring-gray-300 rounded-md text-base p-3 hover:bg-gray-50"
          >
            Ingresar con Google
          </button>
        </>
      )}

      {mode === "signin" ? (
        <p className="text-base text-gray-500 text-center">
          No tienes cuenta?{" "}
          <button type="button" onClick={() => { resetMessages(); setMode("signup"); }} className="text-lamaSky font-medium">
            Crea una
          </button>
        </p>
      ) : (
        <p className="text-base text-gray-500 text-center">
          Ya tienes cuenta?{" "}
          <button type="button" onClick={() => { resetMessages(); setMode("signin"); }} className="text-lamaSky font-medium">
            Inicia sesion
          </button>
        </p>
      )}
    </div>
  );
};

export default AuthBox;










