import { NextResponse } from "next/server";
import { fetchKvkCompany } from "@/lib/kvk";

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Allow up to 10 seconds for KVK API calls

export async function GET(
  _req: Request,
  { params }: { params: { kvkNumber: string } },
) {
  const { kvkNumber } = params;

  try {
    const company = await fetchKvkCompany(kvkNumber);
    if (!company) {
      return NextResponse.json(
        { error: "Geen bedrijf gevonden met dit KVK-nummer." },
        { status: 404 },
      );
    }
    return NextResponse.json(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json(
      { error: "KVK-lookup mislukt", details: message },
      { status: 500 },
    );
  }
}
