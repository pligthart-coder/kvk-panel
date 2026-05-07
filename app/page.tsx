"use client";

import { useCallback, useState, useEffect } from "react";
import type { KvkCompany } from "@/lib/types";

// ---------- State machine -----------------------------------------------

type KvkState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: KvkCompany }
  | { kind: "error"; message: string };

// ---------- Page --------------------------------------------------------

export default function Page() {
  const [kvkInput, setKvkInput] = useState("");
  const [kvk, setKvk] = useState<KvkState>({ kind: "idle" });
  const [token, setToken] = useState<string>("");

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const search = useCallback(async () => {
    const trimmed = kvkInput.trim();
    if (!/^\d{8}$/.test(trimmed)) {
      setKvk({ kind: "error", message: "Een KVK-nummer bestaat uit 8 cijfers." });
      return;
    }
    setKvk({ kind: "loading" });

    try {
      // Pass token to API if available
      const url = token 
        ? `/api/kvk/${trimmed}?token=${token}`
        : `/api/kvk/${trimmed}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as KvkCompany;
      setKvk({ kind: "loaded", data });
    } catch (err) {
      setKvk({
        kind: "error",
        message: err instanceof Error ? err.message : "Onbekende fout",
      });
    }
  }, [kvkInput, token]);

  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-12 md:py-20">
      <Header />

      <SearchBar
        value={kvkInput}
        onChange={setKvkInput}
        onSubmit={search}
        loading={kvk.kind === "loading"}
        disabled={kvk.kind === "loading"}
      />

      <div className="mt-10 space-y-8">
        {kvk.kind === "error" && <ErrorBlock message={kvk.message} />}
        {kvk.kind === "loading" && <LoadingBlock />}
        {kvk.kind === "loaded" && (
          <div className="animate-fade-up">
            <CompanyCard company={kvk.data} />
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

// ---------- Components --------------------------------------------------

function Header() {
  return (
    <header className="mb-12">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
        <span className="h-px w-8 bg-ink/30" />
        <span>Stap 1 · KVK Lookup</span>
      </div>
      <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
        Bedrijven{" "}
        <span className="font-display-italic font-normal text-signal">
          opzoeken
        </span>{" "}
        bij de Kamer
        <br />
        van{" "}
        <span className="font-display-italic font-normal">Koophandel</span>.
      </h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
        Voer een 8-cijferig KVK-nummer in om het basisprofiel van het bedrijf
        op te halen. Carerix-integratie volgt in stap&nbsp;2.
      </p>
    </header>
  );
}

function SearchBar(props: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <div>
      <label
        htmlFor="kvk"
        className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-ink/60"
      >
        KVK-nummer
      </label>
      <div className="group relative flex items-stretch overflow-hidden rounded-md border border-ink/20 bg-cream transition focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
        <input
          id="kvk"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          placeholder="69599084"
          value={props.value}
          disabled={props.disabled}
          onChange={(e) => props.onChange(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSubmit();
          }}
          className="flex-1 bg-transparent px-5 py-4 font-mono text-lg tracking-wider outline-none placeholder:text-ink/25 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={props.disabled || props.value.length !== 8}
          className="flex items-center gap-2 bg-ink px-6 py-4 text-sm font-medium uppercase tracking-[0.15em] text-cream transition enabled:hover:bg-signal disabled:cursor-not-allowed disabled:opacity-40"
        >
          {props.loading ? (
            <Spinner />
          ) : (
            <>
              Zoeken
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Probeer{" "}
        <button
          type="button"
          onClick={() => props.onChange("69599084")}
          className="font-mono underline decoration-dotted underline-offset-2 hover:text-ink"
        >
          69599084
        </button>{" "}
        of{" "}
        <button
          type="button"
          onClick={() => props.onChange("33191000")}
          className="font-mono underline decoration-dotted underline-offset-2 hover:text-ink"
        >
          33191000
        </button>
        .
      </p>
    </div>
  );
}

function CompanyCard({ company }: { company: KvkCompany }) {
  const addr = company.address;
  const fullStreet = [addr.street, addr.houseNumber, addr.houseNumberAddition]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="relative border-l-2 border-ink bg-cream/60 px-6 py-7 backdrop-blur-sm">
      <div className="absolute -left-px top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-signal" />

      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted">
        KVK · Basisprofiel
      </div>
      <h2 className="font-display text-3xl font-medium leading-tight tracking-tight">
        {company.name}
      </h2>

      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        <Field label="KVK-nummer">
          <span className="font-mono text-base">{company.kvkNumber}</span>
        </Field>
        <Field label="Status">
          {company.isActive ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Actief
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              Niet actief
            </span>
          )}
        </Field>
        <Field label="Rechtsvorm">{company.legalForm ?? "—"}</Field>
        <Field label="Vestigingsnummer">
          <span className="font-mono">
            {company.establishmentNumber ?? "—"}
          </span>
        </Field>
        <Field label="Bezoekadres" wide>
          {fullStreet ? (
            <>
              {fullStreet}
              <br />
              {[addr.postalCode, addr.city].filter(Boolean).join("  ")}
              <br />
              <span className="text-muted">{addr.country}</span>
            </>
          ) : (
            "—"
          )}
        </Field>
        {company.website && (
          <Field label="Website" wide>
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-signal"
            >
              {company.website}
            </a>
          </Field>
        )}
        {company.sbiCodes.length > 0 && (
          <Field label="SBI" wide>
            <ul className="space-y-1">
              {company.sbiCodes.map((s) => (
                <li key={s.code} className="flex gap-3">
                  <span className="font-mono text-muted">{s.code}</span>
                  <span>{s.description}</span>
                </li>
              ))}
            </ul>
          </Field>
        )}
      </dl>
    </article>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="border-l-2 border-ink/20 px-6 py-7">
      <div className="mb-3 h-2 w-24 animate-pulse rounded bg-ink/10" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-ink/10" />
      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-2 w-12 animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="border-l-2 border-signal bg-signal/5 px-6 py-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-signal">
        Fout
      </div>
      <p className="mt-1 text-sm text-ink">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden
    />
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/10 pt-6 text-xs text-muted">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>KVK Basisprofiel · stap 1/2</span>
        <span className="font-mono">v0.1.0</span>
      </div>
    </footer>
  );
}
