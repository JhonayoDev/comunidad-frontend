import { describe, it, expect } from "vitest";
import { crearParserSse } from "@/utils/sseParser";

describe("crearParserSse", () => {
  it("parsea un frame con event y data", () => {
    const parser = crearParserSse();
    const eventos = parser('event: metrica\ndata: {"clave":"visitasActivas","valor":2}\n\n');
    expect(eventos).toEqual([
      { event: "metrica", data: '{"clave":"visitasActivas","valor":2}' },
    ]);
  });

  it("usa el evento por defecto 'message' si no hay campo event", () => {
    const parser = crearParserSse();
    const eventos = parser("data: hola\n\n");
    expect(eventos).toEqual([{ event: "message", data: "hola" }]);
  });

  it("ignora comentarios (heartbeat :ping)", () => {
    const parser = crearParserSse();
    const eventos = parser(":ping\n\n");
    expect(eventos).toEqual([]);
  });

  it("mezcla comentarios y frames en un mismo chunk", () => {
    const parser = crearParserSse();
    const chunk =
      ":ping\n\n" +
      'event: metrica\ndata: {"clave":"visitasActivas","valor":5}\n\n' +
      ":ping\n\n";
    const eventos = parser(chunk);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toEqual({
      event: "metrica",
      data: '{"clave":"visitasActivas","valor":5}',
    });
  });

  it("une varias líneas data con saltos de línea", () => {
    const parser = crearParserSse();
    const eventos = parser("event: metrica\ndata: linea1\ndata: linea2\n\n");
    expect(eventos).toEqual([
      { event: "metrica", data: "linea1\nlinea2" },
    ]);
  });

  it("normaliza terminaciones CRLF", () => {
    const parser = crearParserSse();
    const eventos = parser('event: metrica\r\ndata: {"clave":"x","valor":1}\r\n\r\n');
    expect(eventos).toEqual([{ event: "metrica", data: '{"clave":"x","valor":1}' }]);
  });

  it("maneja frames partidos entre chunks (incremental)", () => {
    const parser = crearParserSse();
    expect(parser('event: metrica\nda')).toEqual([]);
    expect(parser('ta: {"clave":"x","valor":3}\n')).toEqual([]);
    const eventos = parser("\n");
    expect(eventos).toEqual([{ event: "metrica", data: '{"clave":"x","valor":3}' }]);
  });

  it("parsea múltiples frames en un solo chunk", () => {
    const parser = crearParserSse();
    const chunk =
      'event: metrica\ndata: {"clave":"a","valor":1}\n\n' +
      'event: metrica\ndata: {"clave":"b","valor":2}\n\n';
    const eventos = parser(chunk);
    expect(eventos).toHaveLength(2);
    expect(eventos[1]).toEqual({ event: "metrica", data: '{"clave":"b","valor":2}' });
  });

  it("ignora frames sin líneas data", () => {
    const parser = crearParserSse();
    const eventos = parser("event: metrica\n\n");
    expect(eventos).toEqual([]);
  });
});
