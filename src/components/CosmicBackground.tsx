"use client";

import { useEffect, useMemo, useRef } from "react";

interface Meteor {
  x: number;
  y: number;
  speed: number;
  length: number;
  angle: number;
  opacity: number;
  life: number;
  color: string;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createMeteor(width: number, height: number): Meteor {
  const angle = randomBetween(Math.PI * 0.12, Math.PI * 0.32);
  return {
    x: randomBetween(width * 0.45, width * 1.15),
    y: randomBetween(0, height * 0.48),
    speed: randomBetween(8, 14),
    length: randomBetween(90, 190),
    angle,
    opacity: randomBetween(0.5, 1),
    life: randomBetween(1, 2.2),
    color: Math.random() > 0.5 ? "0, 255, 255" : "34, 211, 238",
  };
}

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        top: `${(i * 37) % 100}%`,
        left: `${(i * 53) % 100}%`,
        delay: `${(i % 9) * 0.4}s`,
        size: i % 7 === 0 ? 2 : 1,
      })),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let meteors: Meteor[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      meteors = Array.from({ length: 5 }, () => createMeteor(window.innerWidth, window.innerHeight));
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      frame += 1;

      if (frame % 180 === 0 && meteors.length < 7) {
        meteors.push(createMeteor(window.innerWidth, window.innerHeight));
      }

      meteors = meteors.filter((meteor) => meteor.life > 0);
      meteors.forEach((meteor) => {
        meteor.x -= Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
        meteor.life -= 0.008;

        const tailX = meteor.x + Math.cos(meteor.angle) * meteor.length;
        const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(${meteor.color}, ${meteor.opacity})`);
        gradient.addColorStop(1, `rgba(${meteor.color}, 0)`);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 50% 18%, #151F3A 0%, rgba(21,31,58,0) 60%), radial-gradient(900px 600px at 18% 80%, #221034 0%, rgba(34,16,52,0) 62%), linear-gradient(180deg, #0B0F19 0%, #1A0B2E 100%)",
        }}
      />

      {stars.map((star, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}

      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute bottom-0 left-0 right-0 h-[220px] opacity-90">
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          viewBox="0 0 1440 220"
          preserveAspectRatio="xMidYMax slice"
          style={{
            filter:
              "drop-shadow(0 0 18px rgba(34,211,238,0.28)) drop-shadow(0 0 10px rgba(192,38,211,0.20))",
          }}
        >
          <g fill="#080B16">
            <rect x="0" y="160" width="1440" height="60" />
            <polygon points="0,220 0,130 70,130 70,175 105,175 105,220" />
            <polygon points="150,220 150,90 205,90 205,150 245,150 245,220" />
            <polygon points="320,220 320,140 370,140 370,190 420,190 420,220" />
            <polygon points="470,220 470,70 525,70 525,140 570,140 570,220" />
            <polygon points="640,220 640,110 700,110 700,170 750,170 750,220" />
            <polygon points="820,220 820,80 875,80 875,155 920,155 920,220" />
            <polygon points="980,220 980,130 1035,130 1035,185 1080,185 1080,220" />
            <polygon points="1150,220 1150,100 1205,100 1205,160 1250,160 1250,220" />
            <polygon points="1320,220 1320,150 1370,150 1370,190 1440,190 1440,220" />
          </g>
        </svg>

        <span
          className="absolute bottom-[38px] left-[18%] h-3 w-3 rounded-full bg-cyan-400/70"
          style={{ filter: "blur(18px)" }}
        />
        <span
          className="absolute bottom-[72px] left-[42%] h-3 w-3 rounded-full bg-fuchsia-400/70"
          style={{ filter: "blur(18px)" }}
        />
        <span
          className="absolute bottom-[52px] right-[26%] h-3 w-3 rounded-full bg-cyan-400/70"
          style={{ filter: "blur(18px)" }}
        />
        <span
          className="absolute bottom-[85px] right-[9%] h-3 w-3 rounded-full bg-violet-400/70"
          style={{ filter: "blur(20px)" }}
        />
      </div>

      <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[2px]" />
    </div>
  );
}
