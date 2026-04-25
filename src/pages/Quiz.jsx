import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const SKILLS = ["Кодування", "Електроніка", "3D Моделювання", "3D Друк", "Паяння"];

const QUESTIONS = [
  { skill: 0, text: "Ти завантажив код на Arduino, але робот їде вперед і не реагує на перешкоду. Де найімовірніше помилка?", options: [{ text: "Потрібно перезавантажити Arduino — можливо, зависла", pts: 0 }, { text: "Треба збільшити delay(), щоб робот встигав реагувати", pts: 1 }, { text: "Умова if не спрацьовує — перевірю зчитування даних з сенсора", pts: 2 }] },
  { skill: 0, text: "Тобі потрібно, щоб світлодіод блимав рівно 10 разів і зупинився. Який підхід обереш?", options: [{ text: "Знайду готовий скетч в інтернеті та завантажу", pts: 0 }, { text: "Напишу digitalWrite та delay() десять разів підряд", pts: 1 }, { text: "Використаю цикл for з лічильником від 0 до 9", pts: 2 }] },
  { skill: 1, text: "Ти підключив світлодіод до піна Arduino без резистора. За кілька секунд він перестав світитися. Що сталося?", options: [{ text: "Arduino перегрілась і вимкнула пін автоматично", pts: 0 }, { text: "Швидше за все переплутав полярність і він згорів", pts: 1 }, { text: "Пін дав занадто великий струм — без резистора LED перегорів", pts: 2 }] },
  { skill: 1, text: "Ти хочеш, щоб Arduino керувала двигуном постійного струму. Чому не можна підключити двигун напряму до піна?", options: [{ text: "Arduino не підтримує двигуни постійного струму", pts: 0 }, { text: "Потрібна напруга 12V, якої пін Arduino не дає", pts: 1 }, { text: "Двигун споживає більше струму, ніж витримує пін — це може спалити Arduino", pts: 2 }] },
  { skill: 2, text: "Ти надрукував кришку корпусу і вона не налазить на основу — занадто туго. Що зробиш у моделі?", options: [{ text: "Надрукую ще раз з тих самих параметрів — може цього разу вийде", pts: 0 }, { text: "Оброблю поверхню наждачним папером, щоб підігнати", pts: 1 }, { text: "Зменшу кришку на 0.2–0.4 мм по периметру, щоб врахувати допуск друку", pts: 2 }] },
  { skill: 2, text: "Тобі треба зробити кронштейн для кріплення серводвигуна до рами. З чого починаєш?", options: [{ text: "Знаходжу схожу деталь на Thingiverse і використовую як є", pts: 0 }, { text: "Відразу малюю у Tinkercad приблизно на вічко", pts: 1 }, { text: "Вимірюю серво штангенциркулем, роблю ескіз з розмірами — потім моделюю", pts: 2 }] },
  { skill: 3, text: "Під час друку перший шар не прилипає до столу і деталь відклеюється. Що зробиш?", options: [{ text: "Зупиню і запущу друк знову без жодних змін", pts: 0 }, { text: "Зменшу швидкість друку першого шару у слайсері", pts: 1 }, { text: "Перекалібрую стіл, відрегулюю відстань до сопла і нанесу клей або лак", pts: 2 }] },
  { skill: 3, text: "Деталь вийшла з тонкими ниточками між частинами (stringing). Що зміниш у слайсері?", options: [{ text: "Збільшу температуру сопла — пластик краще потече", pts: 0 }, { text: "Зменшу заповнення (infill)", pts: 1 }, { text: "Увімкну або збільшу retraction (відтяжку пластику)", pts: 2 }] },
  { skill: 4, text: "Ти паяєш дріт до контакту, але припій не прилипає — скочується кулькою. Яка причина?", options: [{ text: "В катушці закінчується припій — його не вистачає", pts: 0 }, { text: "Паяльник недостатньо нагрівся — треба почекати", pts: 1 }, { text: "Контакт або дріт не залужені або вкриті окисом — треба залудити", pts: 2 }] },
  { skill: 4, text: "Ти зібрав схему, але вона не працює. Як за допомогою мультиметра знайдеш проблему?", options: [{ text: "Не знаю як ним користуватись — перепаяю все заново", pts: 0 }, { text: "Виміряю напругу на виході блока живлення", pts: 1 }, { text: "Переключу у режим прозвонки і перевірю кожне з'єднання окремо", pts: 2 }] },
];

