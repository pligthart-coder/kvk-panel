import { NextResponse } from "next/server";
import { createCompanyInCarerix } from "@/lib/carerix";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { kvkCompany } = body;

    if (!kvkCompany || !kvkCompany.kvkNumber) {
      return NextResponse.json(
        { error: "KVK company data is verplicht" },
        { status: 400 }
      );
    }

    const result = await createCompanyInCarerix(kvkCompany);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        companyId: result.companyId,
        message: `Bedrijf succesvol aangemaakt in Carerix (ID: ${result.companyId})`,
      });
    } else {
      return NextResponse.json(
        { error: "Aanmaken mislukt", details: result.error },
        { status: 500 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json(
      { error: "Carerix create mislukt", details: message },
      { status: 500 }
    );
  }
}
