export interface StatCardData {
  applied: number;
  interviews: number;
  offers: number;
  jobs: number;
  avgMatch: number | null;
}

const W = 1080;
const H = 1080;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawStatCard(canvas: HTMLCanvasElement, data: StatCardData): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative glow circles
  ctx.fillStyle = "rgba(96,165,250,0.18)";
  ctx.beginPath();
  ctx.arc(W - 140, 160, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(52,211,153,0.14)";
  ctx.beginPath();
  ctx.arc(140, H - 140, 180, 0, Math.PI * 2);
  ctx.fill();

  // Brand
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 40px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("Resume ↔ JD Fit Check", 72, 64);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("My job search", 72, 120);

  // Three stat columns
  const columns: Array<{ label: string; value: string; color: string }> = [
    { label: "Applied", value: String(data.applied), color: "#93c5fd" },
    { label: "Interviews", value: String(data.interviews), color: "#a7f3d0" },
    { label: "Offers", value: String(data.offers), color: "#fde68a" },
  ];

  const gap = 60;
  const cardW = (W - 72 * 2 - gap * 2) / 3;
  const cardY = 220;
  const cardH = 380;

  columns.forEach((col, i) => {
    const x = 72 + i * (cardW + gap);
    roundedRect(ctx, x, cardY, cardW, cardH, 28);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.fillStyle = col.color;
    ctx.font = "700 120px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(col.value, x + cardW / 2, cardY + 90);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "600 44px system-ui, -apple-system, sans-serif";
    ctx.fillText(col.label, x + cardW / 2, cardY + 250);
  });

  // Footer stats
  const footerY = cardY + cardH + 90;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "500 34px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  const avg = data.avgMatch !== null ? `Avg match ${data.avgMatch}/100` : "";
  ctx.fillText(`${data.jobs} job${data.jobs === 1 ? "" : "s"} tracked${avg ? "  ·  " + avg : ""}`, 72, footerY);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 30px system-ui, -apple-system, sans-serif";
  ctx.fillText("Know your fit before you apply.", 72, footerY + 52);
}
