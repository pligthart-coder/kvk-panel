import type { KvkCompany } from "./types";

/**
 * Bepaalt of we de mock-modus gebruiken (geen echte API key ingesteld).
 */
export function isKvkMock(): boolean {
  const key = process.env.KVK_API_KEY?.trim();
  return !key || key === "mock";
}

/**
 * Mock-data voor lokale ontwikkeling. Een paar bekende KVK-nummers + een fallback.
 */
const MOCK_COMPANIES: Record<string, KvkCompany> = {
  "69599084": {
    kvkNumber: "69599084",
    name: "Test EMZ Dagobert",
    tradeNames: ["Test EMZ Dagobert", "Tweede handelsnaam 1MZ"],
    legalForm: "Eenmanszaak",
    establishmentNumber: "000038509504",
    rsin: null,
    isActive: true,
    address: {
      street: "Abebe Bikilalaan",
      houseNumber: "17",
      houseNumberAddition: null,
      postalCode: "1034WL",
      city: "Amsterdam",
      country: "Nederland",
    },
    website: null,
    sbiCodes: [
      { code: "7820", description: "Uitzendbureaus" },
    ],
    registeredAt: "2017-09-18",
    employeeCount: 1,
    branchCount: 1,
  },
  "33191000": {
    kvkNumber: "33191000",
    name: "Heineken Nederland B.V.",
    tradeNames: ["Heineken Nederland"],
    legalForm: "Besloten Vennootschap",
    establishmentNumber: "000017455020",
    rsin: "002442874",
    isActive: true,
    address: {
      street: "Tweede Weteringplantsoen",
      houseNumber: "21",
      houseNumberAddition: null,
      postalCode: "1017ZD",
      city: "Amsterdam",
      country: "Nederland",
    },
    website: "https://www.heineken.com",
    sbiCodes: [
      { code: "1105", description: "Vervaardiging van bier" },
    ],
    registeredAt: "1991-01-01",
    employeeCount: 2500,
    branchCount: 15,
  },
  "27312152": {
    kvkNumber: "27312152",
    name: "ASML Holding N.V.",
    tradeNames: ["ASML"],
    legalForm: "Naamloze Vennootschap",
    establishmentNumber: "000015324656",
    rsin: "805360883",
    isActive: true,
    address: {
      street: "De Run",
      houseNumber: "6501",
      houseNumberAddition: null,
      postalCode: "5504DR",
      city: "Veldhoven",
      country: "Nederland",
    },
    website: "https://www.asml.com",
    sbiCodes: [
      { code: "2829", description: "Vervaardiging van overige machines" },
    ],
    registeredAt: "1984-04-01",
    employeeCount: 35000,
    branchCount: 60,
  },
};

function makeFallbackMock(kvkNumber: string): KvkCompany {
  return {
    kvkNumber,
    name: `Demo Bedrijf ${kvkNumber} B.V.`,
    tradeNames: [`Demo ${kvkNumber}`],
    legalForm: "Besloten Vennootschap",
    establishmentNumber: `0000${kvkNumber}`,
    rsin: null,
    isActive: true,
    address: {
      street: "Voorbeeldstraat",
      houseNumber: "1",
      houseNumberAddition: null,
      postalCode: "1000AA",
      city: "Amsterdam",
      country: "Nederland",
    },
    website: null,
    sbiCodes: [{ code: "7022", description: "Organisatieadviesbureaus" }],
    registeredAt: "2020-01-01",
    employeeCount: null,
    branchCount: null,
  };
}

/**
 * Haalt een bedrijf op uit de KVK API (of mock).
 * @param kvkNumber 8-cijferig KVK-nummer
 */
export async function fetchKvkCompany(kvkNumber: string): Promise<KvkCompany | null> {
  if (!/^\d{8}$/.test(kvkNumber)) {
    throw new Error("KVK-nummer moet exact 8 cijfers bevatten.");
  }

  if (isKvkMock()) {
    // Simuleer netwerklatency
    await new Promise((r) => setTimeout(r, 350));
    return MOCK_COMPANIES[kvkNumber] ?? makeFallbackMock(kvkNumber);
  }

  const baseUrl = process.env.KVK_API_BASE_URL ?? "https://api.kvk.nl/api/v1";
  const apiKey = process.env.KVK_API_KEY!;

  // Gebruik de Basisprofiel API voor complete data
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

  try {
    const res = await fetch(`${baseUrl}/basisprofielen/${kvkNumber}`, {
      headers: { 
        apikey: apiKey,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`KVK API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json() as KvkBasisprofielResponse;
    return mapKvkResponse(data);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('KVK API timeout - de API reageert te traag');
    }
    throw err;
  }
}

/**
 * Minimale typing van de KVK Basisprofiel response. Bewust niet exhaustief —
 * we mappen alleen wat we daadwerkelijk gebruiken.
 */
type KvkBasisprofielResponse = {
  kvkNummer: string;
  naam?: string;
  formeleRegistratiedatum?: string;
  rsin?: string;
  handelsnamen?: Array<{ naam: string; volgorde?: number }>;
  totaalWerkzamePersonen?: number;
  _embedded?: {
    eigenaar?: {
      rechtsvorm?: string;
      uitgebreideRechtsvorm?: string;
      rsin?: string;
    };
    hoofdvestiging?: {
      vestigingsnummer?: string;
      websites?: string[];
      totaalWerkzamePersonen?: number;
      sbiActiviteiten?: Array<{
        sbiCode: string;
        sbiOmschrijving: string;
      }>;
      adressen?: Array<{
        type: string;
        straatnaam?: string;
        huisnummer?: number;
        huisnummerToevoeging?: string;
        postcode?: string;
        plaats?: string;
        land?: string;
      }>;
    };
  };
  materieleRegistratie?: {
    registratieAanvang?: string;
    datumEinde?: string | null;
  };
  links?: Array<{
    rel?: string;
    href?: string;
  }>;
  aantalVestigingen?: number;
  rechtsvorm?: string;
};

function mapKvkResponse(data: KvkBasisprofielResponse): KvkCompany {
  const hoofd = data._embedded?.hoofdvestiging;
  const bezoek = hoofd?.adressen?.find((a) => a.type === "bezoekadres") ??
    hoofd?.adressen?.[0];

  return {
    kvkNumber: data.kvkNummer,
    name: data.naam ?? data.handelsnamen?.[0]?.naam ?? "Onbekend",
    tradeNames: (data.handelsnamen ?? []).map((h) => h.naam),
    legalForm: data._embedded?.eigenaar?.rechtsvorm ?? null,
    establishmentNumber: hoofd?.vestigingsnummer ?? null,
    rsin: data.rsin ?? data._embedded?.eigenaar?.rsin ?? null,
    isActive: !data.materieleRegistratie?.datumEinde,
    address: {
      street: bezoek?.straatnaam ?? null,
      houseNumber: bezoek?.huisnummer != null ? String(bezoek.huisnummer) : null,
      houseNumberAddition: bezoek?.huisnummerToevoeging ?? null,
      postalCode: bezoek?.postcode ?? null,
      city: bezoek?.plaats ?? null,
      country: bezoek?.land ?? "Nederland",
    },
    website: hoofd?.websites?.[0] ?? null,
    sbiCodes: (hoofd?.sbiActiviteiten ?? []).map((s) => ({
      code: s.sbiCode,
      description: s.sbiOmschrijving,
    })),
    registeredAt: data.formeleRegistratiedatum ?? null,
    employeeCount: data.totaalWerkzamePersonen ?? hoofd?.totaalWerkzamePersonen ?? null,
    branchCount: data.aantalVestigingen ?? null,
  };
}