function getSkillScores(answers) {
  return [0, 1, 2, 3, 4].map(skill =>
    answers.reduce((sum, v, i) => QUESTIONS[i].skill === skill ? sum + v : sum, 0)
  );
}

function getGroup(answers) {
  const total = answers.reduce((a, b) => a + b, 0);
  if (total >= 14) return "A";
  if (total >= 7) return "B";
  return "C";
}

export default function Quiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleAnswer(pts) {
    const next = [...answers, pts];
    setSelected(null);

    if (step < QUESTIONS.length - 1) {
      setAnswers(next);
      setStep(step + 1);
    } else {
      // Quiz done — save to Firebase
      setSaving(true);
      const scores = getSkillScores(next);
      const group = getGroup(next);
      const doc = await addDoc(collection(db, "students"), {
        name,
        group,
        scores,
        answers: next,
        total: next.reduce((a, b) => a + b, 0),
        manual: false,
        createdAt: new Date(),
      });
      navigate(`/results/${doc.id}`);
    }
  }

  // ── Name screen
  if (step === -1) return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, width: "100%", padding: "0 20px" }}>
        <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 22, color: "#111827", marginBottom: 4 }}>ROBOTRACK</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 40 }}>Діагностика · Робототехніка · 9 клас</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8, lineHeight: 1.2 }}>Введи своє ім'я</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Ти отримаєш 10 практичних запитань по 5 навичках. Обирай ту відповідь, яка найближча до того, що ти б зробив насправді.</div>
        <input
          value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && setStep(0)}
          placeholder="Прізвище та ім'я..."
          autoFocus
          style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, outline: "none", marginBottom: 12, fontFamily: "monospace", boxSizing: "border-box" }}
        />
        <button
          onClick={() => name.trim() && setStep(0)}
          disabled={!name.trim()}
          style={{ width: "100%", padding: 13, borderRadius: 8, background: name.trim() ? "#111827" : "#f3f4f6", color: name.trim() ? "#fff" : "#9ca3af", border: "none", fontWeight: 700, fontSize: 15, cursor: name.trim() ? "pointer" : "default" }}>
          Почати →
        </button>
      </div>
    </div>
  );

  // ── Saving screen
  if (saving) return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 15 }}>Зберігаємо результати...</div>
      </div>
    </div>
  );

  // ── Question screen
  const q = QUESTIONS[step];
  const pct = (step / QUESTIONS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, width: "100%", padding: "0 20px" }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#e5e7eb", borderRadius: 2, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#f97316", borderRadius: 2, transition: "width .3s" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 24 }}>
          <span>{name}</span>
          <span>{step + 1} / {QUESTIONS.length}</span>
        </div>

        {/* Skill badge */}
        <div style={{ display: "inline-block", background: "#f1f5f9", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
          {SKILLS[q.skill]}
        </div>

        {/* Question */}
        <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", lineHeight: 1.5, marginBottom: 24, padding: 16, background: "#fff", borderRadius: 10, border: "0.5px solid #e5e7eb" }}>
          {q.text}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            const isSel = selected === i;
            return (
              <button key={i}
                onClick={() => { setSelected(i); setTimeout(() => handleAnswer(opt.pts), 280); }}
                style={{ padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: "pointer", border: isSel ? "1.5px solid #f97316" : "1px solid #e5e7eb", background: isSel ? "#fff7ed" : "#fff", display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13, color: "#374151", transition: "all .12s", lineHeight: 1.5 }}>
                <span style={{ color: isSel ? "#f97316" : "#d1d5db", minWidth: 20, fontWeight: 700 }}>{String.fromCharCode(65 + i)}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}