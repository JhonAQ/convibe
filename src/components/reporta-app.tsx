"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Me,
  type Report,
  type ZoneId,
  STATUS_LABEL,
  ZONES,
  compressPhoto,
  loadMe,
  loadReports,
  newReportId,
  saveMe,
  saveReports,
  timeAgo,
  zoneLabel,
} from "@/lib/reports";
import { Bell, Camera, Check, Close, Copy, Hand, Plus, ZONE_ICON } from "@/components/icons";

type Sort = "recientes" | "confirmados";

export function ReportaApp() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [sort, setSort] = useState<Sort>("recientes");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
    setReports(loadReports());
    setMe(loadMe());
  }, []);

  const update = (next: Report[]) => {
    setReports(next);
    saveReports(next);
  };

  const sorted = useMemo(() => {
    if (!reports) return [];
    const list = [...reports];
    if (sort === "confirmados") list.sort((a, b) => b.confirmations.length - a.confirmations.length || b.createdAt - a.createdAt);
    else list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [reports, sort]);

  const pending = reports?.filter((r) => r.status !== "resuelto").length ?? 0;
  const neighbors = reports?.reduce((n, r) => n + r.confirmations.length, 0) ?? 0;

  const toggleConfirm = (id: string) => {
    if (!reports || !me) return;
    navigator.vibrate?.(10);
    update(
      reports.map((r) => {
        if (r.id !== id) return r;
        const has = r.confirmations.includes(me.deviceId);
        return { ...r, confirmations: has ? r.confirmations.filter((c) => c !== me.deviceId) : [...r.confirmations, me.deviceId] };
      }),
    );
  };

  const submit = (r: Report, nextMe: Me) => {
    if (!reports) return;
    update([r, ...reports]);
    setMe(nextMe);
    saveMe(nextMe);
    setSheetOpen(false);
    setCreated(r);
    setSort("recientes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-36" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-3">
        <div className="flex items-center gap-3">
          <div className="gradient-brand flex size-11 items-center justify-center rounded-2xl text-white shadow-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M12 9v4" /><path d="M12 16.5v.01" /></svg>
          </div>
          <div className="leading-tight">
            <p className="text-[13px] text-muted">Edificio Central</p>
            <p className="text-[15px] font-semibold">{me?.name ? `Hola, ${me.name.split(" ")[0]}` : "ReportaFácil"}</p>
          </div>
        </div>
        <button aria-label="Notificaciones" className="flex size-11 items-center justify-center rounded-full bg-card text-ink shadow-soft active:scale-95 transition">
          <Bell width={20} height={20} />
        </button>
      </header>

      <h1 className="px-5 pt-6 text-[30px] font-semibold leading-[1.1] tracking-tight text-balance">
        Incidencias de tu edificio
      </h1>

      {/* Summary */}
      <section className="px-5 pt-5">
        <div className="gradient-brand flex items-center gap-4 rounded-[28px] p-2 pr-5 text-white shadow-brand">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[22px] bg-white text-brand">
            <span className="text-[22px] font-bold tabular-nums">{reports ? pending : "–"}</span>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[16px] font-semibold">Daños pendientes</p>
            <p className="text-[13px] text-white/85">{neighbors} confirmaciones de vecinos</p>
          </div>
        </div>
      </section>

      {/* Segmented */}
      <div className="px-5 pt-5">
        <div className="flex gap-2">
          {(["recientes", "confirmados"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`h-10 rounded-full px-5 text-[14px] font-medium transition active:scale-95 ${
                sort === s ? "bg-ink text-white" : "bg-card text-ink shadow-soft"
              }`}
            >
              {s === "recientes" ? "Recientes" : "Más confirmados"}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <main className="flex flex-col gap-3 px-5 pt-4">
        {!reports &&
          [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-[28px] bg-card/70" />)}
        {sorted.map((r) => (
          <ReportCard key={r.id} r={r} me={me} onConfirm={() => toggleConfirm(r.id)} highlight={created?.id === r.id} />
        ))}
        {reports && sorted.length === 0 && (
          <div className="rounded-[28px] bg-card p-8 text-center shadow-soft">
            <p className="font-semibold">Todo en orden</p>
            <p className="mt-1 text-[14px] text-muted">Cuando un vecino reporte un daño, aparecerá aquí.</p>
          </div>
        )}
      </main>

      {/* Primary action */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/80 to-transparent px-5 pt-10"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => setSheetOpen(true)}
          className="gradient-brand pointer-events-auto flex h-16 w-full max-w-md items-center justify-center gap-3 rounded-full pl-2 pr-6 text-[17px] font-semibold text-white shadow-brand transition active:scale-[0.98]"
        >
          <span className="ml-auto flex size-12 items-center justify-center rounded-full bg-white text-brand">
            <Camera />
          </span>
          <span className="mr-auto">Reportar un daño</span>
        </button>
      </div>

      {sheetOpen && me && <ReportSheet me={me} onClose={() => setSheetOpen(false)} onSubmit={submit} />}
      {created && <SuccessSheet r={created} onClose={() => setCreated(null)} />}
    </div>
  );
}

/* ---------------- Card ---------------- */

function ReportCard({ r, me, onConfirm, highlight }: { r: Report; me: Me | null; onConfirm: () => void; highlight: boolean }) {
  const Icon = ZONE_ICON[r.zone];
  const confirmed = !!me && r.confirmations.includes(me.deviceId);
  const isMine = !!me && r.author.name === me.name && r.author.unit === me.unit && !!me.name;
  const [pop, setPop] = useState(0);
  const initials = r.author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className={`anim-card rounded-[28px] bg-card p-4 shadow-soft ${highlight ? "ring-2 ring-brand/40" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">{initials}</div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold">{r.author.name}</p>
          <p className="text-[13px] text-muted">
            {r.author.unit} · {timeAgo(r.createdAt)}
          </p>
        </div>
        <StatusPill s={r.status} />
      </div>

      {r.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photo} alt={r.title} className="mt-3 aspect-[4/3] w-full rounded-[20px] object-cover" />
      )}

      <div className="mt-3 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted">{zoneLabel(r.zone)}</p>
          <h3 className="text-[17px] font-semibold leading-snug">{r.title}</h3>
          {r.description && <p className="mt-1 text-[14px] leading-relaxed text-muted">{r.description}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-wide text-muted">{r.id}</span>
        {isMine ? (
          <span className="flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-[14px] text-muted">
            <Hand width={18} height={18} />
            <span className="tabular-nums">{r.confirmations.length}</span> confirman
          </span>
        ) : (
          <button
            onClick={() => {
              setPop((p) => p + 1);
              onConfirm();
            }}
            aria-pressed={confirmed}
            className={`flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition active:scale-95 ${
              confirmed ? "gradient-brand text-white shadow-brand" : "bg-brand-soft text-brand"
            }`}
          >
            <Hand key={pop} width={18} height={18} className={pop ? "anim-pop" : ""} />
            Me pasa también
            <span className="tabular-nums">· {r.confirmations.length}</span>
          </button>
        )}
      </div>
    </article>
  );
}

function StatusPill({ s }: { s: Report["status"] }) {
  const cls =
    s === "pendiente" ? "bg-warn-soft text-warn" : s === "en_arreglo" ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok";
  return <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${cls}`}>{STATUS_LABEL[s]}</span>;
}

/* ---------------- Sheet ---------------- */

function Sheet({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="anim-fade absolute inset-0 bg-[#0f1d2b]/35 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="anim-sheet relative max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-bg px-5 pt-3"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#c9d6e3]" />
        {children}
      </div>
    </div>
  );
}

function ReportSheet({ me, onClose, onSubmit }: { me: Me; onClose: () => void; onSubmit: (r: Report, me: Me) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState(me.name);
  const [unit, setUnit] = useState(me.unit);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const needsIdentity = !me.name || !me.unit;

  const ready = zone && title.trim() && name.trim() && unit.trim();

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      setPhoto(await compressPhoto(f));
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    if (!ready || !zone) return;
    const now = new Date();
    onSubmit(
      {
        id: newReportId(now),
        zone,
        title: title.trim(),
        description: desc.trim(),
        photo,
        author: { name: name.trim(), unit: unit.trim() },
        createdAt: now.getTime(),
        status: "pendiente",
        confirmations: [],
      },
      { ...me, name: name.trim(), unit: unit.trim() },
    );
  };

  return (
    <Sheet onClose={onClose} label="Reportar un daño">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight">Reportar un daño</h2>
        <button onClick={onClose} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-full bg-card shadow-soft active:scale-95">
          <Close width={18} height={18} />
        </button>
      </div>

      {/* Photo */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <button
        onClick={() => fileRef.current?.click()}
        className="relative mt-4 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-brand/30 bg-card text-brand active:scale-[0.99] transition"
      >
        {photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Foto del daño" className="absolute inset-0 size-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-medium text-ink backdrop-blur">Cambiar foto</span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span className="gradient-brand flex size-14 items-center justify-center rounded-full text-white shadow-brand">
              {busy ? <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera width={26} height={26} />}
            </span>
            <span className="text-[15px] font-semibold">Tomar foto del daño</span>
            <span className="text-[13px] text-muted">Opcional, pero ayuda mucho</span>
          </span>
        )}
      </button>

      {/* Zone */}
      <p className="mt-5 mb-2 text-[13px] font-semibold text-muted">¿Dónde está?</p>
      <div className="grid grid-cols-4 gap-2">
        {ZONES.map((z) => {
          const Icon = ZONE_ICON[z.id];
          const on = zone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setZone(z.id)}
              aria-pressed={on}
              className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[20px] text-[11.5px] font-medium leading-tight transition active:scale-95 ${
                on ? "bg-card text-brand ring-2 ring-brand shadow-soft" : "bg-card text-ink shadow-soft"
              }`}
            >
              <span className={`flex size-9 items-center justify-center rounded-full ${on ? "gradient-brand text-white" : "bg-brand-soft text-brand"}`}>
                <Icon width={19} height={19} />
              </span>
              <span className="px-1 text-center">{z.label}</span>
            </button>
          );
        })}
      </div>

      {/* Text */}
      <div className="mt-5 flex flex-col gap-2 rounded-[24px] bg-card p-1.5 shadow-soft">
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={70}
          placeholder="¿Qué pasa? Ej: Fuga en el pasillo"
          className="h-12 rounded-[18px] bg-transparent px-4 text-[16px] outline-none placeholder:text-muted/70"
        />
        <div className="mx-4 h-px bg-line" />
        <textarea
          id="desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="Detalles (opcional)"
          className="resize-none rounded-[18px] bg-transparent px-4 py-2 text-[15px] outline-none placeholder:text-muted/70"
        />
      </div>

      {needsIdentity && (
        <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-2">
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="given-name"
            className="h-12 rounded-[18px] bg-card px-4 text-[16px] shadow-soft outline-none placeholder:text-muted/70"
          />
          <input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Piso / Apto"
            className="h-12 rounded-[18px] bg-card px-4 text-[16px] shadow-soft outline-none placeholder:text-muted/70"
          />
        </div>
      )}

      <button
        onClick={send}
        disabled={!ready}
        className="gradient-brand mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full text-[17px] font-semibold text-white shadow-brand transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        <Plus width={20} height={20} />
        Enviar reporte
      </button>
      {!ready && (
        <p className="mt-2 text-center text-[13px] text-muted">
          {!zone ? "Elige dónde está el daño" : !title.trim() ? "Cuéntanos qué pasa" : "Agrega tu nombre y piso"}
        </p>
      )}
    </Sheet>
  );
}

/* ---------------- Success ---------------- */

function SuccessSheet({ r, onClose }: { r: Report; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const Icon = ZONE_ICON[r.zone];
  const date = new Date(r.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(r.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Sheet onClose={onClose} label="Reporte enviado">
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="anim-pop flex size-16 items-center justify-center rounded-full bg-ok-soft text-ok">
          <Check width={32} height={32} strokeWidth={2.4} />
        </div>
        <h2 className="mt-3 text-[22px] font-semibold tracking-tight">Reporte enviado</h2>
        <p className="mt-1 text-[14px] text-muted">Tus vecinos y la administración ya pueden verlo.</p>
      </div>

      <div className="mt-5 rounded-[24px] bg-card p-4 shadow-soft">
        <button onClick={copy} className="flex w-full items-center justify-between rounded-[18px] bg-brand-soft px-4 py-3 text-left active:scale-[0.99] transition">
          <span>
            <span className="block text-[12px] font-medium text-brand/80">ID del reporte</span>
            <span className="font-mono text-[17px] font-semibold tracking-wide text-brand">{r.id}</span>
          </span>
          <span className="flex items-center gap-1 text-[13px] font-medium text-brand">
            {copied ? <Check width={18} height={18} /> : <Copy width={18} height={18} />}
            {copied ? "Copiado" : "Copiar"}
          </span>
        </button>

        <dl className="mt-2 divide-y divide-line text-[14px]">
          <Row k="Zona">
            <span className="flex items-center gap-2"><Icon width={16} height={16} className="text-brand" />{zoneLabel(r.zone)}</span>
          </Row>
          <Row k="Daño">{r.title}</Row>
          <Row k="Reportado por">{r.author.name} · {r.author.unit}</Row>
          <Row k="Fecha">{date}</Row>
          <Row k="Foto">{r.photo ? "Adjunta" : "Sin foto"}</Row>
          <Row k="Estado"><StatusPill s={r.status} /></Row>
        </dl>
      </div>

      <button onClick={onClose} className="mt-5 h-14 w-full rounded-full bg-ink text-[17px] font-semibold text-white active:scale-[0.98] transition">
        Listo
      </button>
    </Sheet>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  );
}
