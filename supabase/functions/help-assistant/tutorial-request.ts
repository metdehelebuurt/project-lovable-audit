// Roept het model aan via de Lovable AI Gateway Responses API en levert het
// ruwe JSON-plan terug. Streaming is verplicht op /v1/responses.

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["titel", "samenvatting", "stappen"],
  properties: {
    titel: { type: "string" },
    samenvatting: { type: "string" },
    stappen: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["titel", "uitleg", "wacht", "route", "anchor", "textMatch", "elementType"],
        properties: {
          titel: { type: "string" },
          uitleg: { type: "string" },
          wacht: { type: "string", enum: ["klik", "invoer", "lezen"] },
          route: { type: ["string", "null"] },
          anchor: { type: ["string", "null"] },
          textMatch: { type: ["string", "null"] },
          elementType: { type: ["string", "null"], enum: ["button", "link", "input", "any", null] },
        },
      },
    },
  },
} as const;

function leesSseTekst(chunk: string, deltas: string[]): void {
  for (const regel of chunk.split("\n")) {
    if (!regel.startsWith("data:")) continue;
    const payload = regel.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const evt = JSON.parse(payload);
      if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") deltas.push(evt.delta);
    } catch {
      // onvolledig event — volgende chunk vult aan
    }
  }
}

export interface TutorialModelResultaat {
  status: number;
  json?: unknown;
  fout?: string;
}

export async function vraagTutorialPlan(
  apiKey: string,
  systemPrompt: string,
  vraag: string,
): Promise<TutorialModelResultaat> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      stream: true,
      store: false,
      instructions: systemPrompt,
      input: [{ role: "user", content: [{ type: "input_text", text: vraag }] }],
      text: { format: { type: "json_schema", name: "tutorial_plan", strict: true, schema: PLAN_SCHEMA } },
    }),
  });

  if (!res.ok || !res.body) {
    const tekst = await res.text().catch(() => "");
    console.error("tutorial gateway fout", res.status, tekst.slice(0, 500));
    return { status: res.status === 429 || res.status === 402 ? res.status : 500, fout: "AI fout" };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const deltas: string[] = [];
  let rest = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    rest += decoder.decode(value, { stream: true });
    const blokken = rest.split("\n\n");
    rest = blokken.pop() ?? "";
    for (const blok of blokken) leesSseTekst(blok, deltas);
  }
  if (rest) leesSseTekst(rest, deltas);

  const tekst = deltas.join("").trim();
  if (!tekst) return { status: 500, fout: "Leeg antwoord" };
  try {
    return { status: 200, json: JSON.parse(tekst) };
  } catch {
    console.error("tutorial JSON onparseerbaar", tekst.slice(0, 300));
    return { status: 500, fout: "Onbruikbaar antwoord" };
  }
}
