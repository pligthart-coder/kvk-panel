/**
 * Genormaliseerde KVK-bedrijfsgegevens.
 * Dit is het formaat dat onze API teruggeeft aan de frontend, ongeacht of de
 * bron de echte KVK API of de mock-data is.
 */
export type KvkCompany = {
  kvkNumber: string;
  name: string;
  tradeNames: string[];
  legalForm: string | null;
  /** Hoofdvestigingsnummer */
  establishmentNumber: string | null;
  /** RSIN (Rechtspersonen Samenwerkingsverbanden Informatie Nummer) */
  rsin: string | null;
  isActive: boolean;
  address: {
    street: string | null;
    houseNumber: string | null;
    houseNumberAddition: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
  };
  website: string | null;
  /** SBI-codes (Standaard BedrijfsIndeling) */
  sbiCodes: Array<{ code: string; description: string }>;
  /** Inschrijvingsdatum bij de KVK (ISO 8601) */
  registeredAt: string | null;
  /** Aantal werkzame personen */
  employeeCount: number | null;
  /** Aantal vestigingen */
  branchCount: number | null;
};

/**
 * Generieke API-error response.
 */
export type ApiError = {
  error: string;
  details?: string;
};
