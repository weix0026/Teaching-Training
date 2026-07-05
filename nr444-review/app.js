const baseQuestions = normalizeQuestions(Array.isArray(window.NR444_QUESTIONS) ? window.NR444_QUESTIONS : []);
let questions = cloneQuestions(baseQuestions);
let teacherUnlocked = false;

const state = {
  query: "",
  module: "All",
  mode: "student",
  sort: "recent",
  selectedId: null,
  visibleCount: 60,
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  moduleList: document.querySelector("#moduleList"),
  moduleCount: document.querySelector("#moduleCount"),
  sortSelect: document.querySelector("#sortSelect"),
  questionList: document.querySelector("#questionList"),
  resultsTitle: document.querySelector("#resultsTitle"),
  resultsMeta: document.querySelector("#resultsMeta"),
  heroStats: document.querySelector("#heroStats"),
  randomButton: document.querySelector("#randomButton"),
  clearButton: document.querySelector("#clearButton"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  teacherSidebar: document.querySelector("#teacherSidebar"),
  teacherPanel: document.querySelector("#teacherPanel"),
  teacherForm: document.querySelector("#teacherForm"),
  cleanIdField: document.querySelector("#cleanIdField"),
  oldIdField: document.querySelector("#oldIdField"),
  moduleField: document.querySelector("#moduleField"),
  sourceLabelField: document.querySelector("#sourceLabelField"),
  sourceRelField: document.querySelector("#sourceRelField"),
  sourceFileField: document.querySelector("#sourceFileField"),
  originalPromptField: document.querySelector("#originalPromptField"),
  promptField: document.querySelector("#promptField"),
  responseField: document.querySelector("#responseField"),
  cleaningNoteField: document.querySelector("#cleaningNoteField"),
  newRecordButton: document.querySelector("#newRecordButton"),
  exportButton: document.querySelector("#exportButton"),
  saveRecordButton: document.querySelector("#saveRecordButton"),
  deleteRecordButton: document.querySelector("#deleteRecordButton"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  modeButtons: [...document.querySelectorAll("[data-mode]")],
};

function normalizeQuestions(items) {
  return items.map((item, index) => normalizeQuestion(item, index + 1)).sort((a, b) => a.clean_id - b.clean_id);
}

function normalizeQuestion(item, fallbackId) {
  const cleanId = Number(item?.clean_id ?? fallbackId);
  return {
    clean_id: Number.isFinite(cleanId) ? cleanId : fallbackId,
    old_id: String(item?.old_id ?? ""),
    prompt: String(item?.prompt ?? ""),
    response: String(item?.response ?? ""),
    source_file: String(item?.source_file ?? ""),
    source_rel: String(item?.source_rel ?? ""),
    source_label: String(item?.source_label ?? ""),
    module: String(item?.module ?? ""),
    original_prompt: String(item?.original_prompt ?? ""),
    cleaning_note: String(item?.cleaning_note ?? ""),
  };
}

function nextCleanId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.clean_id) || 0), 0) + 1;
}

