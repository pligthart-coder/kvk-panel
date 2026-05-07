import { NextResponse } from "next/server";
import { searchCompanyByKvk } from "@/lib/carerix";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kvkNumber = searchParams.get("kvkNumber");

  if (!kvkNumber) {
    return NextResponse.json(
      { error: "KVK-nummer is verplicht" },
      { status: 400 }
    );
  }

  if (!/^\d{8}$/.test(kvkNumber)) {
    return NextResponse.json(
      { error: "KVK-nummer moet 8 cijfers bevatten" },
      { status: 400 }
    );
  }

  try {
    const result = await searchCompanyByKvk(kvkNumber);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json(
      { error: "Carerix check mislukt", details: message },
      { status: 500 }
    );
  }
}
