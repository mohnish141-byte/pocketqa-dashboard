import { useEffect, useState } from "react";

type TestStatus = "Not Run" | "Pass" | "Fail" | "Blocked";

type TestCase = {
  id: string;
  title: string;
  status: TestStatus;
  device: string;
  steps: string;
  expectedResult: string;
  priority: string;
  project: string;
  appVersion: string;
  actualResult: string;
  bugNotes: string;
};

function isTestStatus(value: unknown): value is TestStatus {
  return (
    value === "Not Run" ||
    value === "Pass" ||
    value === "Fail" ||
    value === "Blocked"
  );
}

function loadTestCases(): TestCase[] {
  try {
    const saved = localStorage.getItem("mobile-qa-test-cases");
    const parsed: unknown = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof item.id !== "string" ||
        typeof item.title !== "string"
      ) {
        return [];
      }

      return [
        {
          id: item.id,
          title: item.title,
          project: typeof item.project === "string" ? item.project : "General",
          appVersion: typeof item.appVersion === "string" ? item.appVersion : "",
          priority: ["High", "Medium", "Low"].includes(item.priority) ? item.priority : "Medium",
          actualResult: typeof item.actualResult === "string" ? item.actualResult : "",
          bugNotes: typeof item.bugNotes === "string" ? item.bugNotes : "",
          device: typeof item.device === "string" ? item.device : "",
          steps: typeof item.steps === "string" ? item.steps : "",
          expectedResult: typeof item.expectedResult === "string" ? item.expectedResult : "",
          status: isTestStatus(item.status) ? item.status : "Not Run",
        },
      ];
    });
  } catch {
    return [];
  }
}

