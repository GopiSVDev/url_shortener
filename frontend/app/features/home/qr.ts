import type { QrCodeGenerateResult } from "uqr";

const GRADIENT = ["#5f3dc4", "#1971c2", "#0c8599"];
const QUIET_ZONE = 2;
const TRACE_WIDTH = 0.36;
const PAD_RADIUS = 0.42;

const POSITION = 2;
const ALIGNMENT = 4;

export async function createQrDataUrl(value: string) {
  const { encode } = await import("uqr");
  const svg = renderCircuitSvg(encode(value, { ecc: "H", border: 0 }));
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function renderCircuitSvg({ size, data, types }: QrCodeGenerateResult) {
  const isTrace = (x: number, y: number) =>
    data[y]?.[x] === true &&
    types[y][x] !== POSITION &&
    types[y][x] !== ALIGNMENT;

  const traces: string[] = [];
  const pads: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isTrace(x, y)) continue;
      const cx = x + 0.5;
      const cy = y + 0.5;
      if (isTrace(x + 1, y)) traces.push(`M${cx} ${cy}h1`);
      if (isTrace(x, y + 1)) traces.push(`M${cx} ${cy}v1`);

      const links = [
        isTrace(x - 1, y),
        isTrace(x + 1, y),
        isTrace(x, y - 1),
        isTrace(x, y + 1),
      ].filter(Boolean).length;
      // Pads on trace ends and lone modules; joints are covered by the trace itself.
      if (links <= 1)
        pads.push(`<circle cx="${cx}" cy="${cy}" r="${PAD_RADIUS}"/>`);
    }
  }

  const corners = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];

  const finders = corners.map(([x, y]) => chip(x, y, 7)).join("");
  const alignments = findAlignmentCenters(size, types)
    .map(([x, y]) => chip(x - 2, y - 2, 5))
    .join("");

  const full = size + QUIET_ZONE * 2;
  const stops = GRADIENT.map(
    (color, i) =>
      `<stop offset="${i / (GRADIENT.length - 1)}" stop-color="${color}"/>`,
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-QUIET_ZONE} ${-QUIET_ZONE} ${full} ${full}">
<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="${size}">${stops}</linearGradient></defs>
<rect x="${-QUIET_ZONE}" y="${-QUIET_ZONE}" width="${full}" height="${full}" fill="#fff"/>
<g fill="url(#g)" stroke="url(#g)">
<path d="${traces.join("")}" fill="none" stroke-width="${TRACE_WIDTH}" stroke-linecap="round"/>
<g stroke="none">${pads.join("")}${finders}${alignments}</g>
</g>
</svg>`;
}

function chip(x: number, y: number, span: number) {
  const ring = span - 1;
  const core = span - 4;
  return (
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${ring}" height="${ring}" rx="${span / 4}" fill="none" stroke="url(#g)" stroke-width="1"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="${core}" height="${core}" rx="${core / 3}" stroke="none"/>`
  );
}

function findAlignmentCenters(size: number, types: number[][]) {
  const centers: [number, number][] = [];
  for (let y = 2; y < size - 2; y++) {
    for (let x = 2; x < size - 2; x++) {
      const isTopLeftCorner =
        types[y - 2][x - 2] === ALIGNMENT &&
        types[y - 2][x - 3] !== ALIGNMENT &&
        types[y - 3]?.[x - 2] !== ALIGNMENT;
      if (types[y][x] === ALIGNMENT && isTopLeftCorner) centers.push([x, y]);
    }
  }
  return centers;
}

export async function downloadQrPng(
  svgDataUrl: string,
  fileName: string,
  size = 1024,
) {
  const image = new Image();
  image.src = svgDataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  canvas.getContext("2d")!.drawImage(image, 0, 0, size, size);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${fileName}.png`;
  link.click();
}
