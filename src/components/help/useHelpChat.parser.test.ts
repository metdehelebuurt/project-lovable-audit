import { describe, it, expect } from "vitest";
import { extractDeltas, flushBuffer } from "./useHelpChat";

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

describe("extractDeltas (SSE parser)", () => {
  it("verwerkt een simpel event", () => {
    const state = { buffer: "" };
    const { deltas, done } = extractDeltas(state, sseChunk("hallo"));
    expect(deltas).toEqual(["hallo"]);
    expect(done).toBe(false);
  });

  it("verwerkt fragmentatie midden in JSON over twee chunks", () => {
    const state = { buffer: "" };
    const full = sseChunk("wereld");
    const splitAt = Math.floor(full.length / 2);
    const r1 = extractDeltas(state, full.slice(0, splitAt));
    const r2 = extractDeltas(state, full.slice(splitAt));
    expect([...r1.deltas, ...r2.deltas]).toEqual(["wereld"]);
  });

  it("verwerkt CRLF line endings", () => {
    const state = { buffer: "" };
    const crlf = `data: ${JSON.stringify({ choices: [{ delta: { content: "crlf" } }] })}\r\n\r\n`;
    const { deltas } = extractDeltas(state, crlf);
    expect(deltas).toEqual(["crlf"]);
  });

  it("verwerkt multi-line data: events", () => {
    const state = { buffer: "" };
    const json = JSON.stringify({ choices: [{ delta: { content: "multi" } }] });
    const half1 = json.slice(0, 10);
    const half2 = json.slice(10);
    const block = `data: ${half1}\ndata: ${half2}\n\n`;
    const { deltas } = extractDeltas(state, block);
    expect(deltas).toEqual(["multi"]);
  });

  it("herkent [DONE] zonder trailing newline via flushBuffer", () => {
    const state = { buffer: "" };
    extractDeltas(state, sseChunk("eind"));
    const tail = extractDeltas(state, "data: [DONE]");
    expect(tail.done).toBe(false);
    const flushed = flushBuffer(state);
    expect(flushed.done).toBe(true);
  });

  it("crasht niet op onbekende velden in choices", () => {
    const state = { buffer: "" };
    const odd = `data: ${JSON.stringify({ choices: [{ delta: { role: "assistant" } }], extra: 42 })}\n\n`;
    const { deltas } = extractDeltas(state, odd);
    expect(deltas).toEqual([]);
  });

  it("negeert SSE-comments en lege regels", () => {
    const state = { buffer: "" };
    const chunk = `: keep-alive\n\n${sseChunk("ok")}`;
    const { deltas } = extractDeltas(state, chunk);
    expect(deltas).toEqual(["ok"]);
  });
});