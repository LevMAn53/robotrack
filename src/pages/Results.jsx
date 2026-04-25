import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const SKILLS = ["Кодування", "Електроніка", "3D Моделювання", "3D Друк", "Паяння"];
const SKILL_ICONS = ["{ }", "∿", "◈", "⬡", "⌇"];

const GRP = {
  A: { label: "Інженер",   tag: "Просунутий",      color: "#16a34a", light: "#f0fdf4", border: "#bbf7d0", dim: "#15803d" },
  B: { label: "Майстер",   tag: "Середній рівень",  color: "#2563eb", light: "#eff6ff", border: "#bfdbfe", dim: "#1d4ed8" },
  C: { label: "Дослідник", tag: "Початківець",      color: "#d97706", light: "#fffbeb", border: "#fde68a", dim: "#b45309" },
};

const GROUP_EVAL = {
  C: {
    text: "Ти тільки починаєш знайомитися з робототехнікою. Головна мета на цей рік — навчитися безпечно користуватися інструментами, відтворювати готові рішення за інструкцією та сформувати базове розуміння всіх п'яти напрямків.",
    focus: "Практична робота за зразком, розвиток технічної грамотності.",
  },
  B: {
    text: "Ти розумієш логіку більшості процесів та можеш модифікувати існуючі проєкти під свої потреби. Цього року фокус на поглибленні розуміння та з'єднанні різних навичок в одному проєкті.",
    focus: "Самостійна робота над проєктами, поєднання електроніки з кодуванням та механікою.",
  },
  A: {
    text: "Ти готовий створювати власні продукти від ідеї до прототипу. Ключова задача на цей рік — реалізувати комплексний проєкт, що поєднує всі напрямки: власна плата, CAD-деталі, код та механіка.",
    focus: "Комплексний проєктний підхід, BOM, реверс-інжиніринг, самостійне усунення несправностей.",
  },
};

const SKILL_EVAL = {
  0: {
    C: { canDo: ["Завантажує та запускає готові скетчі", "Змінює прості параметри (час, піни)"], workOn: ["Навчитися писати умови if-else самостійно", "Зрозуміти структуру void setup() і void loop()"] },
    B: { canDo: ["Пише базовий код на Arduino: змінні, цикли, умови", "Зчитує дані з сенсора та виводить у Serial Monitor"], workOn: ["Опанувати функції та масиви", "Навчитися підключати бібліотеки"] },
    A: { canDo: ["Пише структурований код з функціями та бібліотеками", "Реалізує складну логіку керування роботом"], workOn: ["Ускладнювати проєкти — розумна теплиця, робот-пилосос"] },
  },
  1: {
    C: { canDo: ["Збирає прості схеми на Breadboard", "Розуміє полярність та читає прості схеми"], workOn: ["Вивчити закон Ома та розраховувати резистор для LED", "Зрозуміти потенціометр та подільник напруги"] },
    B: { canDo: ["Вимірює напругу мультиметром", "Розраховує резистор, розуміє транзистор як ключ"], workOn: ["Підключити та запрограмувати драйвер двигуна", "Освоїти складніші датчики: ультразвуковий, I2C"] },
    A: { canDo: ["Складає схеми живлення для автономних роботів", "Підключає драйвери двигунів і складні датчики"], workOn: ["Практикувати читання даташитів та вибір компонентів"] },
  },
  2: {
    C: { canDo: ["Працює з Tinkercad: примітиви, групування, вирізи", "Створює прості деталі за заданими розмірами"], workOn: ["Навчитися проєктувати деталі з допусками (0.2–0.4 мм)", "Перейти до Onshape або Fusion 360"] },
    B: { canDo: ["Проєктує деталі з допусками в Fusion 360", "Самостійно готує STL до друку"], workOn: ["Освоїти складніші механізми (зубчасті передачі)", "Навчитися реверс-інжинірингу"] },
    A: { canDo: ["Проєктує функціональні механізми та збірки", "Виконує реверс-інжиніринг за замірами"], workOn: ["Практикувати повний цикл: ідея → CAD → друк → тест"] },
  },
  3: {
    C: { canDo: ["Калібрує стіл і завантажує філамент", "Запускає готовий G-code"], workOn: ["Навчитися налаштовувати слайсер самостійно", "Зрозуміти різницю між PLA та PETG"] },
    B: { canDo: ["Самостійно готує STL у слайсері", "Знає різницю між типами пластику"], workOn: ["Навчитися визначати та усувати дефекти друку", "Освоїти друк технічними пластиками"] },
    A: { canDo: ["Визначає причини браку та усуває їх", "Друкує складні деталі з підтримками"], workOn: ["Пробувати технічні пластики та вдосконалювати якість"] },
  },
  4: {
    C: { canDo: ["Безпечно користується паяльником", "Лудить дроти та виконує з'єднання"], workOn: ["Навчитися паяти компоненти на платі", "Освоїти візуальну перевірку якості з'єднань"] },
    B: { canDo: ["Виконує DIP-монтаж на друковану плату", "Виправляє «соплі» олово-відсмоктувачем"], workOn: ["Навчитися паяти модулі без перегріву", "Освоїти прозвонку схеми мультиметром"] },
    A: { canDo: ["Паяє складні модулі без перегріву", "Може спроєктувати топологію з'єднань"], workOn: ["Практикувати складніший монтаж і швидкість"] },
  },
};

