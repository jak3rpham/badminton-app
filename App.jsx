import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Users, Settings, CalendarDays, Check, Copy,
  QrCode, X, ChevronRight, UserPlus, Wallet, Pencil, Search, Lock, LockOpen
} from "lucide-react";
import { supabase, hasConfig } from "./supabase.js";
import { config } from "./config.js";

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
  const [admin, setAdmin] = useState(() => {
    if (!config.adminPin) return true; // không đặt PIN => ai cũng sửa được
    try { return localStorage.getItem("bl_admin") === "1"; } catch { return false; }
  });
  const toggleAdmin = () => {
    if (admin) { setAdmin(false); try { localStorage.removeItem("bl_admin"); } catch {} return; }
    const p = window.prompt("Nhập mã admin");
    if (p === config.adminPin) { setAdmin(true); try { localStorage.setItem("bl_admin", "1"); } catch {} }
    else if (p !== null) window.alert("Sai mã.");
  };

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
  const setPaidMethod = async (a, method) => { await supabase.from("attendees").update({ paid: true, method }).eq("id", a.id); fetchAll(); };
  const unpay = async (a) => { await supabase.from("attendees").update({ paid: false, method: null }).eq("id", a.id); fetchAll(); };
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="bl-title" style={{ flex: 1 }}><Shuttle s={24} /> Chia tiền cầu lông</div>
          {config.adminPin && (
            <button className="icon-btn" style={{ color: "#fff" }} onClick={toggleAdmin}
              title={admin ? "Đang ở chế độ admin — bấm để khoá" : "Mở khoá admin"}>
              {admin ? <LockOpen size={20} /> : <Lock size={20} />}
            </button>
          )}
        </div>
        <div className="bl-sub">{admin ? "Tick người chơi · chia đều · theo dõi ai đã chuyển" : "Bấm vào buổi chơi để thanh toán"}</div>
      </div>

      <div className="bl-wrap">
        {err && <div className="card" style={{ borderColor: "var(--unpaid)", color: "var(--unpaid)" }}>Lỗi: {err}</div>}
        {tab === "sessions" &&
          <Sessions {...{ sessions, attendees, members, addSession, updateSession, delSession, togglePaid, setPaidMethod, unpay, addMember, admin }} openQr={setQr} />}
        {tab === "roster" && admin && <Roster {...{ members, addMember, delMember }} />}
        {tab === "settings" && admin && <SettingsTab {...{ bank, saveBank }} />}
      </div>

      <div className="bl-tabs">
        <Tab id="sessions" cur={tab} set={setTab} icon={<CalendarDays size={20} />} label="Buổi chơi" />
        {admin && <Tab id="roster" cur={tab} set={setTab} icon={<Users size={20} />} label="Thành viên" />}
        {admin && <Tab id="settings" cur={tab} set={setTab} icon={<Settings size={20} />} label="Cài đặt" />}
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

