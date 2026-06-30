import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Users, Settings, CalendarDays, Check, Copy,
  QrCode, X, ChevronDown, ChevronRight, UserPlus, Wallet, Pencil
} from "lucide-react";
import { supabase, hasConfig } from "./supabase.js";

/* ───────────── helpers ───────────── */

const BANKS = [
  { code: "970436", name: "Vietcombank" }, { code: "970415", name: "VietinBank" },
  { code: "970418", name: "BIDV" }, { code: "970407", name: "Techcombank" },
  { code: "970422", name: "MB Bank" }, { code: "970416", name: "ACB" },
  { code: "970432", name: "VPBank" }, { code: "970423", name: "TPBank" },
  { code: "970403", name: "Sacombank" }, { code: "970405", name: "Agribank" },
  { code: "970441", name: "VIB" }, { code: "970437", name: "HDBank" },
  { code: "970448", name: "OCB" }, { code: "970426", name: "MSB" },
  { code: "970443", name: "SHB" }, { code: "970431", name: "Eximbank" },
];

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + "đ";
const todayISO = () => new Date().toISOString().slice(0, 10);
const dmY = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const noTone = (s) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "").trim();

function computeSplit(s, attendees) {
  const total = (s.cost_san || 0) + (s.cost_cau || 0) + (s.cost_nuoc || 0) + (s.cost_khac || 0);
  const n = attendees.length;
  const per = n ? Math.ceil(total / n / 1000) * 1000 : 0;
  const surplus = per * n - total;
  return { total, n, per, surplus };
}

const Shuttle = ({ s = 22, c = "#fff" }) => (
  <svg className="feather" width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 22c-1.3 0-2.4-1-2.4-2.3l-.3-3.2 5.4 0-.3 3.2C14.1 21 13.3 22 12 22Z" fill={c} opacity=".95" />
    <path d="M9 16 4 7M12 16 11 5M15 16l5-9" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
    <circle cx="12" cy="19" r="1.4" fill={c} />
  </svg>
);