const LESSON_PLANS = {
  C: [
    { skill: "Кодування",      icon: "{ }", topics: ["Структура void setup() та void loop()", "Команди digitalWrite та delay", "Завантаження готових скетчів, зміна параметрів"] },
    { skill: "Електроніка",    icon: "∿",   topics: ["Резистор, світлодіод, кнопка — компоненти та схеми", "Робота з Breadboard, розуміння полярності"] },
    { skill: "3D Моделювання", icon: "◈",   topics: ["Tinkercad: примітиви, групування, вирізи", "Проєктування корпусу-коробки або брелка"] },
    { skill: "3D Друк",        icon: "⬡",   topics: ["Калібрування столу, завантаження філаменту", "Запуск G-code, чищення сопла"] },
    { skill: "Паяння",         icon: "⌇",   topics: ["Лудіння дротів та з'єднання дріт-дріт", "Безпека при роботі з паяльником"] },
  ],
  B: [
    { skill: "Кодування",      icon: "{ }", topics: ["Змінні, цикли for, умови if-else", "Читання сенсорів через analogRead, Serial Monitor"] },
    { skill: "Електроніка",    icon: "∿",   topics: ["Транзистор як ключ, потенціометр, закон Ома", "Вимірювання напруги мультиметром"] },
    { skill: "3D Моделювання", icon: "◈",   topics: ["Параметричне моделювання в Onshape / Fusion 360", "Допуски 0.2–0.4 мм, рухомі з'єднання"] },
    { skill: "3D Друк",        icon: "⬡",   topics: ["Слайсер: стінки, заповнення, підтримки", "PLA vs PETG, орієнтація деталі"] },
    { skill: "Паяння",         icon: "⌇",   topics: ["DIP-монтаж на PCB, типи роз'ємів", "Виправлення \"соплів\" олово-відсмоктувачем"] },
  ],
  A: [
    { skill: "Кодування",      icon: "{ }", topics: ["Функції, масиви, бібліотеки", "Складна логіка: кілька режимів, реакція на події"] },
    { skill: "Електроніка",    icon: "∿",   topics: ["Драйвери двигунів, реле, I2C дисплеї", "Схеми живлення для автономних роботів, BOM"] },
    { skill: "3D Моделювання", icon: "◈",   topics: ["Складні збірки: зубчасті передачі, кріплення сервоприводів", "Реверс-інжиніринг за замірами реального об'єкта"] },
    { skill: "3D Друк",        icon: "⬡",   topics: ["Визначення та усунення дефектів (воблінг, недоекструзія)", "Технічні пластики, пост-обробка"] },
    { skill: "Паяння",         icon: "⌇",   topics: ["Паяння модулів без перегріву (Bluetooth, драйвери)", "Власна топологія з'єднань, навісний монтаж"] },
  ],
};

function getSkillLevel(score) {
  if (score >= 4) return "A";
  if (score >= 2) return "B";
  return "C";
}

