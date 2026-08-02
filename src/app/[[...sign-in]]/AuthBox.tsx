"use client";

import Image from "next/image";
import DateTimePicker from "@/components/DateTimePicker";
import { leaderGroupOptions, rankOptionsByRole, roleOptions } from "@/lib/roles";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

const roles = [
  { value: "admin", label: "Admin", hint: "Código a + 5 números" },
  { value: "teacher", label: "Líder", hint: "Código l + 5 números" },
  { value: "student", label: "Muchacho", hint: "Código j + 5 números" },
  { value: "parent", label: "Padre", hint: "Código p + 5 números" },
];

const dashboardPaths = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.dashboardPath])
);

const AuthBox = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [childrenNames, setChildrenNames] = useState("");
  const [role, setRole] = useState("student");
  const [rank, setRank] = useState("");
  const [leaderGroup, setLeaderGroup] = useState("");
  const [gender, setGender] = useState("");
  const [rankMenuOpen, setRankMenuOpen] = useState(false);
  const [leaderGroupMenuOpen, setLeaderGroupMenuOpen] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const availableRanks = rankOptionsByRole[role as "teacher" | "student"] || [];
  const selectedRank = availableRanks.find((item) => item.label === rank);
  const selectedLeaderGroup = leaderGroupOptions.find((item) => item.value === leaderGroup);
  const needsLeaderGroup = role === "teacher";

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

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico o nombre de usuario.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const targetResponse = await fetch("/api/auth/login-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const targetData = await targetResponse.json().catch(() => null);

      if (!targetResponse.ok) {
        setError(targetData?.message || "El correo o la contraseña no son correctos.");
        return;
      }

      await signIn("credentials", {
        email,
        password,
        callbackUrl: getSafeCallbackPath() || targetData?.dashboardPath || "/auth/redirect",
      });
    } catch {
      setError("No fue posible conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async () => {
    resetMessages();

    if (!email) {
      setError("Escribe tu correo antes de pedir el código.");
      return;
    }

    if ((role === "teacher" || role === "student") && !rank) {
      setError("Selecciona un rango antes de pedir el código.");
      return;
    }

    if (needsLeaderGroup && !leaderGroup) {
      setError("Selecciona el grupo que atenderá el líder.");
      return;
    }

    if (!birthDate) {
      setError("Selecciona tu fecha de nacimiento antes de pedir el codigo.");
      return;
    }

    if (!address.trim()) {
      setError("Escribe tu dirección de residencia antes de pedir el código.");
      return;
    }

    if (!gender) {
      setError("Selecciona un género antes de pedir el código.");
      return;
    }

    setRequestingCode(true);

    const response = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        birthDate,
        phone,
        address,
        guardianName: role === "student" ? guardianName : "",
        childrenNames: role === "parent" ? childrenNames : "",
        rank: role === "teacher" || role === "student" ? rank : "",
        leaderGroup: role === "teacher" ? leaderGroup : "",
        gender,
        role,
      }),
    });
    const data = await response.json().catch(() => null);

    setRequestingCode(false);

    if (!response.ok) {
      setError(data?.message || "No se pudo solicitar el código.");
      return;
    }

    setNotice(data?.message || "Solicitud enviada. Espera el código por correo.");
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();

    if ((role === "teacher" || role === "student") && !rank) {
      setError("Selecciona un rango para crear la cuenta.");
      return;
    }

    if (needsLeaderGroup && !leaderGroup) {
      setError("Selecciona el grupo que atenderá el líder.");
      return;
    }

    if (!birthDate) {
      setError("Selecciona tu fecha de nacimiento para crear la cuenta.");
      return;
    }

    if (!address.trim()) {
      setError("Escribe tu dirección de residencia para crear la cuenta.");
      return;
    }

    if (!gender) {
      setError("Selecciona un género para crear la cuenta.");
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
        birthDate,
        phone,
        address,
        guardianName: role === "student" ? guardianName : "",
        childrenNames: role === "parent" ? childrenNames : "",
        rank: role === "teacher" || role === "student" ? rank : "",
        leaderGroup: role === "teacher" ? leaderGroup : "",
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
        setError("Ingresa el código de acceso antes de registrarte con Google.");
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

  const inputClass = "min-h-[50px] rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-sm text-[#0F172A] outline-none transition hover:border-[#94A3B8] focus:border-[#07569F] focus:ring-4 focus:ring-[rgba(7,86,159,0.18)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section className="grid w-full max-w-[980px] overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden min-h-[590px] overflow-hidden bg-[#07569F] p-10 text-white lg:flex lg:flex-col lg:items-center lg:justify-center lg:text-center">
        <div className="absolute inset-x-10 top-10 h-px bg-white/15" aria-hidden="true" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[20px] border border-white/25 bg-white/95 p-3 shadow-lg">
          <Image src="/logo-catedral-de-vida.png" alt="Emblema de Exploradores del Rey, Destacamento número 1" width={112} height={112} priority className="h-28 w-28 object-contain" />
        </div>
        <h2 className="mt-7 text-3xl font-extrabold">Exploradores del Rey</h2>
        <p className="mt-2 text-base font-semibold text-white/85">Destacamento #1</p>
        <p className="mt-7 max-w-xs text-sm leading-6 text-white/75">Formando muchachos para el servicio, el liderazgo y la vida.</p>
      </aside>

      <div className="flex min-w-0 flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-11">
        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-sm">
            <Image src="/logo-catedral-de-vida.png" alt="Emblema de Exploradores del Rey, Destacamento número 1" width={72} height={72} priority className="h-[72px] w-[72px] object-contain" />
          </div>
          <p className="mt-3 text-lg font-extrabold text-[#0F172A]">Exploradores del Rey</p>
          <p className="text-sm font-semibold text-[#64748B]">Destacamento #1</p>
        </div>

        <div className="mx-auto w-full max-w-[440px]">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F172A]">{mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</h1>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              {mode === "signin" ? "Ingresa con tu correo electrónico o nombre de usuario." : "Elige tu tipo de cuenta y valida tu código."}
            </p>
          </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="mt-7 flex flex-col gap-4" aria-busy={loading}>
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
              Género
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
              <DateTimePicker
                id="signup-birth-date"
                label="Fecha de nacimiento"
                value={birthDate}
                onChange={setBirthDate}
                required
                dateOnly
                openPicker={openDatePicker}
                setOpenPicker={setOpenDatePicker}
              />
              <label className="flex flex-col gap-2 text-sm text-gray-500">
                Número de teléfono
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
            <label className="flex flex-col gap-2 text-sm text-gray-500">
              Dirección de residencia
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={inputClass}
                placeholder="Tu direccion"
                type="text"
                required
              />
            </label>
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
        <div>
          <label htmlFor="auth-identifier" className="mb-2 block text-sm font-semibold text-[#334155]">
            {mode === "signin" ? "Correo o usuario" : "Correo"}
          </label>
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="m4 6 8 6 8-6"/></svg>
            <input
              id="auth-identifier"
              value={email}
              onChange={(event) => { setEmail(event.target.value); if (error) resetMessages(); }}
              className={`${inputClass} w-full pl-12 ${error && mode === "signin" ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-red-100" : ""}`}
              placeholder={mode === "signin" ? "Correo electrónico o nombre de usuario" : "correo@ejemplo.com"}
              type={mode === "signin" ? "text" : "email"}
              autoComplete="username"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "auth-alert" : undefined}
              disabled={loading}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold text-[#334155]">Contraseña</label>
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            <input
              id="auth-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); if (error) resetMessages(); }}
              className={`${inputClass} w-full pl-12 pr-12 ${error && mode === "signin" ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-red-100" : ""}`}
              placeholder="Mínimo 6 caracteres"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "auth-alert" : undefined}
              disabled={loading}
              required
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#EAF3FB] hover:text-[#07569F] focus:outline-none focus:ring-4 focus:ring-[rgba(7,86,159,0.18)]" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a15 15 0 0 1-2.2 2.7M6.6 6.6C4.4 8 3 10 3 10s3.5 5 9 5a10.7 10.7 0 0 0 3-.4"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>
              )}
            </button>
          </div>
        </div>
        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-2 text-sm text-gray-500">
              Código de acceso
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
              {requestingCode ? "Solicitando…" : "Solicitar código"}
            </button>
          </div>
        )}

        {error && (
          <div id="auth-alert" role="alert" aria-live="assertive" className="flex items-start gap-3 rounded-xl border border-red-200 bg-[#FEF2F2] px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-400 text-xs font-bold" aria-hidden="true">!</span>
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-green-200 bg-[#DCFCE7] px-4 py-3 text-sm text-green-800">
            <span aria-hidden="true">✓</span><span>{notice}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#07569F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#064A89] active:bg-[#053D72] focus:outline-none focus:ring-4 focus:ring-[rgba(7,86,159,0.18)] disabled:cursor-wait disabled:opacity-65"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {loading ? (mode === "signin" ? "Iniciando sesión…" : "Creando cuenta…") : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      {/* {mode === "signin" && (
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
      )} */}

      {mode === "signin" ? (
        <p className="mt-6 text-center text-sm text-[#64748B]">
          ¿No tienes una cuenta?{" "}
          <button type="button" onClick={() => { resetMessages(); setMode("signup"); }} className="font-semibold text-[#07569F] hover:underline focus:outline-none focus:ring-4 focus:ring-[rgba(7,86,159,0.18)]">
            Crea una
          </button>
        </p>
      ) : (
        <p className="mt-6 text-center text-sm text-[#64748B]">
          ¿Ya tienes una cuenta?{" "}
          <button type="button" onClick={() => { resetMessages(); setMode("signin"); }} className="font-semibold text-[#07569F] hover:underline focus:outline-none focus:ring-4 focus:ring-[rgba(7,86,159,0.18)]">
            Inicia sesión
          </button>
        </p>
      )}
        </div>
      </div>
    </section>
  );
};

export default AuthBox;










