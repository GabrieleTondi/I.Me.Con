import { NextResponse } from "next/server";
import { createMediationRequestAction } from "@/app/actions/mediation-actions";

export async function POST(req: Request) {
  // Blocco di sicurezza per produzione
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await req.json();

    const formData = new FormData();
    // Campi testuali obbligatori per lo schema Zod
    formData.append("areaId", String(data.areaId || "1"));
    formData.append("materia", data.materia || "");
    formData.append("valore", data.valore || "0.00");
    formData.append("valoreIndeterminato", data.valoreIndeterminato || "false");
    formData.append("descrizioneFatti", data.descrizioneFatti || "");

    formData.append("istanteTipo", data.istanteTipo || "PF");
    formData.append("istanteDenominazione", data.istanteDenominazione || "");
    formData.append("istanteCodiceFiscale", data.istanteCodiceFiscale || "");
    formData.append("istanteEmail", data.istanteEmail || "");
    formData.append("istanteTelefono", data.istanteTelefono || "");

    formData.append("haAvvocato", data.haAvvocato || "false");
    if (data.haAvvocato === "true") {
      formData.append("avvocatoNome", data.avvocatoNome || "");
      formData.append("avvocatoCodiceFiscale", data.avvocatoCodiceFiscale || "");
      formData.append("avvocatoEmail", data.avvocatoEmail || "");
    }

    formData.append("convenutoTipo", data.convenutoTipo || "PF");
    formData.append("convenutoDenominazione", data.convenutoDenominazione || "");
    formData.append("convenutoCodiceFiscale", data.convenutoCodiceFiscale || "");
    formData.append("convenutoEmail", data.convenutoEmail || "");
    formData.append("convenutoTelefono", data.convenutoTelefono || "");

    // Esegui l'azione server
    const result = await createMediationRequestAction(formData);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/test/mediation POST:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