function Bars({ scores, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {SKILLS.map((s, i) => (
        <div key={s}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>
            <span>{s}</span><span>{scores[i]}/4</span>
          </div>
          <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${(scores[i] / 4) * 100}%`, height: "100%", background: color, borderRadius: 2, transition: "width .4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [openModule, setOpenModule] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "students", id)).then(snap => {
      if (snap.exists()) setStudent({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#6b7280" }}>
      Завантаження...
    </div>
  );

  if (!student) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#6b7280" }}>
      Результати не знайдено.
    </div>
  );

  const g = GRP[student.group];
  const ge = GROUP_EVAL[student.group];
  const skillLevels = student.scores.map(s => getSkillLevel(s));
  const plan = LESSON_PLANS[student.group];

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 8px", background: "transparent", border: "none", borderBottom: tab === id ? `2px solid ${g.color}` : "2px solid transparent", color: tab === id ? g.dim : "#9ca3af", fontWeight: tab === id ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif", padding: "32px 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Result card */}
        <div style={{ background: g.light, border: `1.5px solid ${g.border}`, borderRadius: 14, padding: 24, marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: g.dim, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>✓ Діагностику завершено</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{student.name} визначено до</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: g.color, lineHeight: 1, fontFamily: "monospace" }}>Група {student.group}</div>
          <div style={{ fontSize: 16, color: g.dim, fontWeight: 700, marginBottom: 16 }}>{g.label} · {g.tag}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "6px 16px", fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>Загальний бал:</span>
            <span style={{ fontWeight: 800, fontFamily: "monospace", color: g.color }}>{student.total}</span>
            <span style={{ color: "#d1d5db" }}>/20</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          <Tab id="overview" label="Загальна оцінка" />
          <Tab id="skills"   label="По навичках" />
          <Tab id="plan"     label="План навчання" />
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Загальна характеристика</div>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, marginBottom: 12 }}>{ge.text}</div>
              <div style={{ background: g.light, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: g.dim }}>
                <b>Фокус на рік:</b> {ge.focus}
              </div>
            </div>
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Результати по навичках</div>
              <Bars scores={student.scores} color={g.color} />
            </div>
          </div>
        )}

        {/* SKILLS */}
        {tab === "skills" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SKILLS.map((skill, i) => {
              const level = skillLevels[i];
              const lg = GRP[level];
              const ev = SKILL_EVAL[i][level];
              return (
                <div key={skill} style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: lg.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: lg.dim, fontFamily: "monospace", fontWeight: 700 }}>{SKILL_ICONS[i]}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{skill}</div>
                        <div style={{ fontSize: 11, color: lg.dim, fontWeight: 600 }}>{lg.label} · {student.scores[i]}/4</div>
                      </div>
                    </div>
                    <div style={{ background: lg.light, border: `1px solid ${lg.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: lg.dim }}>
                      Рівень {level}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✓ Вже вміє</div>
                      {ev.canDo.map((t, ti) => (
                        <div key={ti} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                          <span style={{ color: "#16a34a", fontSize: 10, marginTop: 2 }}>▸</span>
                          <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#fff7ed", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>→ Працювати над</div>
                      {ev.workOn.map((t, ti) => (
                        <div key={ti} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                          <span style={{ color: "#f97316", fontSize: 10, marginTop: 2 }}>▸</span>
                          <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PLAN */}
        {tab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>
                Це твій індивідуальний план навчання на рік, складений на основі результатів діагностики. Натисни на кожен розділ, щоб побачити теми.
              </div>
            </div>
            {plan.map((mod, idx) => {
              const isOpen = openModule === idx;
              return (
                <div key={idx} style={{ border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                  <button onClick={() => setOpenModule(isOpen ? null : idx)}
                    style={{ width: "100%", padding: "14px 16px", background: isOpen ? "#f9fafb" : "#fff", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: g.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: g.dim, fontFamily: "monospace", fontWeight: 700 }}>{mod.icon}</div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#111827", fontFamily: "monospace" }}>{mod.skill}</span>
                    </div>
                    <span style={{ color: "#d1d5db", fontSize: 11 }}>{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", background: "#f9fafb", borderTop: "0.5px solid #f3f4f6" }}>
                      <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                        {mod.topics.map((topic, ti) => (
                          <div key={ti} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ color: g.color, fontSize: 11, marginTop: 2 }}>▸</span>
                            <span style={{ fontSize: 13, color: "#374151" }}>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}