function Sessions({ sessions, attendees, members, addSession, updateSession, delSession, togglePaid, setPaidMethod, unpay, addMember, admin, openQr }) {
  const [modal, setModal] = useState(null); // null | {mode:'create'} | {mode:'view', id}
  const attOf = (sid) => attendees.filter((a) => a.session_id === sid);
  const rosterNames = members.map((m) => m.name);
  const lastNames = sessions.length ? attOf(sessions[0].id).map((a) => a.name) : [];
  const openSession = modal?.mode === "view" ? sessions.find((s) => s.id === modal.id) : null;

  return (
    <>
      {admin && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setModal({ mode: "create" })}>
          <Plus size={18} /> Tạo buổi chơi mới
        </button>
      )}

      {sessions.length === 0 &&
        <div className="empty">Chưa có buổi nào.<br />Bấm “Tạo buổi chơi mới” để bắt đầu.</div>}

      {sessions.map((s) => {
        const att = attOf(s.id);
        const { total, n, per } = computeSplit(s, att);
        const paidCount = att.filter((a) => a.paid).length;
        const allPaid = n > 0 && paidCount === n;
        return (
          <div className="sess" key={s.id}>
            <div className="sess-h" onClick={() => setModal({ mode: "view", id: s.id })}>
              <div style={{ flex: 1 }}>
                <div className="sess-date">{dmY(s.date)} · {n} người</div>
                <div className="sess-meta">{fmt(total)} · {fmt(per)}/người</div>
              </div>
              <span className={`tag ${allPaid ? "done" : "pend"}`}>{allPaid ? "Đã thu đủ" : `${paidCount}/${n} đã trả`}</span>
              <ChevronRight size={18} color="#6b7a72" />
            </div>
          </div>
        );
      })}

      {modal && (
        <SessionModal
          key={openSession?.id || "create"}
          mode={modal.mode}
          session={openSession}
          att={openSession ? attOf(openSession.id) : []}
          rosterNames={rosterNames}
          prefillNames={lastNames}
          admin={admin}
          addSession={addSession} updateSession={updateSession}
          delSession={delSession} togglePaid={togglePaid}
          setPaidMethod={setPaidMethod} unpay={unpay} addMember={addMember}
          openQr={openQr}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function SessionModal({ mode, session, att, rosterNames, prefillNames, admin, addSession, updateSession, delSession, togglePaid, setPaidMethod, unpay, addMember, openQr, onClose }) {
  const isCreate = mode === "create";
  const [editing, setEditing] = useState(isCreate && admin);
  const [saving, setSaving] = useState(false);
  const [pickId, setPickId] = useState(null);
  const METHOD = { momo: "MoMo", bank: "Bank", cash: "Tiền mặt" };

  const toK = (v) => (v ? String(Math.round(v / 1000)) : "");
  const [date, setDate] = useState(session?.date || todayISO());
  const [costs, setCosts] = useState({
    san: toK(session?.cost_san), cau: toK(session?.cost_cau),
    nuoc: toK(session?.cost_nuoc), khac: toK(session?.cost_khac),
  });
  const initPicked = session ? att.map((a) => a.name) : prefillNames;
  const [picked, setPicked] = useState(initPicked);
  const [extra, setExtra] = useState(initPicked.filter((nm) => !rosterNames.includes(nm)));
  const [adding, setAdding] = useState("");
  const [search, setSearch] = useState("");

  const allNames = Array.from(new Set([...rosterNames, ...extra, ...picked]));
  const toggle = (nm) => setPicked((p) => (p.includes(nm) ? p.filter((x) => x !== nm) : [...p, nm]));
  const addNew = () => {
    const g = adding.trim(); if (!g) return;
    if (!allNames.includes(g)) setExtra((e) => [...e, g]);
    setPicked((p) => (p.includes(g) ? p : [...p, g]));
    setAdding("");
  };

  const num = (v) => (v === "" ? 0 : Number(v));
  const total = (num(costs.san) + num(costs.cau) + num(costs.nuoc) + num(costs.khac)) * 1000;
  const n = picked.length;
  const per = n ? Math.ceil(total / n / 1000) * 1000 : 0;

  const view = session ? computeSplit(session, att) : null;
  const paidCount = att.filter((a) => a.paid).length;
  const collected = view ? paidCount * view.per : 0;
  const owed = view ? (view.n - paidCount) * view.per : 0;

  const save = async () => {
    if (n === 0) { alert("Chọn ít nhất 1 người chơi."); return; }
    setSaving(true);
    const payload = {
      date,
      costs: { san: num(costs.san) * 1000, cau: num(costs.cau) * 1000, nuoc: num(costs.nuoc) * 1000, khac: num(costs.khac) * 1000 },
      names: picked,
    };
    for (const nm of picked) if (!rosterNames.includes(nm)) await addMember(nm); // lưu người mới vào thành viên
    if (isCreate) await addSession(payload);
    else await updateSession(session, payload, att);
    setSaving(false);
    onClose();
  };

  const q = noTone(search);
  const sortedNames = [...allNames].sort((a, b) => (picked.includes(b) ? 1 : 0) - (picked.includes(a) ? 1 : 0));
  const shown = sortedNames.filter((nm) => !q || noTone(nm).includes(q));
  const attShown = [...att]
    .sort((a, b) => (a.paid === b.paid ? 0 : a.paid ? 1 : -1))
    .filter((a) => !q || noTone(a.name).includes(q));
  const ci = (k) => (e) => setCosts({ ...costs, [k]: e.target.value.replace(/\D/g, "") });
  const code = (nm) => `CL ${noTone(nm)} ${(session?.date || date).slice(8)}${(session?.date || date).slice(5, 7)}`;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <CalendarDays size={20} />
          <strong style={{ flex: 1 }}>{isCreate ? "Buổi chơi mới" : editing ? "Sửa buổi chơi" : `Buổi ${dmY(session.date)}`}</strong>
          <button className="icon-btn" style={{ color: "#fff" }} onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="pane2">
            {/* TRÁI: thông tin buổi */}
            <div className="pane">
              {editing ? (
                <>
                  <div className="field"><label className="label">Ngày</label>
                    <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>

                  <div className="eyebrow" style={{ marginTop: 16 }}>Chi phí · đơn vị nghìn đồng</div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <div><label className="label">Tiền sân (nghìn)</label><input className="input num" inputMode="numeric" placeholder="vd 230" value={costs.san} onChange={ci("san")} /></div>
                    <div><label className="label">Tiền cầu (nghìn)</label><input className="input num" inputMode="numeric" placeholder="vd 55" value={costs.cau} onChange={ci("cau")} /></div>
                  </div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <div><label className="label">Nước (nghìn)</label><input className="input num" inputMode="numeric" placeholder="vd 23" value={costs.nuoc} onChange={ci("nuoc")} /></div>
                    <div><label className="label">Khác (nghìn)</label><input className="input num" inputMode="numeric" placeholder="0" value={costs.khac} onChange={ci("khac")} /></div>
                  </div>
                  <div className="hint">Gõ theo nghìn: 230 = 230.000đ.</div>

                  <div className="sumbar">
                    <div className="sumbox"><div className="k">Tổng</div><div className="v num">{fmt(total)}</div></div>
                    <div className="sumbox"><div className="k">Mỗi người ({n})</div><div className="v num" style={{ color: "var(--court)" }}>{fmt(per)}</div></div>
                  </div>

                  <div className="row" style={{ marginTop: 14 }}>
                    <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Huỷ</button>
                    <button className="btn btn-primary" onClick={save} disabled={saving}><Check size={16} /> {saving ? "Đang lưu…" : "Lưu"}</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="sumbar">
                    <div className="sumbox"><div className="k">Mỗi người</div><div className="v num">{fmt(view.per)}</div></div>
                    <div className="sumbox"><div className="k">Đã thu</div><div className="v num">{fmt(collected)}</div></div>
                    <div className="sumbox"><div className="k">Còn thiếu</div><div className="v num" style={{ color: owed ? "var(--unpaid)" : "var(--paid)" }}>{fmt(owed)}</div></div>
                  </div>
                  <div className="prog"><i style={{ width: `${view.n ? (paidCount / view.n) * 100 : 0}%` }} /></div>
                  <div className="hint">Tổng {fmt(view.total)} · {view.n} người{view.surplus > 0 ? ` · dư quỹ ${fmt(view.surplus)}` : ""}</div>

                  {admin && (
                    <div className="row" style={{ marginTop: 14 }}>
                      <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil size={16} /> Sửa</button>
                      <button className="btn btn-ghost danger" onClick={() => { if (confirm("Xoá buổi này?")) { delSession(session.id); onClose(); } }}><Trash2 size={16} /> Xoá</button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* PHẢI: người chơi */}
            <div className="pane">
              <div className="eyebrow">{editing ? `Ai có chơi? (${n})` : `Người chơi (${view.n})`}</div>

              <div className="search" style={{ marginTop: 8 }}>
                <Search size={16} />
                <input className="input" placeholder="Tìm tên…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {editing && (
                <div className="row" style={{ marginTop: 8 }}>
                  <input className="input" placeholder="Thêm người mới…" value={adding} style={{ flex: 3 }}
                    onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNew()} />
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={addNew}><UserPlus size={16} /></button>
                </div>
              )}

              <div className="players">
                {editing ? (
                  shown.length === 0
                    ? <div className="hint" style={{ padding: "10px 0" }}>Không khớp “{search}”.</div>
                    : shown.map((nm) => (
                      <div className={`chip ${picked.includes(nm) ? "on" : ""}`} key={nm} onClick={() => toggle(nm)}>
                        <span className="box">{picked.includes(nm) && <Check size={14} />}</span><span className="nm">{nm}</span>
                      </div>
                    ))
                ) : (
                  attShown.map((a) => (
                    <div className="payrow" key={a.id}>
                      <div style={{ flex: 1 }}>
                        <div className="pay-nm">{a.name}</div>
                        <div className="pay-amt num">{fmt(view.per)}</div>
                      </div>
                      <button className="icon-btn" title="QR / nội dung CK"
                        onClick={() => openQr({ name: a.name, amount: view.per, content: code(a.name), paid: a.paid, markPaid: () => { if (!a.paid) setPaidMethod(a, "momo"); } })}>
                        <QrCode size={18} />
                      </button>
                      {a.paid ? (
                        <button className="pill paid" onClick={() => unpay(a)}>
                          <Check size={14} /> Đã trả{a.method ? ` · ${METHOD[a.method] || a.method}` : ""}
                        </button>
                      ) : pickId === a.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="pill unpaid" style={{ padding: "7px 9px" }} onClick={() => { setPaidMethod(a, "momo"); setPickId(null); }}>MoMo</button>
                          <button className="pill unpaid" style={{ padding: "7px 9px" }} onClick={() => { setPaidMethod(a, "bank"); setPickId(null); }}>Bank</button>
                          <button className="pill unpaid" style={{ padding: "7px 9px" }} onClick={() => { setPaidMethod(a, "cash"); setPickId(null); }}>Tiền</button>
                        </div>
                      ) : (
                        <button className="pill unpaid" onClick={() => setPickId(a.id)}>Chưa trả</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
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
        <div className="field"><label className="label">Link nhận tiền MoMo (tuỳ chọn)</label>
          <input className="input" placeholder="https://nhantien.momo.vn/..."
            value={bank.momo_link || ""} onChange={(e) => saveBank({ momo_link: e.target.value.trim() })} />
          <div className="hint">Trong app MoMo: Yêu cầu chuyển tiền → “Link nhận tiền của tôi” → copy dán vào đây. Sẽ có nút “Mở MoMo” cho từng người.</div></div>
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
  const [done, setDone] = useState(false);
  const hasBank = bank?.bank_code && bank?.account;
  const copy = (t, tag) => { navigator.clipboard?.writeText(t); setCopied(tag); setTimeout(() => setCopied(""), 1200); };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-h"><strong>{info.name} · {fmt(info.amount)}</strong>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button></div>

        {(() => {
          const dynUrl = hasBank
            ? `https://img.vietqr.io/image/${bank.bank_code}-${bank.account}-compact2.png?amount=${info.amount}&addInfo=${encodeURIComponent(info.content)}&accountName=${encodeURIComponent(bank.holder || "")}`
            : null;
          const src = config.qrImage || dynUrl;
          return src && imgOk ? (
            <img className="qrimg" src={src} alt="QR chuyển khoản" onError={() => setImgOk(false)} />
          ) : (
            <div className="qrimg" style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16, color: "var(--muted)", fontSize: 12.5 }}>
              {config.qrImage
                ? <span>Chưa có ảnh QR.<br />Đặt file vào <b>public{config.qrImage}</b></span>
                : <span>Chưa có QR — thêm ảnh vào <b>public/</b> (sửa <b>src/config.js</b>) hoặc nhập STK ở tab Cài đặt.</span>}
            </div>
          );
        })()}
        <div className="hint" style={{ textAlign: "center" }}>{config.qrNote}</div>

        {(config.momoLink || bank?.momo_link) && (
          <a className="btn btn-primary btn-block" style={{ marginTop: 8, textDecoration: "none" }}
            href={config.momoLink || bank.momo_link} target="_blank" rel="noreferrer">
            Mở MoMo để trả {fmt(info.amount)}
          </a>
        )}

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

        <div style={{ marginTop: 14 }}>
          {info.paid || done ? (
            <div className="btn btn-ghost btn-block" style={{ color: "var(--paid)" }}><Check size={16} /> Đã đánh dấu đã trả</div>
          ) : (
            <button className="btn btn-primary btn-block"
              onClick={() => { info.markPaid?.(); setDone(true); }}>
              <Check size={16} /> Mình đã chuyển xong — đánh dấu đã trả
            </button>
          )}
          <div className="hint">App không tự biết bạn đã chuyển hay chưa — bạn tự xác nhận, hoặc host chỉnh lại trong danh sách.</div>
        </div>
      </div>
    </div>
  );
}
