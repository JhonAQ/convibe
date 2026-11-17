"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type Me,
  type Report,
  type ZoneId,
  STATUS_LABEL,
  ZONES,
  apiConfirm,
  apiCreate,
  apiList,
  compressPhoto,
  loadMe,
  saveMe,
  timeAgo,
  zoneLabel,
} from "@/lib/reports";
import { Bell, Camera, Check, Close, Copy, Hand, ZONE_ICON } from "@/components/icons";

type Sort = "recientes" | "confirmados";

export function ReportaApp() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [sort, setSort] = useState<Sort>("recientes");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [, tick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setReports(await apiList());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- identity lives in localStorage
    setMe(loadMe());
    refresh();
    // Live-ish feed: poll while visible, refresh when the app comes back.
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
      tick((t) => t + 1);
    }, 4000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const sorted = useMemo(() => {
    if (!reports) return [];
    const list = [...reports];
    if (sort === "confirmados")
      list.sort((a, b) => b.confirmations.length - a.confirmations.length || b.createdAt - a.createdAt);
    else list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [reports, sort]);

  const pending = reports?.filter((r) => r.status !== "resuelto").length ?? 0;
  const neighbors = reports?.reduce((n, r) => n + r.confirmations.length, 0) ?? 0;

  const toggleConfirm = async (id: string) => {
    if (!reports || !me) return;
    navigator.vibrate?.(8);
    const flip = (r: Report) => {
      const has = r.confirmations.includes(me.deviceId);
      return { ...r, confirmations: has ? r.confirmations.filter((c) => c !== me.deviceId) : [...r.confirmations, me.deviceId] };
    };
    setReports((rs) => rs?.map((r) => (r.id === id ? flip(r) : r)) ?? rs);
    try {
      const fresh = await apiConfirm(id, me.deviceId);
      setReports((rs) => rs?.map((r) => (r.id === id ? fresh : r)) ?? rs);
    } catch {
      setReports((rs) => rs?.map((r) => (r.id === id ? flip(r) : r)) ?? rs);
      setToast("No se pudo guardar. Revisa tu conexión.");
    }
  };

  const onCreated = (r: Report, nextMe: Me) => {
    setReports((rs) => [r, ...(rs ?? []).filter((x) => x.id !== r.id)]);
    setMe(nextMe);
    saveMe(nextMe);
    setSheetOpen(false);
    setCreated(r);
    setSort("recientes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const firstName = me?.name?.split(" ")[0];

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-40" style={{ paddingTop: "max(14px, env(safe-area-inset-top))" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-2">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="size-11 rounded-[14px] shadow-brand" />
          <div className="leading-[1.15]">
            <p className="text-[17px] font-semibold tracking-tight">ConVibe</p>
            <p className="text-[13px] text-muted">Edificio Central</p>
          </div>
        </div>
        <button
          aria-label="Notificaciones"
          className="relative flex size-11 items-center justify-center rounded-full bg-card text-ink shadow-soft transition active:scale-90"
        >
          <Bell width={20} height={20} />
          <span className="absolute right-3 top-3 size-2 rounded-full bg-brand ring-2 ring-white" />
        </button>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-7">
        <p className="text-[15px] text-muted">{firstName ? `Hola, ${firstName}` : "Hola, vecino"}</p>
        <h1 className="mt-0.5 text-[32px] font-medium leading-[1.08] tracking-[-0.02em] text-balance">
          ¿Qué está fallando en tu edificio?
        </h1>
      </section>

      {/* Summary pill */}
      <section className="px-5 pt-6">
        <div className="gradient-brand flex items-center gap-4 rounded-full p-2 pr-5 text-white shadow-brand">
          <div className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-white text-brand">
            <span className="text-[24px] font-semibold tabular-nums">{reports ? pending : "–"}</span>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[17px] font-medium">Daños por atender</p>
            <p className="mt-0.5 text-[13.5px] font-light text-white/90">
              {neighbors} {neighbors === 1 ? "confirmación" : "confirmaciones"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-medium">
            <span className={`size-1.5 rounded-full ${offline ? "bg-white/50" : "anim-dot bg-white"}`} />
            {offline ? "Sin red" : "En vivo"}
          </span>
        </div>
      </section>

      {/* Sort chips */}
      <nav className="flex gap-2 px-5 pt-6" aria-label="Ordenar reportes">
        {(["recientes", "confirmados"] as Sort[]).map((s) => {
          const on = sort === s;
          return (
            <button
              key={s}
              onClick={() => setSort(s)}
              aria-pressed={on}
              className={`h-11 rounded-full px-5 text-[15px] transition active:scale-95 ${
                on ? "bg-card font-medium text-brand ring-[1.5px] ring-brand shadow-soft" : "bg-card/70 text-ink"
              }`}
            >
              {s === "recientes" ? "Recientes" : "Más confirmados"}
            </button>
          );
        })}
      </nav>

      {/* Feed */}
      <main className="flex flex-col gap-3.5 px-5 pt-4">
        {!reports && [0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-[30px] bg-card/80" />)}
        {sorted.map((r) => (
          <ReportCard key={r.id} r={r} me={me} onConfirm={() => toggleConfirm(r.id)} highlight={created?.id === r.id} />
        ))}
        {reports && sorted.length === 0 && (
          <div className="rounded-[30px] bg-card p-8 text-center shadow-soft">
            <p className="text-[17px] font-medium">Todo en orden</p>
            <p className="mt-1 text-[14px] text-muted">Cuando un vecino reporte un daño, aparecerá aquí.</p>
          </div>
        )}
      </main>

      {/* Primary action */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-5 pt-12"
        style={{
          paddingBottom: "max(18px, env(safe-area-inset-bottom))",
          background: "linear-gradient(to top, var(--bg) 35%, color-mix(in srgb, var(--bg) 0%, transparent))",
        }}
      >
        <button
          onClick={() => setSheetOpen(true)}
          className="gradient-brand pointer-events-auto flex h-[64px] w-full max-w-md items-center gap-3 rounded-full p-2 pr-6 text-white shadow-brand transition active:scale-[0.98]"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-brand">
            <Camera width={22} height={22} />
          </span>
          <span className="flex-1 text-left text-[17px] font-medium">Reportar un daño</span>
          <span className="text-[13px] font-light text-white/85">Toma 10 s</span>
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className="anim-toast glass fixed left-1/2 z-50 rounded-full px-4 py-2.5 text-[14px] font-medium shadow-soft"
          style={{ top: "max(14px, env(safe-area-inset-top))", transform: "translateX(-50%)" }}
        >
          {toast}
        </div>
      )}

      {sheetOpen && me && <ReportSheet me={me} onClose={() => setSheetOpen(false)} onCreated={onCreated} />}
      {created && <SuccessSheet r={created} onClose={() => setCreated(null)} />}
    </div>
  );
}

/* ---------------- Card ---------------- */

function ReportCard({ r, me, onConfirm, highlight }: { r: Report; me: Me | null; onConfirm: () => void; highlight: boolean }) {
  const Icon = ZONE_ICON[r.zone];
  const confirmed = !!me && r.confirmations.includes(me.deviceId);
  const isMine = !!me && r.authorDevice === me.deviceId;
  const [pop, setPop] = useState(0);
  const n = r.confirmations.length;
  const initials = r.author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className={`anim-card rounded-[30px] bg-card p-4 shadow-soft ${highlight ? "ring-2 ring-brand/30" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
          {initials}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15.5px] font-medium">{r.author.name}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            {r.author.unit} · {timeAgo(r.createdAt)}
          </p>
        </div>
        <StatusPill s={r.status} />
      </div>

      {r.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photo} alt={r.title} loading="lazy" className="mt-3.5 aspect-[4/3] w-full rounded-[22px] object-cover" />
      )}

      <div className="mt-3.5 px-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1 pl-1.5 pr-3 text-[12.5px] font-medium text-brand">
          <span className="flex size-6 items-center justify-center rounded-full bg-white">
            <Icon width={14} height={14} strokeWidth={2} />
          </span>
          {zoneLabel(r.zone)}
        </span>
        <h3 className="mt-2.5 text-[19px] font-medium leading-snug tracking-[-0.01em]">{r.title}</h3>
        {r.description && <p className="mt-1 text-[15px] font-light leading-relaxed text-muted">{r.description}</p>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
        <span className="text-[12px] font-medium tracking-[0.04em] text-muted/80 tabular-nums">{r.id}</span>
        {isMine ? (
          <span className="flex h-10 items-center gap-2 rounded-full bg-bg px-4 text-[14px] text-muted">
            <Hand width={17} height={17} />
            <span className="tabular-nums">{n}</span> {n === 1 ? "confirma" : "confirman"}
          </span>
        ) : (
          <button
            onClick={() => {
              setPop((p) => p + 1);
              onConfirm();
            }}
            aria-pressed={confirmed}
            className={`flex h-10 items-center gap-2 rounded-full pl-3.5 pr-4 text-[14.5px] font-medium transition active:scale-95 ${
              confirmed ? "gradient-brand text-white shadow-brand" : "bg-brand-soft text-brand"
            }`}
          >
            <Hand key={pop} width={18} height={18} className={pop ? "anim-pop" : ""} />
            {confirmed ? "Te pasa también" : "Me pasa también"}
            <span className={`rounded-full px-1.5 text-[13px] tabular-nums ${confirmed ? "bg-white/25" : "bg-white"}`}>{n}</span>
          </button>
        )}
      </div>
    </article>
  );
}

function StatusPill({ s }: { s: Report["status"] }) {
  const cls =
    s === "pendiente" ? "bg-warn-soft text-warn" : s === "en_arreglo" ? "bg-brand-soft text-brand" : "bg-ok-soft text-ok";
  return (
    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium ${cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[s]}
    </span>
  );
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
      <div className="anim-fade absolute inset-0 bg-[#0d1b2a]/30 backdrop-blur-[3px]" onClick={onClose} />
      <div
        className="anim-sheet relative max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-bg px-5 pt-2.5"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#cfdae6]" />
        {children}
      </div>
    </div>
  );
}

function ReportSheet({ me, onClose, onCreated }: { me: Me; onClose: () => void; onCreated: (r: Report, me: Me) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState(me.name);
  const [unit, setUnit] = useState(me.unit);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const needsIdentity = !me.name || !me.unit;

  const ready = !!zone && !!title.trim() && !!name.trim() && !!unit.trim();
  const hint = !zone ? "Elige dónde está el daño" : !title.trim() ? "Cuéntanos qué pasa" : "Agrega tu nombre y piso";

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setLoadingPhoto(true);
    try {
      setPhoto(await compressPhoto(f));
    } catch {
      setError("No pudimos leer esa foto. Prueba con otra.");
    } finally {
      setLoadingPhoto(false);
    }
  };

  const send = async () => {
    if (!ready || !zone || sending) return;
    setSending(true);
    setError(null);
    const nextMe = { ...me, name: name.trim(), unit: unit.trim() };
    try {
      const r = await apiCreate({
        zone,
        title: title.trim(),
        description: desc.trim(),
        photo,
        author: { name: nextMe.name, unit: nextMe.unit },
        deviceId: me.deviceId,
      });
      navigator.vibrate?.([10, 40, 10]);
      onCreated(r, nextMe);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "No se pudo enviar. Revisa tu conexión.");
      setSending(false);
    }
  };

  return (
    <Sheet onClose={onClose} label="Reportar un daño">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-medium tracking-[-0.02em]">Reportar un daño</h2>
        <button onClick={onClose} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-full bg-card shadow-soft active:scale-90 transition">
          <Close width={18} height={18} />
        </button>
      </div>

      {/* Photo */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <button
        onClick={() => fileRef.current?.click()}
        className="relative mt-4 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[28px] bg-card shadow-soft transition active:scale-[0.99]"
      >
        {photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Foto del daño" className="absolute inset-0 size-full object-cover" />
            <span className="glass absolute bottom-3 right-3 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink">Cambiar foto</span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2.5">
            <span className="gradient-brand flex size-16 items-center justify-center rounded-full text-white shadow-brand">
              {loadingPhoto ? (
                <span className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera width={28} height={28} />
              )}
            </span>
            <span className="text-[16px] font-medium">Tomar foto del daño</span>
            <span className="-mt-1.5 text-[13px] text-muted">Opcional, pero ayuda mucho</span>
          </span>
        )}
      </button>

      {/* Zone */}
      <p className="mb-2.5 mt-6 text-[14px] font-medium text-muted">¿Dónde está?</p>
      <div className="grid grid-cols-4 gap-2">
        {ZONES.map((z) => {
          const Icon = ZONE_ICON[z.id];
          const on = zone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setZone(z.id)}
              aria-pressed={on}
              className={`flex aspect-[1/1.05] flex-col items-center justify-center gap-2 rounded-[22px] bg-card text-[12px] leading-tight shadow-soft transition active:scale-95 ${
                on ? "font-medium text-brand ring-[1.5px] ring-brand" : "text-ink"
              }`}
            >
              <span
                className={`flex size-10 items-center justify-center rounded-full transition ${
                  on ? "gradient-brand text-white shadow-brand" : "bg-brand-soft text-brand"
                }`}
              >
                <Icon width={20} height={20} />
              </span>
              <span className="px-1 text-center">{z.label}</span>
            </button>
          );
        })}
      </div>

      {/* Text */}
      <p className="mb-2.5 mt-6 text-[14px] font-medium text-muted">¿Qué pasa?</p>
      <div className="flex flex-col rounded-[24px] bg-card shadow-soft">
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={70}
          placeholder="Ej: Fuga de agua en el pasillo"
          className="h-14 rounded-t-[24px] bg-transparent px-5 text-[16px] outline-none placeholder:font-light placeholder:text-muted/70"
        />
        <div className="mx-5 h-px bg-line" />
        <textarea
          id="desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder="Detalles (opcional)"
          className="resize-none rounded-b-[24px] bg-transparent px-5 py-3.5 text-[16px] outline-none placeholder:font-light placeholder:text-muted/70"
        />
      </div>

      {needsIdentity && (
        <>
          <p className="mb-2.5 mt-6 text-[14px] font-medium text-muted">¿Quién reporta? <span className="font-light">Solo la primera vez</span></p>
          <div className="grid grid-cols-[1.4fr_1fr] gap-2">
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Tu nombre"
              autoComplete="given-name"
              className="h-14 rounded-[20px] bg-card px-5 text-[16px] shadow-soft outline-none placeholder:font-light placeholder:text-muted/70"
            />
            <input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={20}
              placeholder="Piso o apto"
              className="h-14 rounded-[20px] bg-card px-5 text-[16px] shadow-soft outline-none placeholder:font-light placeholder:text-muted/70"
            />
          </div>
        </>
      )}

      <button
        onClick={send}
        disabled={!ready || sending}
        className="gradient-brand mt-7 flex h-[60px] w-full items-center justify-center gap-2 rounded-full text-[17px] font-medium text-white shadow-brand transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {sending ? <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Enviar reporte"}
      </button>
      <p className={`mt-2.5 text-center text-[13px] ${error ? "font-medium text-warn" : "text-muted"}`}>
        {error ?? (ready ? "Tus vecinos lo verán al instante" : hint)}
      </p>
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
      <div className="flex flex-col items-center pt-1 text-center">
        <div className="anim-pop gradient-brand flex size-[72px] items-center justify-center rounded-full text-white shadow-brand">
          <Check width={34} height={34} strokeWidth={2.4} />
        </div>
        <h2 className="mt-4 text-[26px] font-medium tracking-[-0.02em]">Reporte enviado</h2>
        <p className="mt-1 text-[15px] font-light text-muted">Tus vecinos y la administración ya pueden verlo.</p>
      </div>

      <div className="mt-6 rounded-[28px] bg-card p-2 shadow-soft">
        <button
          onClick={copy}
          className="flex w-full items-center justify-between rounded-[22px] bg-brand-soft px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span>
            <span className="block text-[12.5px] text-brand/80">ID del reporte</span>
            <span className="text-[20px] font-semibold tracking-[0.03em] text-brand tabular-nums">{r.id}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-brand">
            {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
            {copied ? "Copiado" : "Copiar"}
          </span>
        </button>

        <dl className="divide-y divide-line px-3 text-[15px]">
          <Row k="Zona">
            <span className="flex items-center gap-2">
              <Icon width={16} height={16} className="text-brand" />
              {zoneLabel(r.zone)}
            </span>
          </Row>
          <Row k="Daño">{r.title}</Row>
          <Row k="Reporta">
            {r.author.name} · {r.author.unit}
          </Row>
          <Row k="Fecha">{date}</Row>
          <Row k="Foto">{r.photo ? "Adjunta" : "Sin foto"}</Row>
          <Row k="Estado">
            <StatusPill s={r.status} />
          </Row>
        </dl>
      </div>

      <button onClick={onClose} className="mt-6 h-[60px] w-full rounded-full bg-ink text-[17px] font-medium text-white transition active:scale-[0.98]">
        Listo
      </button>
    </Sheet>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="font-light text-muted">{k}</dt>
      <dd className="min-w-0 text-right font-medium">{children}</dd>
    </div>
  );
}
