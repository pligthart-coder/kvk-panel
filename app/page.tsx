"use client";

import { useCallback, useState, useEffect } from "react";
import type { KvkCompany } from "@/lib/types";

type KvkState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: KvkCompany }
  | { kind: "error"; message: string };

export default function Page() {
  const [kvkInput, setKvkInput] = useState("");
  const [kvk, setKvk] = useState<KvkState>({ kind: "idle" });
  const [token, setToken] = useState<string>("");
  const [mailSameAsVisit, setMailSameAsVisit] = useState(true);

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
      setKvk({ kind: "error", message: "Het KVK-nummer moet precies 8 cijfers bevatten." });
      return;
    }
    setKvk({ kind: "loading" });

    try {
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

  const clearForm = () => {
    setKvkInput("");
    setKvk({ kind: "idle" });
    setMailSameAsVisit(true);
  };

  const company = kvk.kind === "loaded" ? kvk.data : null;

  return (
    <div className="w-full p-3 bg-gray-100 min-h-screen">
      <div className="w-full max-w-7xl mx-auto space-y-2">
        <main className="space-y-3">
          <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2 text-gray-800">
              Zoeken op KVK-nummer
              <span className="inline-block bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full px-2 py-0.5 text-[10px] font-semibold ml-2 align-middle">
                DEMO
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
              <div>
                <label htmlFor="kvk-input" className="block text-xs font-medium text-gray-700 mb-1">
                  KVK-nummer
                </label>
                <input
                  type="text"
                  id="kvk-input"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  placeholder="69599084"
                  maxLength={8}
                  value={kvkInput}
                  onChange={(e) => setKvkInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                />
                <p className="text-gray-500 mt-1 text-xs">
                  Alleen cijfers, 8 cijfers. Probeer{" "}
                  <button
                    type="button"
                    onClick={() => setKvkInput("69599084")}
                    className="font-mono underline decoration-dotted underline-offset-2 hover:text-gray-900"
                  >
                    69599084
                  </button>.
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={search}
                  disabled={kvkInput.length !== 8 || kvk.kind === "loading"}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
                    kvkInput.length === 8 && kvk.kind !== "loading"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-200 text-gray-600 cursor-not-allowed opacity-60"
                  }`}
                >
                  {kvk.kind === "loading" ? (
                    <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                  ) : (
                    "Ophalen KVK-gegevens"
                  )}
                </button>
              </div>
            </div>
          </section>

          {kvk.kind === "error" && (
            <div className="bg-red-50 text-red-900 border border-red-200 rounded-md px-3 py-2 text-xs font-medium">
              {kvk.message}
            </div>
          )}

          {kvk.kind === "loaded" && (
            <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-md px-3 py-2 text-xs font-medium">
              KVK-gegevens succesvol opgehaald voor <strong>{company?.name}</strong>. Controleer de gegevens en klik op "Registreer in ATS" om het bedrijf aan te maken.
            </div>
          )}

          <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 text-gray-800">Bedrijfsgegevens</h2>
            <CompanyForm company={company} mailSameAsVisit={mailSameAsVisit} setMailSameAsVisit={setMailSameAsVisit} />
            <div className="text-right mt-4 flex justify-end space-x-2">
              <button
                onClick={clearForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold hover:bg-gray-300 transition"
              >
                Leegmaken
              </button>
              <button
                disabled={!company?.name}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
                  company?.name
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-500 text-white opacity-60 cursor-not-allowed"
                }`}
              >
                Registreer in ATS
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// ---------- Components --------------------------------------------------

function CompanyForm({ 
  company, 
  mailSameAsVisit, 
  setMailSameAsVisit 
}: { 
  company: KvkCompany | null; 
  mailSameAsVisit: boolean;
  setMailSameAsVisit: (v: boolean) => void;
}) {
  const addr = company?.address;
  const sbi = company?.sbiCodes?.[0];

  return (
    <form className="space-y-3 text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Identificatie */}
        <div>
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
            Identificatie
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">
                Bedrijfsnaam<span className="text-red-600 ml-0.5">*</span>
              </label>
              <input
                type="text"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                value={company?.name || ""}
                readOnly={!!company}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Handelsnaam</label>
              <input
                type="text"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                value={company?.tradeNames?.[0] || ""}
                readOnly={!!company}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">KVK-nummer</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.kvkNumber || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Vestigingsnummer</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.establishmentNumber || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">RSIN</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.rsin || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">BTW-nummer</label>
              <input
                type="text"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                placeholder="NL...B01"
                value={company?.rsin ? `NL${company.rsin}B01` : ""}
                readOnly={!!company}
              />
            </div>
          </div>
        </div>

        {/* Onderneming */}
        <div>
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
            Onderneming
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Rechtsvorm</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.legalForm || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Datum oprichting</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.registeredAt || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">SBI-code</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={sbi?.code || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Status</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.isActive ? "Actief" : "Niet actief"}
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">SBI-omschrijving</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={sbi?.description || ""}
                readOnly
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Werkzame personen</label>
              <input
                type="text"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                value={company?.employeeCount || ""}
                readOnly={!!company}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Vestigingen</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 cursor-not-allowed"
                value={company?.branchCount || ""}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bezoekadres */}
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
              Bezoekadres
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <div className="md:col-span-4">
                <label className="block font-medium text-gray-700 mb-1">Straat</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  value={addr?.street || ""}
                  readOnly={!!company}
                  maxLength={60}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block font-medium text-gray-700 mb-1">Huisnr.</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  value={addr?.houseNumber || ""}
                  readOnly={!!company}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block font-medium text-gray-700 mb-1">Toev.</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  value={addr?.houseNumberAddition || ""}
                  readOnly={!!company}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 mb-1">Postcode</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  value={addr?.postalCode || ""}
                  readOnly={!!company}
                  placeholder="1234 AB"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 mb-1">Plaats</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  value={addr?.city || ""}
                  readOnly={!!company}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 mb-1">Land</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                  value={addr?.country || "Nederland"}
                  readOnly={!!company}
                />
              </div>
            </div>
          </div>

          {/* Postadres */}
          <div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 pb-1 border-b border-gray-200 flex items-center justify-between">
              <span>Postadres</span>
              <label className="flex items-center font-normal normal-case tracking-normal text-gray-600">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={mailSameAsVisit}
                  onChange={(e) => setMailSameAsVisit(e.target.checked)}
                />
                Gelijk aan bezoekadres
              </label>
            </div>
            {!mailSameAsVisit && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <div className="md:col-span-4">
                  <label className="block font-medium text-gray-700 mb-1">Straat</label>
                  <input type="text" className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40" maxLength={60} />
                </div>
                <div className="md:col-span-1">
                  <label className="block font-medium text-gray-700 mb-1">Huisnr.</label>
                  <input type="text" className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40" />
                </div>
                <div className="md:col-span-1">
                  <label className="block font-medium text-gray-700 mb-1">Toev.</label>
                  <input type="text" className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">Postcode</label>
                  <input type="text" className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">Plaats</label>
                  <input type="text" className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium text-gray-700 mb-1">Land</label>
                  <input type="text" className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40" defaultValue="Nederland" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contactgegevens */}
        <div>
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
            Contactgegevens
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Telefoon</label>
              <input
                type="text"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                placeholder="+31 ..."
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                placeholder="info@bedrijf.nl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/40"
                value={company?.website || ""}
                placeholder="www.bedrijf.nl"
                readOnly={!!company}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