function cloneQuestions(items) {
  return items.map((item, index) => normalizeQuestion(item, index + 1));
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function uniqueModules(items) {
  return [...new Set(items.map((item) => item.module).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function computeStats(items) {
  const modules = uniqueModules(items);
  const sources = new Set(items.map((item) => item.source_rel || item.source_file || item.source_label));
  return {
    total: items.length,
    modules: modules.length,
    sources: sources.size,
  };
}

function matches(item) {
  const q = normalize(state.query);
  const moduleOk = state.module === "All" || item.module === state.module;
  if (!moduleOk) return false;
  if (!q) return true;
  const haystack = [
    item.prompt,
    item.response,
    item.original_prompt,
    item.source_file,
    item.source_rel,
    item.source_label,
    item.module,
  ]
    .map(normalize)
    .join(" | ");
  return haystack.includes(q);
}

function sorted(items) {
  const copy = [...items];
  if (state.sort === "module") {
    return copy.sort((a, b) => {
      const moduleCompare = a.module.localeCompare(b.module);
      if (moduleCompare !== 0) return moduleCompare;
      return a.clean_id - b.clean_id;
    });
  }
  if (state.sort === "source") {
    return copy.sort((a, b) => {
      const sourceCompare = (a.source_label || "").localeCompare(b.source_label || "");
      if (sourceCompare !== 0) return sourceCompare;
      return a.clean_id - b.clean_id;
    });
  }
  return copy.sort((a, b) => b.clean_id - a.clean_id);
}

function filteredItems() {
  return sorted(questions.filter(matches));
}

function selectedItem(items) {
  if (!items.length) return null;
  const found = items.find((item) => item.clean_id === state.selectedId);
  return found || items[0];
}

function renderHeroStats(items) {
  const stats = computeStats(items);
  els.heroStats.innerHTML = `
    <div class="hero-stat"><span>Questions</span><strong>${stats.total.toLocaleString()}</strong></div>
    <div class="hero-stat"><span>Modules</span><strong>${stats.modules}</strong></div>
    <div class="hero-stat"><span>Sources</span><strong>${stats.sources}</strong></div>
    <div class="hero-stat"><span>Mode</span><strong>${state.mode}</strong></div>
  `;
}

function renderModules(items) {
  const modules = ["All", ...uniqueModules(items)];
  els.moduleCount.textContent = `${modules.length - 1} modules`;
  els.moduleList.innerHTML = modules
    .map(
      (module) => `
        <button class="module-chip ${module === state.module ? "active" : ""}" data-module="${module}" type="button">
          ${escapeHtml(module)}
        </button>
      `,
    )
    .join("");
}

function renderResults() {
  const visible = filteredItems();
  const active = selectedItem(visible);
  const title = state.module === "All" ? "All questions" : `${state.module} questions`;
  els.resultsTitle.textContent = title;
  const searchBit = state.query ? ` for "${state.query}"` : "";
  els.resultsMeta.textContent = `${visible.length.toLocaleString()} matching question(s)${searchBit}.`;

  const shown = visible.slice(0, state.visibleCount);
  els.questionList.innerHTML = shown
    .map(
      (item) => `
        <article class="question-card ${active && active.clean_id === item.clean_id ? "active" : ""}" data-id="${item.clean_id}">
          <div class="card-top">
            <span class="module-pill">${escapeHtml(item.module)}</span>
            <span class="source-pill">${escapeHtml(item.source_label)}</span>
          </div>
          <h3>${escapeHtml(item.prompt)}</h3>
          <div class="inline-answer">
            <div class="inline-section">
              <span class="inline-label">Response</span>
              <div class="inline-text">${escapeHtml(item.response)}</div>
            </div>
            <div class="inline-section">
              <span class="inline-label">Sources</span>
              <div class="inline-text">
                ${escapeHtml(item.source_label)}<br>
                ${escapeHtml(item.source_file || item.source_rel || "")}<br>
                ${escapeHtml(item.original_prompt || item.prompt)}
              </div>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  els.loadMoreButton.style.display = visible.length > shown.length ? "inline-flex" : "none";
  els.loadMoreButton.textContent = `Load more (${Math.min(state.visibleCount, visible.length)} / ${visible.length})`;

  if (active) {
    state.selectedId = active.clean_id;
    renderTeacherPanel(active);
  }
}

function hideTeacherPanel() {
  els.teacherSidebar.hidden = true;
  els.teacherPanel.hidden = true;
  els.teacherForm.reset();
}

function renderTeacherPanel(item) {
  if (state.mode !== "teacher" || !teacherUnlocked || !item) {
    hideTeacherPanel();
    return;
  }

  els.teacherSidebar.hidden = false;
  els.teacherPanel.hidden = false;
  els.cleanIdField.value = String(item.clean_id);
  els.oldIdField.value = item.old_id;
  els.moduleField.value = item.module;
  els.sourceLabelField.value = item.source_label;
  els.sourceRelField.value = item.source_rel;
  els.sourceFileField.value = item.source_file;
  els.originalPromptField.value = item.original_prompt;
  els.promptField.value = item.prompt;
  els.responseField.value = item.response;
  els.cleaningNoteField.value = item.cleaning_note;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function snippet(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  return cleaned.length > 170 ? `${cleaned.slice(0, 170).trim()}...` : cleaned;
}

function applyState() {
  renderHeroStats(questions);
  renderModules(questions);
  renderResults();
  const teacherOpen = state.mode === "teacher" && teacherUnlocked;
  document.body.classList.toggle("teacher-open", teacherOpen);
  document.body.classList.toggle("teacher-closed", !teacherOpen);
  els.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  if (!teacherOpen) hideTeacherPanel();
}

function selectQuestion(id) {
  state.selectedId = id;
  const visible = filteredItems();
  const item = visible.find((row) => row.clean_id === id);
  if (item) {
    renderTeacherPanel(item);
  }
}

function jumpRandom() {
  const visible = filteredItems();
  if (!visible.length) return;
  const chosen = visible[Math.floor(Math.random() * visible.length)];
  state.selectedId = chosen.clean_id;
  renderResults();
  document.querySelector(`.question-card[data-id="${chosen.clean_id}"]`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function clearFilters() {
  state.query = "";
  state.module = "All";
  state.mode = "student";
  state.sort = "recent";
  state.visibleCount = 60;
  els.searchInput.value = "";
  els.sortSelect.value = "recent";
  applyState();
}

function createBlankRecord() {
  const moduleFallback = state.module !== "All" ? state.module : (questions[0]?.module || "Uncategorized");
  const item = normalizeQuestion(
    {
      clean_id: nextCleanId(questions),
      old_id: "",
      prompt: "New question",
      response: "New response",
      source_file: "",
      source_rel: "",
      source_label: "Teacher added",
      module: moduleFallback,
      original_prompt: "New question",
      cleaning_note: "added in teacher mode",
    },
    nextCleanId(questions),
  );
  questions = [...questions, item];
  state.selectedId = item.clean_id;
  state.mode = "teacher";
  applyState();
  document.querySelector(`.question-card[data-id="${item.clean_id}"]`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function commitCurrentRecord(validate) {
  const selected = questions.find((item) => item.clean_id === state.selectedId);
  if (!selected) return false;

  const updated = recordFromForm(selected);
  if (validate && (!updated.prompt.trim() || !updated.response.trim())) {
    window.alert("Prompt and response are required before saving.");
    return false;
  }

  questions = questions.map((item) => (item.clean_id === updated.clean_id ? updated : item));
  state.selectedId = updated.clean_id;
  return true;
}

function recordFromForm(existing) {
  return normalizeQuestion(
    {
      ...existing,
      old_id: els.oldIdField.value.trim(),
      module: els.moduleField.value.trim(),
      source_label: els.sourceLabelField.value.trim(),
      source_rel: els.sourceRelField.value.trim(),
      source_file: els.sourceFileField.value.trim(),
      original_prompt: els.originalPromptField.value.trim(),
      prompt: els.promptField.value.trim(),
      response: els.responseField.value.trim(),
      cleaning_note: els.cleaningNoteField.value.trim(),
    },
    existing.clean_id,
  );
}

function saveCurrentRecord() {
  if (!commitCurrentRecord(true)) return;
  applyState();
}

function deleteCurrentRecord() {
  const selected = questions.find((item) => item.clean_id === state.selectedId);
  if (!selected) return;

  const ok = window.confirm(`Delete record ${selected.clean_id}? This cannot be undone here.`);
  if (!ok) return;

  const remaining = questions.filter((item) => item.clean_id !== selected.clean_id);
  questions = remaining.length ? remaining : [];
  const visible = filteredItems();
  state.selectedId = visible[0]?.clean_id ?? questions[0]?.clean_id ?? null;
  if (!questions.length) {
    state.selectedId = null;
  }
  applyState();
}

function resetLocalCopy() {
  const ok = window.confirm("Discard session edits and restore the base dataset?");
  if (!ok) return;
  questions = cloneQuestions(baseQuestions);
  state.selectedId = questions[0]?.clean_id ?? null;
  state.visibleCount = 60;
  state.mode = "student";
  applyState();
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportQuestions() {
  const payload = `window.NR444_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`;
  downloadText("questions.js", payload, "text/javascript");
}

function unlockTeacherMode() {
  const entered = window.prompt("Enter teacher password:");
  if (entered === null) return false;
  if (entered !== "123456") {
    window.alert("Incorrect password.");
    return false;
  }
  teacherUnlocked = true;
  return true;
}

function isEditableTarget(target) {
  return Boolean(target && target.closest("input, textarea, select, [contenteditable='true']"));
}

document.addEventListener("click", (event) => {
  const card = event.target.closest(".question-card");
  if (card) {
    selectQuestion(Number(card.dataset.id));
    return;
  }

  const moduleChip = event.target.closest("[data-module]");
  if (moduleChip) {
    state.module = moduleChip.dataset.module;
    state.visibleCount = 60;
    applyState();
    return;
  }

  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    if (modeButton.dataset.mode === "teacher" && !teacherUnlocked && !unlockTeacherMode()) {
      return;
    }
    state.mode = modeButton.dataset.mode;
    applyState();
    return;
  }
});

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  state.visibleCount = 60;
  applyState();
});

els.sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  state.visibleCount = 60;
  applyState();
});

els.clearButton.addEventListener("click", clearFilters);
els.randomButton.addEventListener("click", jumpRandom);
els.loadMoreButton.addEventListener("click", () => {
  state.visibleCount = Math.min(state.visibleCount + 60, questions.length);
  applyState();
});
els.newRecordButton.addEventListener("click", createBlankRecord);
els.exportButton.addEventListener("click", exportQuestions);
els.resetSessionButton.addEventListener("click", resetLocalCopy);
els.deleteRecordButton.addEventListener("click", deleteCurrentRecord);
els.teacherForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentRecord();
});
els.teacherForm.addEventListener("input", () => {
  commitCurrentRecord(false);
});

document.addEventListener("keydown", (event) => {
  if (isEditableTarget(event.target)) return;
});

function boot() {
  if (questions.length) {
    state.selectedId = questions[0].clean_id;
  }
  applyState();
}

boot();