function App() {
  const [project, setProject] = useState("General");
  const [appVersion, setAppVersion] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [versionFilter, setVersionFilter] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [actualResult, setActualResult] = useState("");
  const [bugNotes, setBugNotes] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [deleted, setDeleted] = useState<TestCase[]>([]);
  const [device, setDevice] = useState("");
  const [steps, setSteps] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  function resetForm() {
    setEditingId(null); setTitle(""); setDevice(""); setSteps(""); setExpectedResult(""); setPriority("Medium"); setActualResult(""); setBugNotes(""); setProject("General"); setAppVersion("");
  }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [title, setTitle] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>(loadTestCases);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(
        "mobile-qa-test-cases",
        JSON.stringify(testCases)
      );
      setSaveError("");
    } catch {
      setSaveError("Changes could not be saved in this browser.");
    }
  }, [testCases]);

  function addTestCase() {
    if (!title.trim()) return;

    if (editingId) {
      setTestCases(previous => previous.map(item => item.id === editingId ? { ...item, title: title.trim(), device: device.trim(), steps: steps.trim(), expectedResult: expectedResult.trim(), project: project.trim() || "General", appVersion: appVersion.trim(), priority, actualResult: actualResult.trim(), bugNotes: bugNotes.trim() } : item));
      resetForm();
      return;
    }
    const newCase: TestCase = {
      id: crypto.randomUUID(),
      title: title.trim(),
      status: "Not Run", device: device.trim(), steps: steps.trim(), expectedResult: expectedResult.trim(), project: project.trim() || "General", appVersion: appVersion.trim(), priority, actualResult: actualResult.trim(), bugNotes: bugNotes.trim(),
    };

    setTestCases((previous) => [...previous, newCase]);
    resetForm();
  }

  function exportCsv() {
    const cell = (value: string) => '"' + (/^[\s]*[=+@\-]/.test(value) ? "'" + value : value).replace(/"/g, '""') + '"';
    const rows = [["ID", "Test case", "Project", "App version", "Device / OS", "Steps", "Expected result", "Priority", "Actual result", "Bug notes", "Status"], ...testCases.map(item => [item.id, item.title, item.project, item.appVersion, item.device, item.steps, item.expectedResult, item.priority, item.actualResult, item.bugNotes, item.status])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pocketqa-test-cases.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ version: 1, testCases }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "pocketqa-backup.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restoreBackup(file?: File) {
    if (!file) return;
    if (file.size > 4000000) { setNotice("Backup must be smaller than 4 MB."); return; }
    try {
      const data = JSON.parse(await file.text());
      if (data.version !== 1 || !Array.isArray(data.testCases) || data.testCases.length > 2000) throw new Error();
      const ids = new Set<string>();
      const imported: TestCase[] = data.testCases.map((item: TestCase) => {
        if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id) || typeof item.title !== "string" || !item.title.trim() || item.title.length > 300 || !isTestStatus(item.status)) throw new Error();
        ids.add(item.id);
        for (const field of ["device", "steps", "expectedResult", "actualResult", "bugNotes", "project", "appVersion"] as const) {
          if (item[field] !== undefined && (typeof item[field] !== "string" || item[field].length > (["device", "project", "appVersion"].includes(field) ? 200 : 10000))) throw new Error();
        }
        if (item.priority !== undefined && !["High", "Medium", "Low"].includes(item.priority)) throw new Error();
        return { id: item.id, title: item.title, project: item.project ?? "General", appVersion: item.appVersion ?? "", status: item.status, device: item.device ?? "", steps: item.steps ?? "", expectedResult: item.expectedResult ?? "", priority: item.priority ?? "Medium", actualResult: item.actualResult ?? "", bugNotes: item.bugNotes ?? "" };
      });
      const existing = new Set(testCases.map(item => item.id));
      const additions = imported.filter(item => !existing.has(item.id));
      const merged = [...testCases, ...additions];
      localStorage.setItem("mobile-qa-test-cases", JSON.stringify(merged));
      setTestCases(merged);
      setNotice(`${additions.length} cases restored. Existing cases were kept.`);
    } catch { setNotice("Could not restore. Use a valid PocketQA backup and check browser storage space."); }
  }

  function deleteTestCase(id: string) {
    const item = testCases.find(item => item.id === id);
    if (item) setDeleted(previous => [...previous, item]);
    if (editingId === id) { resetForm(); }
    setTestCases((previous) =>
      previous.filter((testCase) => testCase.id !== id)
    );
  }

  function updateStatus(id: string, status: TestStatus) {
    setTestCases((previous) =>
      previous.map((testCase) =>
        testCase.id === id ? { ...testCase, status } : testCase
      )
    );
  }

  const statuses: TestStatus[] = ["Pass", "Fail", "Blocked", "Not Run"];
  const completed = testCases.filter(item => item.status === "Pass" || item.status === "Fail").length;
  const progress = testCases.length ? Math.round(completed / testCases.length * 100) : 0;
  const visible = testCases.filter(item => [item.title, item.project, item.appVersion, item.device, item.steps, item.expectedResult, item.actualResult, item.bugNotes].join(" ").toLowerCase().includes(search.toLowerCase()) && (filter === "All" || item.status === filter) && (!deviceFilter || item.device === deviceFilter) && (!projectFilter || item.project === projectFilter) && (!versionFilter || item.appVersion === versionFilter));

  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark">Q</span>Pocket<span>QA</span></a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <div className="nav-active"><span>▦</span> Test dashboard <span className="nav-count">{testCases.length}</span></div>
        <div className="sidebar-bottom"><span className="avatar">MQ</span><div>My QA workspace<small>Manual testing</small></div><span className="online" /></div>
      </aside>
      <div className="content">
        <header className="topbar"><span>Workspace <span className="slash">/</span> <b>Overview</b></span><span className="local-badge"><i /> Browser storage</span></header>
        <main>
          <div className="page-heading"><div><div className="eyebrow">MOBILE QUALITY, AT A GLANCE</div><h1>Testing overview<span>.</span></h1><p>A little more confidence with every test.</p></div><span className="mode-tag">Manual testing workspace</span></div>
          <section className="stats" aria-label="Test summary">
            {[{label:"Total cases",count:testCases.length,icon:"▦",tone:"purple"}, ...statuses.map(status => ({label:status,count:testCases.filter(item=>item.status===status).length,icon:({Pass:"✓",Fail:"×",Blocked:"!","Not Run":"◷"})[status],tone:({Pass:"green",Fail:"red",Blocked:"amber","Not Run":"gray"})[status]}))].map(card => <button type="button" className="stat-card" aria-pressed={filter === (card.label === "Total cases" ? "All" : card.label)} onClick={()=>setFilter(card.label === "Total cases" ? "All" : card.label)} key={card.label}><div className="stat-top"><span>{card.label}</span><span className={`stat-icon ${card.tone}`}>{card.icon}</span></div><strong>{card.count.toString().padStart(2,"0")}</strong><small>{card.label === "Total cases" ? "In your test library" : "Test cases"}</small></button>)}
          </section>
          <section className="progress-panel"><div className="progress-symbol">↗</div><div className="progress-copy"><b>Keep the momentum going</b><p>{completed} of {testCases.length} cases executed (Pass or Fail)</p></div><div className="progress-track"><div className="progress-label"><span>Execution progress</span><b>{progress}%</b></div><div className="track"><div style={{width:`${progress}%`}} /></div></div></section>
          <section className="panel create-panel"><div><h2>{editingId ? "Edit test case" : "Create a test case"}</h2><p>Start with a clear description of what you want to verify.</p></div><form className="case-form" onSubmit={event=>{event.preventDefault();addTestCase();}}><label className="field full" htmlFor="test-title">Test case title<input id="test-title" value={title} onChange={event=>setTitle(event.target.value)} placeholder="e.g. Verify login with valid credentials" maxLength={300} required /></label>
