import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const SKILLS = ["Кодування", "Електроніка", "3D Моделювання", "3D Друк", "Паяння"];

const GRP = {
  A: { label: "Інженер",   tag: "Просунутий",     color: "#16a34a", light: "#f0fdf4", border: "#bbf7d0", dim: "#15803d" },
  B: { label: "Майстер",   tag: "Середній рівень", color: "#2563eb", light: "#eff6ff", border: "#bfdbfe", dim: "#1d4ed8" },
  C: { label: "Дослідник", tag: "Початківець",     color: "#d97706", light: "#fffbeb", border: "#fde68a", dim: "#b45309" },
};

function Bars({ scores, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {SKILLS.map((s, i) => (
        <div key={s}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>
            <span>{s}</span><span>{scores[i]}/4</span>
          </div>
          <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${(scores[i] / 4) * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentCard({ student, onClick }) {
  const g = GRP[student.group];
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: "#fff", borderRadius: 12, padding: "18px 16px", cursor: "pointer", border: hov ? `1.5px solid ${g.color}` : "1px solid #e5e7eb", boxShadow: hov ? `0 0 0 3px ${g.color}18` : "none", transition: "all .15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 2, fontFamily: "monospace" }}>{student.name}</div>
          {student.manual && <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>↑ Переведено вручну</div>}
        </div>
        <div style={{ background: g.light, border: `1px solid ${g.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: g.dim, whiteSpace: "nowrap" }}>
          {student.group} · {g.label}
        </div>
      </div>
      <Bars scores={student.scores} color={g.color} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Real-time listener — updates automatically when new students complete quiz
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const shown = filter === "all" ? students : students.filter(s => s.group === filter);
  const cnt = g => students.filter(s => s.group === g).length;

  // Quiz link to share with students
  const quizLink = window.location.origin + "/";

  function copyLink() {
    navigator.clipboard.writeText(quizLink);
    alert("Посилання скопійовано! Надішліть його учням.");
  }

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, color: "#111827", letterSpacing: 1 }}>ROBOTRACK</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Панель вчителя · Робототехніка · 9 клас</div>
        </div>
        <button onClick={copyLink}
          style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          📋 Скопіювати посилання для учнів
        </button>
      </div>

      {/* Group filter tabs */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", display: "flex" }}>
        {[
          ["all", "Всі учні",     students.length],
          ["A",   "Інженер (A)",  cnt("A")],
          ["B",   "Майстер (B)",  cnt("B")],
          ["C",   "Дослідник (C)", cnt("C")],
        ].map(([key, label, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ flex: 1, padding: "11px 8px", background: "transparent", border: "none", borderBottom: filter === key ? "2px solid #111827" : "2px solid transparent", color: filter === key ? "#111827" : "#9ca3af", fontWeight: filter === key ? 700 : 500, fontSize: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all .15s" }}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: filter === key ? "#111827" : "#d1d5db" }}>{count}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Group legend cards */}
      <div style={{ margin: "20px 24px 0", display: "flex", gap: 10 }}>
        {["A", "B", "C"].map(k => {
          const g = GRP[k];
          return (
            <div key={k} style={{ flex: 1, background: "#fff", border: `1px solid ${g.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 22, color: g.color }}>Група {k}</div>
                <div style={{ background: g.light, color: g.dim, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>{g.tag.toUpperCase()}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{g.label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {k === "C" && "Scratch · Breadboard · Tinkercad · G-code · Лудіння"}
                {k === "B" && "Arduino C++ · Мультиметр · Fusion 360 · Слайсер · DIP-монтаж"}
                {k === "A" && "Бібліотеки · Драйвери · Збірки · Технічні пластики · Власні PCB"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Student grid */}
      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {loading && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#d1d5db", fontSize: 14 }}>
            Завантаження...
          </div>
        )}
        {!loading && shown.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#d1d5db", fontSize: 14 }}>
            {filter === "all" ? "Учні ще не проходили діагностику. Надішліть їм посилання." : "У цій групі поки немає учнів."}
          </div>
        )}
        {shown.map(s => (
          <StudentCard key={s.id} student={s} onClick={() => navigate(`/student/${s.id}`)} />
        ))}
      </div>
    </div>
  );
}