import { useState, useEffect, useRef } from "react";

const SECTIONS = ["Dashboard", "Goals", "Daily", "Reflect", "Wins"];

const initialGoals = [];
const initialDailyEntries = [];
const initialWins = [];

const motivationalQuotes = [
  "You didn't come this far to only come this far.",
  "The finish line is just the beginning of a whole new race.",
  "What you do today can improve all your tomorrows.",
  "Don't watch the clock. Do what it does. Keep going.",
  "Champions keep playing until they get it right.",
  "Small steps every day lead to massive results.",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function ProgressRing({ percent, size = 80, stroke = 7, color = "#c8a96e" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2520" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        style={{ fill: "#f0e6d3", fontSize: size * 0.2, fontFamily: "inherit", transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function FinishersJournal() {
  const [section, setSection] = useState("Dashboard");
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fj_goals") || "[]"); } catch { return []; }
  });
  const [dailyEntries, setDailyEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fj_daily") || "[]"); } catch { return []; }
  });
  const [wins, setWins] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fj_wins") || "[]"); } catch { return []; }
  });
  const [quoteIndex] = useState(() => Math.floor(Math.random() * motivationalQuotes.length));
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  useEffect(() => { localStorage.setItem("fj_goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem("fj_daily", JSON.stringify(dailyEntries)); }, [dailyEntries]);
  useEffect(() => { localStorage.setItem("fj_wins", JSON.stringify(wins)); }, [wins]);

  const todayEntry = dailyEntries.find(e => e.date === getToday());
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.progress >= 100).length;
  const avgProgress = totalGoals ? Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / totalGoals) : 0;
  const streak = calcStreak(dailyEntries);

  function calcStreak(entries) {
    if (!entries.length) return 0;
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    let current = new Date(getToday());
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i].date + "T00:00:00");
      const diff = Math.round((current - d) / 86400000);
      if (diff === 0 || diff === count) { count++; current = d; }
      else break;
    }
    return count;
  }

  return (
    <div style={styles.app}>
      {/* Decorative background */}
      <div style={styles.bgPattern} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.logoMark}>◈</div>
            <h1 style={styles.logoText}>THE WINNERS<br /><span style={styles.logoAccent}>JOURNAL</span></h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.streakBadge}>
              <span style={styles.streakNum}>{streak}</span>
              <span style={styles.streakLabel}>day streak</span>
            </div>
          </div>
        </div>
        <nav style={styles.nav}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => setSection(s)} style={{ ...styles.navBtn, ...(section === s ? styles.navBtnActive : {}) }}>
              {s}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        {section === "Dashboard" && (
          <Dashboard
            goals={goals} wins={wins} dailyEntries={dailyEntries}
            avgProgress={avgProgress} completedGoals={completedGoals}
            totalGoals={totalGoals} streak={streak} quote={motivationalQuotes[quoteIndex]}
            onNavigate={setSection}
          />
        )}
        {section === "Goals" && (
          <Goals
            goals={goals} setGoals={setGoals}
            showForm={showGoalForm} setShowForm={setShowGoalForm}
            editGoal={editGoal} setEditGoal={setEditGoal}
          />
        )}
        {section === "Daily" && (
          <Daily dailyEntries={dailyEntries} setDailyEntries={setDailyEntries} goals={goals} todayEntry={todayEntry} />
        )}
        {section === "Reflect" && (
          <Reflect dailyEntries={dailyEntries} goals={goals} />
        )}
        {section === "Wins" && (
          <Wins wins={wins} setWins={setWins} />
        )}
      </main>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard({ goals, wins, dailyEntries, avgProgress, completedGoals, totalGoals, streak, quote, onNavigate }) {
  const topGoals = [...goals].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 3);
  const recentWins = [...wins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <div style={styles.section}>
      {/* Quote */}
      <div style={styles.quoteCard}>
        <div style={styles.quoteDecor}>"</div>
        <p style={styles.quoteText}>{quote}</p>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatCard label="Goals Completed" value={`${completedGoals}/${totalGoals}`} icon="🏆" />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon="📈" />
        <StatCard label="Day Streak" value={streak} icon="🔥" />
        <StatCard label="Total Wins" value={wins.length} icon="⭐" />
      </div>

      {/* Top Goals */}
      <div style={styles.dashRow}>
        <div style={styles.dashCard}>
          <h3 style={styles.dashCardTitle}>TOP GOALS</h3>
          {topGoals.length === 0 ? (
            <EmptyState msg="No goals yet" action="Add your first goal →" onAction={() => onNavigate("Goals")} />
          ) : topGoals.map(g => (
            <div key={g.id} style={styles.dashGoalRow}>
              <div style={{ flex: 1 }}>
                <div style={styles.dashGoalName}>{g.title}</div>
                <div style={styles.progressBarWrap}>
                  <div style={{ ...styles.progressBar, width: `${g.progress || 0}%` }} />
                </div>
              </div>
              <ProgressRing percent={g.progress || 0} size={52} stroke={5} />
            </div>
          ))}
        </div>

        <div style={styles.dashCard}>
          <h3 style={styles.dashCardTitle}>RECENT WINS</h3>
          {recentWins.length === 0 ? (
            <EmptyState msg="No wins logged yet" action="Log a win →" onAction={() => onNavigate("Wins")} />
          ) : recentWins.map(w => (
            <div key={w.id} style={styles.winRow}>
              <span style={styles.winStar}>★</span>
              <div>
                <div style={styles.winTitle}>{w.title}</div>
                <div style={styles.winDate}>{formatDate(w.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

/* ─── GOALS ─── */
function Goals({ goals, setGoals, showForm, setShowForm, editGoal, setEditGoal }) {
  const [form, setForm] = useState({ title: "", category: "Personal", target: "", deadline: "", progress: 0, notes: "" });

  useEffect(() => {
    if (editGoal) setForm({ ...editGoal });
    else setForm({ title: "", category: "Personal", target: "", deadline: "", progress: 0, notes: "" });
  }, [editGoal, showForm]);

  function saveGoal() {
    if (!form.title.trim()) return;
    if (editGoal) {
      setGoals(goals.map(g => g.id === editGoal.id ? { ...form, id: editGoal.id } : g));
      setEditGoal(null);
    } else {
      setGoals([...goals, { ...form, id: Date.now(), createdAt: getToday() }]);
    }
    setShowForm(false);
  }

  function deleteGoal(id) {
    if (window.confirm("Delete this goal?")) setGoals(goals.filter(g => g.id !== id));
  }

  function updateProgress(id, val) {
    setGoals(goals.map(g => g.id === id ? { ...g, progress: Math.min(100, Math.max(0, Number(val))) } : g));
  }

  const categories = ["Personal", "Health", "Career", "Finance", "Learning", "Spiritual", "Relationships"];

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>MY GOALS</h2>
        <button style={styles.addBtn} onClick={() => { setEditGoal(null); setShowForm(true); }}>+ NEW GOAL</button>
      </div>

      {(showForm || editGoal) && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editGoal ? "EDIT GOAL" : "NEW GOAL"}</h3>
          <div style={styles.formGrid}>
            <div style={styles.formField}>
              <label style={styles.label}>Goal Title *</label>
              <input style={styles.input} placeholder="What do you want to achieve?" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Category</label>
              <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Target / Milestone</label>
              <input style={styles.input} placeholder="e.g. Run 5km, Save R10,000" value={form.target}
                onChange={e => setForm({ ...form, target: e.target.value })} />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Deadline</label>
              <input style={{ ...styles.input, colorScheme: "dark" }} type="date" value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div style={{ ...styles.formField, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Progress: {form.progress}%</label>
              <input type="range" min="0" max="100" value={form.progress} style={styles.slider}
                onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
            </div>
            <div style={{ ...styles.formField, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Notes / Why This Matters</label>
              <textarea style={{ ...styles.input, ...styles.textarea }} placeholder="Your 'why'..." value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={() => { setShowForm(false); setEditGoal(null); }}>Cancel</button>
            <button style={styles.saveBtn} onClick={saveGoal}>Save Goal</button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState msg="No goals added yet. Start with your biggest dream." />
      ) : (
        <div style={styles.goalsGrid}>
          {goals.map(g => (
            <div key={g.id} style={styles.goalCard}>
              <div style={styles.goalCardTop}>
                <div>
                  <span style={{ ...styles.categoryTag, backgroundColor: categoryColor(g.category) }}>{g.category}</span>
                  <h3 style={styles.goalTitle}>{g.title}</h3>
                  {g.target && <p style={styles.goalTarget}>🎯 {g.target}</p>}
                  {g.deadline && <p style={styles.goalDeadline}>📅 {formatDate(g.deadline)}</p>}
                  {g.notes && <p style={styles.goalNotes}>{g.notes}</p>}
                </div>
                <ProgressRing percent={g.progress || 0} size={72} stroke={6} color={g.progress >= 100 ? "#6ec87a" : "#c8a96e"} />
              </div>
              <div style={styles.progressUpdate}>
                <label style={styles.label}>Update Progress: {g.progress || 0}%</label>
                <input type="range" min="0" max="100" value={g.progress || 0} style={styles.slider}
                  onChange={e => updateProgress(g.id, e.target.value)} />
              </div>
              <div style={styles.goalActions}>
                <button style={styles.editBtn} onClick={() => { setEditGoal(g); setShowForm(false); }}>Edit</button>
                <button style={styles.deleteBtn} onClick={() => deleteGoal(g.id)}>Delete</button>
              </div>
              {g.progress >= 100 && <div style={styles.completedBadge}>✓ COMPLETED</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── DAILY CHECK-IN ─── */
function Daily({ dailyEntries, setDailyEntries, goals, todayEntry }) {
  const [form, setForm] = useState({
    date: getToday(),
    topThree: ["", "", ""],
    gratitude: ["", "", ""],
    mood: 3,
    reflection: "",
    goalUpdates: {},
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (todayEntry) setForm(todayEntry);
  }, [todayEntry]);

  function save() {
    const entry = { ...form, date: getToday() };
    setDailyEntries(prev => {
      const filtered = prev.filter(e => e.date !== getToday());
      return [...filtered, entry];
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const moodEmojis = ["😔", "😕", "😐", "🙂", "😄"];

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>DAILY CHECK-IN</h2>
        <span style={styles.dateLabel}>{formatDate(getToday())}</span>
      </div>

      <div style={styles.dailyGrid}>
        {/* Top 3 */}
        <div style={styles.dailyCard}>
          <h3 style={styles.dailyCardTitle}>📌 TOP 3 PRIORITIES TODAY</h3>
          {[0, 1, 2].map(i => (
            <div key={i} style={styles.priorityRow}>
              <span style={styles.priorityNum}>{i + 1}</span>
              <input style={styles.priorityInput} placeholder={`Priority ${i + 1}...`}
                value={form.topThree[i]} onChange={e => {
                  const t = [...form.topThree]; t[i] = e.target.value;
                  setForm({ ...form, topThree: t });
                }} />
            </div>
          ))}
        </div>

        {/* Gratitude */}
        <div style={styles.dailyCard}>
          <h3 style={styles.dailyCardTitle}>🙏 GRATITUDE (3 THINGS)</h3>
          {[0, 1, 2].map(i => (
            <div key={i} style={styles.priorityRow}>
              <span style={{ ...styles.priorityNum, color: "#c8a96e" }}>✦</span>
              <input style={styles.priorityInput} placeholder={`I'm grateful for...`}
                value={form.gratitude[i]} onChange={e => {
                  const g = [...form.gratitude]; g[i] = e.target.value;
                  setForm({ ...form, gratitude: g });
                }} />
            </div>
          ))}
        </div>

        {/* Mood */}
        <div style={styles.dailyCard}>
          <h3 style={styles.dailyCardTitle}>💭 MOOD CHECK</h3>
          <div style={styles.moodRow}>
            {moodEmojis.map((em, i) => (
              <button key={i} style={{ ...styles.moodBtn, ...(form.mood === i + 1 ? styles.moodBtnActive : {}) }}
                onClick={() => setForm({ ...form, mood: i + 1 })}>
                {em}
              </button>
            ))}
          </div>
          <p style={styles.moodLabel}>{["Struggling", "Low", "Neutral", "Good", "Excellent"][form.mood - 1]}</p>
        </div>

        {/* Goal progress */}
        {goals.length > 0 && (
          <div style={styles.dailyCard}>
            <h3 style={styles.dailyCardTitle}>🎯 GOAL PROGRESS TODAY</h3>
            {goals.slice(0, 5).map(g => (
              <div key={g.id} style={styles.dailyGoalRow}>
                <span style={styles.dailyGoalName}>{g.title}</span>
                <div style={styles.checkboxGroup}>
                  {["No progress", "Some", "Great day!"].map((label, i) => (
                    <label key={i} style={styles.radioLabel}>
                      <input type="radio" name={`goal_${g.id}`} value={i}
                        checked={(form.goalUpdates[g.id] || 0) === i}
                        onChange={() => setForm({ ...form, goalUpdates: { ...form.goalUpdates, [g.id]: i } })}
                        style={{ accentColor: "#c8a96e" }} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reflection */}
        <div style={{ ...styles.dailyCard, gridColumn: "1 / -1" }}>
          <h3 style={styles.dailyCardTitle}>✍️ END OF DAY REFLECTION</h3>
          <textarea style={{ ...styles.input, ...styles.textarea, minHeight: 100 }}
            placeholder="What went well? What would you do differently? What did you learn?"
            value={form.reflection} onChange={e => setForm({ ...form, reflection: e.target.value })} />
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button style={styles.saveBtn} onClick={save}>
          {saved ? "✓ SAVED!" : "SAVE TODAY'S ENTRY"}
        </button>
      </div>
    </div>
  );
}

/* ─── REFLECT ─── */
function Reflect({ dailyEntries, goals }) {
  const sorted = [...dailyEntries].sort((a, b) => b.date.localeCompare(a.date));
  const moodEmojis = ["😔", "😕", "😐", "🙂", "😄"];
  const moodLabels = ["Struggling", "Low", "Neutral", "Good", "Excellent"];

  const avgMood = sorted.length
    ? (sorted.reduce((sum, e) => sum + (e.mood || 3), 0) / sorted.length).toFixed(1)
    : "–";

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>REFLECTION JOURNAL</h2>
        <div style={styles.moodSummary}>Avg mood: {avgMood} {moodEmojis[Math.round(avgMood) - 1] || ""}</div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState msg="No daily entries yet. Start your first check-in." />
      ) : sorted.map(e => (
        <div key={e.date} style={styles.reflectCard}>
          <div style={styles.reflectHeader}>
            <span style={styles.reflectDate}>{formatDate(e.date)}</span>
            <span style={styles.reflectMood}>{moodEmojis[(e.mood || 3) - 1]} {moodLabels[(e.mood || 3) - 1]}</span>
          </div>
          {e.topThree?.filter(Boolean).length > 0 && (
            <div style={styles.reflectSection}>
              <strong style={styles.reflectLabel}>📌 Top 3</strong>
              <ul style={styles.reflectList}>
                {e.topThree.filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {e.gratitude?.filter(Boolean).length > 0 && (
            <div style={styles.reflectSection}>
              <strong style={styles.reflectLabel}>🙏 Gratitude</strong>
              <ul style={styles.reflectList}>
                {e.gratitude.filter(Boolean).map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {e.reflection && (
            <div style={styles.reflectSection}>
              <strong style={styles.reflectLabel}>✍️ Reflection</strong>
              <p style={styles.reflectText}>{e.reflection}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── WINS ─── */
function Wins({ wins, setWins }) {
  const [form, setForm] = useState({ title: "", detail: "", date: getToday(), category: "Personal" });
  const [showForm, setShowForm] = useState(false);

  function addWin() {
    if (!form.title.trim()) return;
    setWins([...wins, { ...form, id: Date.now() }]);
    setForm({ title: "", detail: "", date: getToday(), category: "Personal" });
    setShowForm(false);
  }

  const categories = ["Personal", "Health", "Career", "Finance", "Learning", "Spiritual", "Relationships"];
  const sorted = [...wins].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>WIN VAULT</h2>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>+ LOG WIN</button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>LOG A WIN ⭐</h3>
          <div style={styles.formGrid}>
            <div style={styles.formField}>
              <label style={styles.label}>Win Title *</label>
              <input style={styles.input} placeholder="What did you achieve?" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Category</label>
              <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Date</label>
              <input style={{ ...styles.input, colorScheme: "dark" }} type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={{ ...styles.formField, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Details</label>
              <textarea style={{ ...styles.input, ...styles.textarea }} placeholder="Tell the story of this win..."
                value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} />
            </div>
          </div>
          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button style={styles.saveBtn} onClick={addWin}>Save Win</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState msg="Your wins deserve to be celebrated. Log your first one!" />
      ) : (
        <div style={styles.winsGrid}>
          {sorted.map(w => (
            <div key={w.id} style={styles.winCard}>
              <div style={styles.winCardStar}>★</div>
              <span style={{ ...styles.categoryTag, backgroundColor: categoryColor(w.category) }}>{w.category}</span>
              <h3 style={styles.winCardTitle}>{w.title}</h3>
              {w.detail && <p style={styles.winCardDetail}>{w.detail}</p>}
              <p style={styles.winCardDate}>{formatDate(w.date)}</p>
              <button style={styles.deleteBtn} onClick={() => {
                if (window.confirm("Remove this win?")) setWins(wins.filter(x => x.id !== w.id));
              }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── HELPERS ─── */
function EmptyState({ msg, action, onAction }) {
  return (
    <div style={styles.emptyState}>
      <p style={styles.emptyText}>{msg}</p>
      {action && <button style={styles.emptyAction} onClick={onAction}>{action}</button>}
    </div>
  );
}

function categoryColor(cat) {
  const map = {
    Personal: "#5a3e28", Health: "#2a4a35", Career: "#1e3a5f",
    Finance: "#3d2a5a", Learning: "#4a3a1e", Spiritual: "#3a2a4a", Relationships: "#4a2a2a",
  };
  return map[cat] || "#3a3228";
}

/* ─── STYLES ─── */
const styles = {
  app: {
    minHeight: "100vh",
    background: "#12100e",
    color: "#f0e6d3",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflowX: "hidden",
  },
  bgPattern: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: `radial-gradient(ellipse at 20% 10%, rgba(200,169,110,0.06) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 90%, rgba(200,169,110,0.04) 0%, transparent 50%)`,
  },
  header: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(18,16,14,0.95)",
    borderBottom: "1px solid #3a3228",
    backdropFilter: "blur(8px)",
  },
  headerInner: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    padding: "16px 28px 8px",
  },
  logoMark: { color: "#c8a96e", fontSize: 22, lineHeight: 1, marginBottom: 2 },
  logoText: {
    margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "0.18em",
    color: "#f0e6d3", lineHeight: 1.2, textTransform: "uppercase",
  },
  logoAccent: { color: "#c8a96e", fontSize: 22, letterSpacing: "0.22em" },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  streakBadge: {
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "rgba(200,169,110,0.12)", border: "1px solid #c8a96e44",
    borderRadius: 8, padding: "6px 14px",
  },
  streakNum: { fontSize: 22, fontWeight: 700, color: "#c8a96e", lineHeight: 1 },
  streakLabel: { fontSize: 10, letterSpacing: "0.12em", color: "#a09070", textTransform: "uppercase" },
  nav: { display: "flex", gap: 4, padding: "0 20px 0", overflowX: "auto" },
  navBtn: {
    background: "none", border: "none", color: "#7a6a58", cursor: "pointer",
    padding: "10px 16px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
    fontFamily: "inherit", borderBottom: "2px solid transparent", transition: "all 0.2s",
  },
  navBtnActive: { color: "#c8a96e", borderBottomColor: "#c8a96e" },
  main: { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "28px 16px 60px" },
  section: {},
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  sectionTitle: { margin: 0, fontSize: 18, letterSpacing: "0.2em", color: "#f0e6d3", textTransform: "uppercase" },
  dateLabel: { fontSize: 12, color: "#7a6a58", letterSpacing: "0.08em" },
  quoteCard: {
    position: "relative", background: "rgba(200,169,110,0.06)", border: "1px solid #c8a96e33",
    borderRadius: 4, padding: "24px 32px", marginBottom: 28, overflow: "hidden",
  },
  quoteDecor: {
    position: "absolute", top: -10, left: 16, fontSize: 80, color: "#c8a96e22",
    fontFamily: "Georgia", lineHeight: 1, pointerEvents: "none",
  },
  quoteText: { margin: 0, fontSize: 15, lineHeight: 1.7, color: "#c8a96e", fontStyle: "italic", position: "relative" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 },
  statCard: {
    background: "#1c1814", border: "1px solid #2e2820", borderRadius: 6,
    padding: "16px 12px", textAlign: "center",
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 700, color: "#c8a96e" },
  statLabel: { fontSize: 10, color: "#7a6a58", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 },
  dashRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  dashCard: { background: "#1c1814", border: "1px solid #2e2820", borderRadius: 6, padding: 20 },
  dashCardTitle: { margin: "0 0 16px", fontSize: 11, letterSpacing: "0.2em", color: "#c8a96e", textTransform: "uppercase" },
  dashGoalRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  dashGoalName: { fontSize: 13, color: "#d4c4a8", marginBottom: 6 },
  progressBarWrap: { height: 4, background: "#2a2520", borderRadius: 2, overflow: "hidden" },
  progressBar: { height: "100%", background: "#c8a96e", borderRadius: 2, transition: "width 0.4s" },
  winRow: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  winStar: { color: "#c8a96e", fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  winTitle: { fontSize: 13, color: "#d4c4a8" },
  winDate: { fontSize: 11, color: "#5a5040", marginTop: 2 },
  goalsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 },
  goalCard: {
    background: "#1c1814", border: "1px solid #2e2820", borderRadius: 6, padding: 20,
    position: "relative", transition: "border-color 0.2s",
  },
  goalCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  categoryTag: {
    display: "inline-block", padding: "2px 8px", borderRadius: 3,
    fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, color: "#c8a96e",
  },
  goalTitle: { margin: "0 0 6px", fontSize: 15, color: "#f0e6d3" },
  goalTarget: { margin: "0 0 4px", fontSize: 12, color: "#9a8a6e" },
  goalDeadline: { margin: "0 0 4px", fontSize: 12, color: "#7a6a58" },
  goalNotes: { margin: "6px 0 0", fontSize: 12, color: "#6a5a48", fontStyle: "italic", lineHeight: 1.5 },
  progressUpdate: { marginBottom: 12 },
  goalActions: { display: "flex", gap: 8 },
  completedBadge: {
    position: "absolute", top: 12, right: 12,
    background: "rgba(110,200,122,0.15)", border: "1px solid #6ec87a55",
    color: "#6ec87a", fontSize: 10, padding: "2px 8px", borderRadius: 3, letterSpacing: "0.12em",
  },
  formCard: { background: "#1c1814", border: "1px solid #c8a96e33", borderRadius: 6, padding: 24, marginBottom: 24 },
  formTitle: { margin: "0 0 20px", fontSize: 13, letterSpacing: "0.2em", color: "#c8a96e" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formField: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, letterSpacing: "0.12em", color: "#7a6a58", textTransform: "uppercase" },
  input: {
    background: "#141210", border: "1px solid #3a3228", borderRadius: 4,
    color: "#f0e6d3", padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
    outline: "none",
  },
  textarea: { resize: "vertical", minHeight: 80, lineHeight: 1.6 },
  slider: { width: "100%", accentColor: "#c8a96e", cursor: "pointer" },
  formActions: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 },
  addBtn: {
    background: "#c8a96e", color: "#12100e", border: "none", borderRadius: 4,
    padding: "10px 18px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
    fontFamily: "inherit", cursor: "pointer", fontWeight: 700,
  },
  saveBtn: {
    background: "#c8a96e", color: "#12100e", border: "none", borderRadius: 4,
    padding: "10px 24px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
    fontFamily: "inherit", cursor: "pointer", fontWeight: 700,
  },
  cancelBtn: {
    background: "none", color: "#7a6a58", border: "1px solid #3a3228", borderRadius: 4,
    padding: "10px 24px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
    fontFamily: "inherit", cursor: "pointer",
  },
  editBtn: {
    background: "none", color: "#c8a96e", border: "1px solid #c8a96e44", borderRadius: 3,
    padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
  },
  deleteBtn: {
    background: "none", color: "#7a6a58", border: "1px solid #3a3228", borderRadius: 3,
    padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
  },
  dailyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  dailyCard: { background: "#1c1814", border: "1px solid #2e2820", borderRadius: 6, padding: 20 },
  dailyCardTitle: { margin: "0 0 16px", fontSize: 12, letterSpacing: "0.15em", color: "#c8a96e", textTransform: "uppercase" },
  priorityRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  priorityNum: { color: "#c8a96e", fontWeight: 700, fontSize: 16, width: 20, flexShrink: 0 },
  priorityInput: {
    flex: 1, background: "#141210", border: "none", borderBottom: "1px solid #3a3228",
    color: "#f0e6d3", padding: "6px 2px", fontSize: 13, fontFamily: "inherit", outline: "none",
  },
  moodRow: { display: "flex", gap: 8, marginBottom: 10 },
  moodBtn: {
    background: "#141210", border: "1px solid #2e2820", borderRadius: 4,
    fontSize: 22, padding: "6px 10px", cursor: "pointer", transition: "all 0.15s",
  },
  moodBtnActive: { background: "rgba(200,169,110,0.15)", borderColor: "#c8a96e" },
  moodLabel: { margin: 0, fontSize: 12, color: "#9a8a6e", textAlign: "center" },
  dailyGoalRow: { marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #2a2218" },
  dailyGoalName: { fontSize: 12, color: "#c8a96e", marginBottom: 6, display: "block" },
  checkboxGroup: { display: "flex", gap: 12, flexWrap: "wrap" },
  radioLabel: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9a8a6e", cursor: "pointer" },
  reflectCard: {
    background: "#1c1814", border: "1px solid #2e2820", borderRadius: 6,
    padding: 20, marginBottom: 16,
  },
  reflectHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  reflectDate: { fontSize: 13, color: "#c8a96e", letterSpacing: "0.08em" },
  reflectMood: { fontSize: 13, color: "#7a6a58" },
  reflectSection: { marginBottom: 12 },
  reflectLabel: { fontSize: 11, letterSpacing: "0.12em", color: "#7a6a58", textTransform: "uppercase", display: "block", marginBottom: 6 },
  reflectList: { margin: 0, padding: "0 0 0 20px", color: "#d4c4a8", fontSize: 13, lineHeight: 1.7 },
  reflectText: { margin: 0, fontSize: 13, color: "#d4c4a8", lineHeight: 1.7, fontStyle: "italic" },
  moodSummary: { fontSize: 13, color: "#7a6a58" },
  winsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 16 },
  winCard: {
    background: "#1c1814", border: "1px solid #2e2820", borderRadius: 6, padding: 20,
    position: "relative", textAlign: "center",
  },
  winCardStar: { fontSize: 32, color: "#c8a96e", marginBottom: 8 },
  winCardTitle: { margin: "8px 0 8px", fontSize: 15, color: "#f0e6d3" },
  winCardDetail: { fontSize: 12, color: "#9a8a6e", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 8px" },
  winCardDate: { fontSize: 11, color: "#5a5040", margin: "0 0 12px" },
  emptyState: { textAlign: "center", padding: "48px 20px" },
  emptyText: { color: "#5a5040", fontSize: 14, marginBottom: 16, fontStyle: "italic" },
  emptyAction: {
    background: "none", color: "#c8a96e", border: "1px solid #c8a96e55",
    padding: "8px 18px", borderRadius: 4, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
  },
};