<label className="field" htmlFor="project">Project / App<input id="project" list="project-names" maxLength={200} value={project} onChange={event=>setProject(event.target.value)} placeholder="e.g. Shopping app" /><datalist id="project-names">{[...new Set(testCases.map(item=>item.project))].map(value=><option key={value} value={value}/>)}</datalist></label>
<label className="field" htmlFor="app-version">App version / Build<input id="app-version" maxLength={200} value={appVersion} onChange={event=>setAppVersion(event.target.value)} placeholder="e.g. 1.2.0 (build 42)" /></label>
<label className="field full" htmlFor="device">Device &amp; OS <span>Optional</span><input id="device" value={device} onChange={event=>setDevice(event.target.value)} placeholder="e.g. Samsung Galaxy S24 · Android 14 · App v1.0" maxLength={200} /></label>
<label className="field" htmlFor="steps">Test steps <span>Optional</span><textarea id="steps" value={steps} onChange={event=>setSteps(event.target.value)} placeholder={"1. Open the app\n2. Enter valid credentials\n3. Tap Sign in"} rows={4} maxLength={10000}/></label>
<label className="field" htmlFor="expected">Expected result <span>Optional</span><textarea id="expected" value={expectedResult} onChange={event=>setExpectedResult(event.target.value)} placeholder="User lands on the home screen with their account details visible." rows={4} maxLength={10000}/></label>
<label className="field" htmlFor="priority">Priority<select id="priority" value={priority} onChange={event=>setPriority(event.target.value)}>{["High", "Medium", "Low"].map(value=><option key={value}>{value}</option>)}</select></label>
<label className="field" htmlFor="actual">Actual result<textarea id="actual" rows={3} maxLength={10000} value={actualResult} onChange={event=>setActualResult(event.target.value)} placeholder="What happened during testing?" /></label>
<label className="field full" htmlFor="bug-notes">Bug notes / issue reference<textarea id="bug-notes" rows={2} maxLength={10000} value={bugNotes} onChange={event=>setBugNotes(event.target.value)} placeholder="Reproduction notes, severity, or issue URL" /></label>
<div className="form-actions full"><span className="form-hint">Saved in this browser. Add details now or edit later.</span><button className="primary" disabled={!title.trim()} type="submit">{editingId ? "Save changes" : "＋ Add test case"}</button>{editingId && <button type="button" className="secondary" onClick={()=>{resetForm();}}>Cancel</button>}</div></form></section>
          {saveError && <p role="alert" className="error">{saveError}</p>}
{notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss message">×</button></div>}
{deleted.length > 0 && <div className="notice" role="status">{deleted.length} deleted case(s) available to restore.<button onClick={()=>{setTestCases(previous=>[...previous,...deleted.filter(item=>!previous.some(current=>current.id===item.id))]);setDeleted([]);}}>Undo delete</button></div>}
<div className="backup-bar"><span>Keep a backup before clearing browser data.</span><button className="secondary" onClick={downloadBackup}>↓ JSON backup</button><label className="secondary import-label">↑ Restore backup<input type="file" accept=".json,application/json" onChange={event=>{void restoreBackup(event.target.files?.[0]);event.target.value="";}} /></label><button className="secondary" onClick={()=>window.print()}>Print report</button></div>
          <section className="panel library"><div className="library-heading"><div><h2>Test case library <span className="count-pill">{testCases.length}</span></h2><p>Your checks, results, and next steps in one place.</p></div><button type="button" className="secondary" disabled={!testCases.length} onClick={exportCsv}>↓ Export all CSV</button></div><div className="toolbar"><label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search test cases" placeholder="Search test cases…" value={search} onChange={event=>setSearch(event.target.value)} /></label><select aria-label="Filter status" value={filter} onChange={event=>setFilter(event.target.value)}><option value="All">All statuses</option>{statuses.map(status=><option key={status}>{status}</option>)}</select><select aria-label="Filter device" value={deviceFilter} onChange={event=>setDeviceFilter(event.target.value)}><option value="">All devices</option>{[...new Set(testCases.map(item=>item.device).filter(Boolean))].map(value=><option key={value}>{value}</option>)}</select><select aria-label="Filter project" value={projectFilter} onChange={event=>{setProjectFilter(event.target.value);setVersionFilter("");}}><option value="">All projects</option>{[...new Set(testCases.map(item=>item.project))].map(value=><option key={value}>{value}</option>)}</select><select aria-label="Filter version" value={versionFilter} onChange={event=>setVersionFilter(event.target.value)}><option value="">All versions</option>{[...new Set(testCases.filter(item=>!projectFilter || item.project===projectFilter).map(item=>item.appVersion).filter(Boolean))].map(value=><option key={value}>{value}</option>)}</select><button type="button" className="clear-filters" onClick={()=>{setSearch("");setFilter("All");setDeviceFilter("");setProjectFilter("");setVersionFilter("");}}>Clear filters</button><span className="results-count">{visible.length} results</span></div><div className="table-scroll"><table><thead><tr><th>CASE ID</th><th>TEST CASE</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(testCase=><tr key={testCase.id}><td className="case-id">TC-{testCase.id.slice(0,8).toUpperCase()}</td><td><span className="case-title">{testCase.title}</span><span className="project-tag">{testCase.project}{testCase.appVersion ? ` · ${testCase.appVersion}` : ""}</span><span className={`priority-tag priority-${testCase.priority.toLowerCase()}`}>{testCase.priority} priority</span>{testCase.device && <span className="device-chip">▯ {testCase.device}</span>}{(testCase.steps || testCase.expectedResult || testCase.actualResult || testCase.bugNotes) && <details className="case-details"><summary>View test details</summary>{testCase.steps && <div><b>Test steps</b><p>{testCase.steps}</p></div>}{testCase.expectedResult && <div><b>Expected result</b><p>{testCase.expectedResult}</p></div>}{testCase.actualResult && <div><b>Actual result</b><p>{testCase.actualResult}</p></div>}{testCase.bugNotes && <div><b>Bug notes</b><p>{testCase.bugNotes}</p></div>}</details>}</td><td><select className={`status-select ${testCase.status.toLowerCase().replace(" ","-")}`} aria-label={`Status for ${testCase.title}`} value={testCase.status} onChange={event=>{if(isTestStatus(event.target.value))updateStatus(testCase.id,event.target.value);}}>{["Not Run", "Pass", "Fail", "Blocked"].map(status=><option key={status}>{status}</option>)}</select></td><td><div className="row-actions"><button type="button" className="edit" aria-label={`Edit ${testCase.title}`} onClick={()=>{setEditingId(testCase.id);setTitle(testCase.title);setDevice(testCase.device);setSteps(testCase.steps);setExpectedResult(testCase.expectedResult);setProject(testCase.project);setAppVersion(testCase.appVersion);setPriority(testCase.priority);setActualResult(testCase.actualResult);setBugNotes(testCase.bugNotes);document.getElementById("test-title")?.focus();}}>Edit</button><button className="delete" aria-label={`Delete ${testCase.title}`} onClick={()=>deleteTestCase(testCase.id)}>Delete</button></div></td></tr>)}</tbody></table></div>{visible.length===0 && <div className="empty"><span>▤</span><h3>{testCases.length ? "No matching cases" : "Your next great test starts here"}</h3><p>{testCases.length ? "Try another search or status filter." : "Add your first test case above to start tracking quality."}</p></div>}<div className="table-footer">{visible.length} of {testCases.length} test cases<span>Made for thoughtful testing.</span></div></section>
          <footer className="page-footer">PocketQA <span>•</span> Your personal mobile testing workspace</footer>
        </main>
      </div>
    </div>
  );
}

export default App;





