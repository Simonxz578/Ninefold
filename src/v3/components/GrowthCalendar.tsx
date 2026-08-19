import { useMemo, useState } from "react";
import type { NinefoldV3State } from "../domain";
import { buildMonth } from "../domain/calendar";

export function GrowthCalendar({ state, locale }: { state: NinefoldV3State; locale: "en" | "zh-CN" }) {
  const today = new Date(); const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null); const zh = locale === "zh-CN";
  const days = useMemo(() => buildMonth(cursor.getFullYear(), cursor.getMonth() + 1), [cursor]);
  const selectedCheckIn = selected ? state.checkIns[selected] : undefined;
  const selectedSessions = selected ? state.meditation.sessions.filter((session) => session.localDate === selected) : [];
  const move = (offset: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1));
  return <section className="v3-calendar" aria-labelledby="v3-calendar-heading">
    <div className="v3-calendar__toolbar"><h2 id="v3-calendar-heading">{cursor.toLocaleDateString(zh ? "zh-CN" : "en", { year:"numeric", month:"long" })}</h2><div><button type="button" onClick={() => move(-1)} aria-label={zh ? "上个月" : "Previous month"}>‹</button><button type="button" onClick={() => setCursor(new Date(today.getFullYear(),today.getMonth(),1))}>{zh ? "今天" : "Today"}</button><button type="button" onClick={() => move(1)} aria-label={zh ? "下个月" : "Next month"}>›</button></div></div>
    <div className="v3-calendar__weekdays" aria-hidden="true">{(zh ? ["日","一","二","三","四","五","六"] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]).map(x=><span key={x}>{x}</span>)}</div>
    <div className="v3-calendar__grid">{days.map((info) => { const sessions = state.meditation.sessions.filter(s=>s.localDate===info.date).length; return <button key={info.date} type="button" className={`${info.inMonth ? "" : "is-outside"}${info.official ? ` is-${info.official}` : ""}`} onClick={() => setSelected(info.date)} aria-label={`${info.date}${sessions ? `, ${sessions} sessions` : ""}`}><strong>{info.day}</strong><small>{info.lunarLabel}</small>{info.official && <i>{info.official === "holiday" ? (zh ? "休" : "Off") : (zh ? "班" : "Work")}</i>}{sessions > 0 && <span className="v3-calendar__marker">{sessions}</span>}</button>; })}</div>
    {selected && <div className="v3-calendar__dialog" role="dialog" aria-modal="true" aria-labelledby="v3-day-title"><div><h3 id="v3-day-title">{selected}</h3>{selectedCheckIn ? <p>{zh ? `心情 ${selectedCheckIn.mood} · 能量 ${selectedCheckIn.energy}` : `Mood ${selectedCheckIn.mood} · Energy ${selectedCheckIn.energy}`}</p> : <p>{zh ? "没有签到" : "No check-in"}</p>}<p>{zh ? `${selectedSessions.length} 次呼吸练习` : `${selectedSessions.length} breathing session(s)`}</p><button type="button" onClick={() => setSelected(null)}>{zh ? "关闭" : "Close"}</button></div></div>}
  </section>;
}