/* ───────────── app ───────────── */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("sessions");
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [bank, setBank] = useState({});
  const [qr, setQr] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    const [m, s, a, st] = await Promise.all([
      supabase.from("members").select("*").order("name"),
      supabase.from("sessions").select("*").order("date", { ascending: false }),
      supabase.from("attendees").select("*"),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (m.error || s.error || a.error) {
      setErr((m.error || s.error || a.error).message);
    } else {
      setMembers(m.data || []); setSessions(s.data || []); setAttendees(a.data || []);
      setBank(st.data || {});
      setErr("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!hasConfig) { setLoading(false); return; }
    fetchAll();
    const ch = supabase.channel("badminton")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendees" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchAll]);

  /* ---- mutations ---- */
  const addMember = async (name) => { await supabase.from("members").insert({ name }); fetchAll(); };
  const delMember = async (id) => { await supabase.from("members").delete().eq("id", id); fetchAll(); };

  const addSession = async ({ date, costs, names }) => {
    const { data, error } = await supabase.from("sessions")
      .insert({ date, cost_san: costs.san, cost_cau: costs.cau, cost_nuoc: costs.nuoc, cost_khac: costs.khac })
      .select().single();
    if (error) return;
    if (names.length)
      await supabase.from("attendees").insert(names.map((nm) => ({ session_id: data.id, name: nm, paid: false })));
    fetchAll();
    return data.id;
  };

  const updateSession = async (s, { date, costs, names }, existing) => {
    await supabase.from("sessions").update({
      date, cost_san: costs.san, cost_cau: costs.cau, cost_nuoc: costs.nuoc, cost_khac: costs.khac
    }).eq("id", s.id);
    const had = existing.map((a) => a.name);
    const toRemove = existing.filter((a) => !names.includes(a.name));
    const toAdd = names.filter((nm) => !had.includes(nm));
    if (toRemove.length) await supabase.from("attendees").delete().in("id", toRemove.map((a) => a.id));
    if (toAdd.length) await supabase.from("attendees").insert(toAdd.map((nm) => ({ session_id: s.id, name: nm, paid: false })));
    fetchAll();
  };

  const delSession = async (id) => { await supabase.from("sessions").delete().eq("id", id); fetchAll(); };
  const togglePaid = async (a) => { await supabase.from("attendees").update({ paid: !a.paid }).eq("id", a.id); fetchAll(); };
  const saveBank = async (patch) => {
    const next = { ...bank, ...patch, id: 1 };
    setBank(next);
    await supabase.from("settings").upsert(next);
  };

  /* ---- gates ---- */
  if (!hasConfig)
    return (
      <div className="bl-root"><div className="center">
        <div>
          <Shuttle s={40} c="#1f7a52" />
          <h3>Chưa cấu hình Supabase</h3>
          <p className="hint">Tạo file <b>.env</b> với <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> rồi chạy lại. Xem README.</p>
        </div>
      </div></div>
    );

  if (loading)
    return <div className="bl-root"><div className="center"><div className="spin" /></div></div>;

  return (
    <div className="bl-root">
      <div className="bl-head">
        <div className="bl-title"><Shuttle s={24} /> Chia tiền cầu lông</div>
        <div className="bl-sub">Tick người chơi · chia đều · theo dõi ai đã chuyển</div>
      </div>

      <div className="bl-wrap">
        {err && <div className="card" style={{ borderColor: "var(--unpaid)", color: "var(--unpaid)" }}>Lỗi: {err}</div>}
        {tab === "sessions" &&
          <Sessions {...{ sessions, attendees, members, addSession, updateSession, delSession, togglePaid, bank }} openQr={setQr} />}
        {tab === "roster" && <Roster {...{ members, addMember, delMember }} />}
        {tab === "settings" && <SettingsTab {...{ bank, saveBank }} />}
      </div>

      <div className="bl-tabs">
        <Tab id="sessions" cur={tab} set={setTab} icon={<CalendarDays size={20} />} label="Buổi chơi" />
        <Tab id="roster" cur={tab} set={setTab} icon={<Users size={20} />} label="Thành viên" />
        <Tab id="settings" cur={tab} set={setTab} icon={<Settings size={20} />} label="Cài đặt" />
      </div>

      {qr && <QrSheet info={qr} bank={bank} onClose={() => setQr(null)} />}
    </div>
  );
}

function Tab({ id, cur, set, icon, label }) {
  const on = cur === id;
  return (
    <button className={`bl-tab ${on ? "on" : ""}`} onClick={() => set(id)}>
      <span className="dot" />{icon}<span>{label}</span>
    </button>
  );
}

/* ───────────── sessions ───────────── */

function Sessions({ sessions, attendees, members, addSession, updateSession, delSession, togglePaid, openQr }) {
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(null);
  const attOf = (sid) => attendees.filter((a) => a.session_id === sid);

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setCreating(true)}>
        <Plus size={18} /> Tạo buổi chơi mới
      </button>

      {sessions.length === 0 && !creating &&
        <div className="empty">Chưa có buổi nào.<br />Bấm “Tạo buổi chơi mới” để bắt đầu.</div>}

      {creating &&
        <SessionForm roster={members.map((m) => m.name)}
          onSave={async (d) => { const id = await addSession(d); setCreating(false); setOpen(id); }}
          onCancel={() => setCreating(false)} />}

      {sessions.map((s) => (
        <SessionCard key={s.id} s={s} att={attOf(s.id)} rosterNames={members.map((m) => m.name)}
          open={open === s.id} toggle={() => setOpen(open === s.id ? null : s.id)}
          onUpdate={updateSession} onDelete={delSession} togglePaid={togglePaid} openQr={openQr} />
      ))}
    </>
  );
}

function SessionCard({ s, att, rosterNames, open, toggle, onUpdate, onDelete, togglePaid, openQr }) {
  const [editing, setEditing] = useState(false);
  const { total, n, per, surplus } = computeSplit(s, att);
  const paidCount = att.filter((a) => a.paid).length;
  const allPaid = n > 0 && paidCount === n;
  const collected = paidCount * per;
  const owed = (n - paidCount) * per;

  if (editing)
    return (
      <SessionForm roster={rosterNames} initial={s} initialAtt={att}
        onSave={async (d) => { await onUpdate(s, d, att); setEditing(false); }}
        onCancel={() => setEditing(false)} />
    );

  return (
    <div className="sess">
      <div className="sess-h" onClick={toggle}>
        {open ? <ChevronDown size={18} color="#6b7a72" /> : <ChevronRight size={18} color="#6b7a72" />}
        <div style={{ flex: 1 }}>
          <div className="sess-date">{dmY(s.date)} · {n} người</div>
          <div className="sess-meta">{fmt(total)} · {fmt(per)}/người</div>
        </div>
        <span className={`tag ${allPaid ? "done" : "pend"}`}>{allPaid ? "Đã thu đủ" : `${paidCount}/${n} đã trả`}</span>
      </div>

      {open && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="sumbar">
            <div className="sumbox"><div className="k">Mỗi người</div><div className="v num">{fmt(per)}</div></div>
            <div className="sumbox"><div className="k">Đã thu</div><div className="v num">{fmt(collected)}</div></div>
            <div className="sumbox"><div className="k">Còn thiếu</div><div className="v num" style={{ color: owed ? "var(--unpaid)" : "var(--paid)" }}>{fmt(owed)}</div></div>
          </div>
          <div className="prog"><i style={{ width: `${n ? (paidCount / n) * 100 : 0}%` }} /></div>
          {surplus > 0 && <div className="hint">Làm tròn lên 1.000đ → dư quỹ {fmt(surplus)}.</div>}

          <div style={{ marginTop: 12 }}>
            {att.map((a) => (
              <div className="payrow" key={a.id}>
                <div style={{ flex: 1 }}>
                  <div className="pay-nm">{a.name}</div>
                  <div className="pay-amt num">{fmt(per)}</div>
                </div>
                <button className="icon-btn" title="QR / nội dung CK"
                  onClick={() => openQr({ name: a.name, amount: per, content: `CL ${noTone(a.name)} ${s.date.slice(8)}${s.date.slice(5, 7)}` })}>
                  <QrCode size={18} />
                </button>
                <button className={`pill ${a.paid ? "paid" : "unpaid"}`} onClick={() => togglePaid(a)}>
                  {a.paid ? <><Check size={14} /> Đã trả</> : "Chưa trả"}
                </button>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={16} /> Sửa</button>
            <button className="btn btn-ghost danger" onClick={() => { if (confirm("Xoá buổi này?")) onDelete(s.id); }}>
              <Trash2 size={16} /> Xoá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionForm({ roster, initial, initialAtt, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(initial?.date || todayISO());
  const [costs, setCosts] = useState({
    san: initial?.cost_san ?? "", cau: initial?.cost_cau ?? "",
    nuoc: initial?.cost_nuoc ?? "", khac: initial?.cost_khac ?? "",
  });
  const initNames = initialAtt ? initialAtt.map((a) => a.name) : [];
  const [picked, setPicked] = useState(initNames);
  const [extra, setExtra] = useState(initNames.filter((nm) => !roster.includes(nm)));
  const [guest, setGuest] = useState("");

  const allNames = Array.from(new Set([...roster, ...extra]));
  const toggle = (nm) => setPicked((p) => (p.includes(nm) ? p.filter((x) => x !== nm) : [...p, nm]));
  const addGuest = () => {
    const g = guest.trim(); if (!g) return;
    if (!allNames.includes(g)) { setExtra((e) => [...e, g]); setPicked((p) => [...p, g]); }
    setGuest("");
  };

  const num = (v) => (v === "" ? 0 : Number(v));
  const total = num(costs.san) + num(costs.cau) + num(costs.nuoc) + num(costs.khac);
  const n = picked.length;
  const per = n ? Math.ceil(total / n / 1000) * 1000 : 0;

  const save = async () => {
    if (n === 0) { alert("Chọn ít nhất 1 người chơi."); return; }
    setSaving(true);
    await onSave({ date, costs: { san: num(costs.san), cau: num(costs.cau), nuoc: num(costs.nuoc), khac: num(costs.khac) }, names: picked });
    setSaving(false);
  };

  const ci = (k) => (e) => setCosts({ ...costs, [k]: e.target.value.replace(/\D/g, "") });

  return (
    <div className="card" style={{ borderColor: "var(--court)" }}>
      <div className="card-h"><CalendarDays size={18} color="#1f7a52" /> {initial ? "Sửa buổi chơi" : "Buổi chơi mới"}</div>

      <div className="field"><label className="label">Ngày</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>

      <div className="eyebrow" style={{ marginTop: 16 }}>Chi phí buổi này</div>
      <div className="row" style={{ marginTop: 8 }}>
        <div><label className="label">Tiền sân</label><input className="input num" inputMode="numeric" placeholder="0" value={costs.san} onChange={ci("san")} /></div>
        <div><label className="label">Tiền cầu</label><input className="input num" inputMode="numeric" placeholder="0" value={costs.cau} onChange={ci("cau")} /></div>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <div><label className="label">Nước</label><input className="input num" inputMode="numeric" placeholder="0" value={costs.nuoc} onChange={ci("nuoc")} /></div>
        <div><label className="label">Khác</label><input className="input num" inputMode="numeric" placeholder="0" value={costs.khac} onChange={ci("khac")} /></div>
      </div>

      <div className="eyebrow" style={{ marginTop: 16 }}>Ai có chơi? ({n})</div>
      {allNames.length === 0 && <div className="hint">Chưa có thành viên — thêm ở tab “Thành viên”, hoặc thêm khách bên dưới.</div>}
      {allNames.map((nm) => (
        <div className={`chip ${picked.includes(nm) ? "on" : ""}`} key={nm} onClick={() => toggle(nm)}>
          <span className="box">{picked.includes(nm) && <Check size={14} />}</span><span className="nm">{nm}</span>
        </div>
      ))}

      <div className="row" style={{ marginTop: 10 }}>
        <input className="input" placeholder="Thêm khách lẻ…" value={guest} style={{ flex: 3 }}
          onChange={(e) => setGuest(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGuest()} />
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={addGuest}><UserPlus size={16} /></button>
      </div>

      {n > 0 && (
        <div className="sumbar">
          <div className="sumbox"><div className="k">Tổng</div><div className="v num">{fmt(total)}</div></div>
          <div className="sumbox"><div className="k">Mỗi người</div><div className="v num" style={{ color: "var(--court)" }}>{fmt(per)}</div></div>
        </div>
      )}

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>Huỷ</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}><Check size={16} /> {saving ? "Đang lưu…" : "Lưu"}</button>
      </div>
    </div>
  );
}

/* ───────────── roster ───────────── */

function Roster({ members, addMember, delMember }) {
  const [name, setName] = useState("");
  const add = () => {
    const nm = name.trim(); if (!nm) return;
    if (members.some((m) => m.name.toLowerCase() === nm.toLowerCase())) { setName(""); return; }
    addMember(nm); setName("");
  };
  return (
    <div className="card">
      <div className="card-h"><Users size={18} color="#1f7a52" /> Thành viên nhóm</div>
      <div className="hint">Danh sách cố định để mỗi buổi chỉ cần tick. Khách lẻ thêm trực tiếp trong buổi chơi.</div>
      <div className="row" style={{ marginTop: 12 }}>
        <input className="input" placeholder="Tên thành viên…" value={name} style={{ flex: 3 }}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={add}><Plus size={18} /></button>
      </div>
      {members.length === 0 && <div className="empty">Chưa có thành viên nào.</div>}
      {members.map((m) => (
        <div className="payrow" key={m.id}>
          <span className="pay-nm" style={{ flex: 1 }}>{m.name}</span>
          <button className="icon-btn danger" onClick={() => { if (confirm(`Xoá ${m.name}?`)) delMember(m.id); }}><Trash2 size={18} /></button>
        </div>
      ))}
    </div>
  );
}

/* ───────────── settings ───────────── */

function SettingsTab({ bank, saveBank }) {
  return (
    <>
      <div className="card">
        <div className="card-h"><Wallet size={18} color="#1f7a52" /> Tài khoản nhận tiền</div>
        <div className="hint">Dùng để tạo mã QR chuyển khoản cho từng người.</div>
        <div className="field"><label className="label">Ngân hàng</label>
          <select value={bank.bank_code || ""} onChange={(e) => saveBank({ bank_code: e.target.value })}>
            <option value="">— Chọn ngân hàng —</option>
            {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select></div>
        <div className="field"><label className="label">Số tài khoản</label>
          <input className="input num" inputMode="numeric" placeholder="VD: 0123456789"
            value={bank.account || ""} onChange={(e) => saveBank({ account: e.target.value.replace(/\D/g, "") })} /></div>
        <div className="field"><label className="label">Tên chủ tài khoản</label>
          <input className="input" placeholder="VD: NGUYEN VAN A"
            value={bank.holder || ""} onChange={(e) => saveBank({ holder: e.target.value })} /></div>
        <div className="field"><label className="label">Số MoMo (tuỳ chọn)</label>
          <input className="input num" inputMode="numeric" placeholder="Cho ai muốn trả qua MoMo"
            value={bank.momo || ""} onChange={(e) => saveBank({ momo: e.target.value.replace(/\D/g, "") })} /></div>
      </div>
      <div className="card">
        <div className="card-h">Dữ liệu nhóm</div>
        <div className="hint">Dữ liệu lưu chung trên Supabase — mọi người mở app đều thấy và tick được, cập nhật realtime.</div>
      </div>
    </>
  );
}

/* ───────────── QR sheet ───────────── */

function QrSheet({ info, bank, onClose }) {
  const [copied, setCopied] = useState("");
  const [imgOk, setImgOk] = useState(true);
  const hasBank = bank?.bank_code && bank?.account;
  const qrUrl = hasBank
    ? `https://img.vietqr.io/image/${bank.bank_code}-${bank.account}-compact2.png?amount=${info.amount}&addInfo=${encodeURIComponent(info.content)}&accountName=${encodeURIComponent(bank.holder || "")}`
    : null;
  const copy = (t, tag) => { navigator.clipboard?.writeText(t); setCopied(tag); setTimeout(() => setCopied(""), 1200); };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-h"><strong>{info.name} · {fmt(info.amount)}</strong>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button></div>

        {hasBank && imgOk
          ? <img className="qrimg" src={qrUrl} alt="QR chuyển khoản" onError={() => setImgOk(false)} />
          : <div className="hint" style={{ textAlign: "center", padding: "10px 0" }}>
              {hasBank ? "Không tải được ảnh QR — dùng thông tin bên dưới." : "Chưa cài tài khoản nhận tiền (tab Cài đặt)."}
            </div>}

        {hasBank && (
          <div className="copybox">
            <span className="t">{BANKS.find((x) => x.code === bank.bank_code)?.name} · {bank.account}</span>
            <button className="icon-btn" onClick={() => copy(bank.account, "stk")}>
              {copied === "stk" ? <Check size={16} color="#1f7a52" /> : <Copy size={16} />}</button>
          </div>
        )}
        {bank?.momo && (
          <div className="copybox"><span className="t">MoMo: {bank.momo}</span>
            <button className="icon-btn" onClick={() => copy(bank.momo, "momo")}>
              {copied === "momo" ? <Check size={16} color="#1f7a52" /> : <Copy size={16} />}</button></div>
        )}
        <div className="copybox"><span className="t">{info.content}</span>
          <button className="icon-btn" onClick={() => copy(info.content, "nd")}>
            {copied === "nd" ? <Check size={16} color="#1f7a52" /> : <Copy size={16} />}</button></div>
        <div className="hint">Nội dung chuyển khoản — copy gửi vô nhóm để host dễ đối chiếu.</div>
      </div>
    </div>
  );
}
