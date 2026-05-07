(() => {
  const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
  const TIMES = [
    { id: "am10", label: "10" },
    { id: "am11", label: "11" },
    { id: "pm12", label: "12" },
    { id: "pm1", label: "1" },
    { id: "pm2", label: "2" },
    { id: "pm3", label: "3" },
    { id: "pm4", label: "4" },
    { id: "pm5", label: "5" },
    { id: "pm6", label: "6" },
    { id: "pm7", label: "7" },
    { id: "pm8", label: "8" },
    { id: "pm9", label: "9" },
    { id: "pm10", label: "10" }
  ];
  const STORAGE_KEY = "fitness-scheduler-state-v1";
  const DEFAULT_MEMBERS = [
    { id: "m-baek", name: "백지원", phone: "010-5038-5730", available: [] },
    { id: "m-shin", name: "신진선", phone: "", available: [] },
    { id: "m-kim", name: "김영희", phone: "", available: [] }
  ];

  const TEXT = {
    memberList: "회원목록",
    addMember: "회원 추가 +",
    businessHours: "운영시간 등록",
    saveImage: "이미지로 저장",
    resetSchedule: "스케줄 초기화",
    resetAll: "전체 정보 초기화",
    businessTitle: "운영시간 등록",
    businessHelp: "휴무 시간을 클릭하세요. 범위 드래그 가능",
    memberHelp: "가능한 시간을 클릭하세요. 범위 드래그 가능",
    save: "저장",
    close: "닫기",
    deleteMember: "회원 삭제",
    select: "선택",
    available: "가능",
    clearAssignment: "배정 해제",
    namePlaceholder: "회원 이름",
    phonePlaceholder: "전화번호",
    noCandidates: "이 시간에 가능한 회원이 없습니다.",
    closedCell: "휴무",
    confirmScheduleReset: "확정된 스케줄을 모두 초기화할까요? 회원 가능시간 정보는 유지됩니다.",
    confirmAllReset: "전체 저장 정보를 초기화할까요? 회원목록도 기본값으로 돌아갑니다.",
    confirmDelete: "회원을 삭제할까요?",
    imageTitle: "피트니스 주간 스케줄"
  };

  let state = loadState();
  let selectedMemberId = state.members[0]?.id || null;
  let activePopover = null;
  let dragMode = null;

  const app = document.querySelector("#app");
  renderApp();

  function blankState() {
    return {
      members: DEFAULT_MEMBERS.map(member => ({ ...member, available: [] })),
      closed: [],
      assignments: {}
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.members)) return blankState();
      return {
        members: saved.members.map(member => ({
          id: member.id,
          name: member.name,
          phone: member.phone || "",
          available: Array.isArray(member.available) ? member.available : []
        })),
        closed: Array.isArray(saved.closed) ? saved.closed : [],
        assignments: saved.assignments && typeof saved.assignments === "object" ? saved.assignments : {}
      };
    } catch {
      return blankState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderApp() {
    app.innerHTML = `
      <main class="app-shell">
        <section class="workspace">
          <aside class="member-panel">
            <h1 class="panel-title">${TEXT.memberList}</h1>
            <div class="member-list" id="memberList"></div>
          </aside>
          <section class="schedule-panel">
            <div class="schedule-grid" id="scheduleGrid"></div>
          </section>
        </section>
        <nav class="toolbar" aria-label="작업">
          <button class="primary" id="addMember">${TEXT.addMember}</button>
          <button class="soft" id="businessHours">${TEXT.businessHours}</button>
          <button class="soft" id="saveImage">${TEXT.saveImage}</button>
          <button class="danger" id="resetSchedule">${TEXT.resetSchedule}</button>
          <button class="danger" id="resetAll">${TEXT.resetAll}</button>
        </nav>
      </main>
    `;

    app.querySelector("#addMember").addEventListener("click", () => openMemberDialog());
    app.querySelector("#businessHours").addEventListener("click", openBusinessDialog);
    app.querySelector("#saveImage").addEventListener("click", saveScheduleImage);
    app.querySelector("#resetSchedule").addEventListener("click", resetSchedule);
    app.querySelector("#resetAll").addEventListener("click", resetAll);
    document.addEventListener("pointerdown", closePopoverOnOutside, { capture: true });

    renderMembers();
    renderSchedule();
  }

  function renderMembers() {
    const list = app.querySelector("#memberList");
    list.innerHTML = "";
    state.members.forEach(member => {
      const button = document.createElement("button");
      button.className = `member-row${member.id === selectedMemberId ? " is-active" : ""}`;
      button.type = "button";
      button.innerHTML = `
        <span class="member-name">${escapeHtml(member.name)}</span>
        <span class="badges">${memberBadges(member.id).map(label => `<span class="badge">${label}</span>`).join("")}</span>
      `;
      button.addEventListener("click", () => {
        selectedMemberId = member.id;
        renderMembers();
        openMemberDialog(member.id);
      });
      list.appendChild(button);
    });
  }

  function renderSchedule() {
    const grid = app.querySelector("#scheduleGrid");
    grid.innerHTML = "";
    grid.appendChild(cell("", "cell header"));
    DAYS.forEach(day => grid.appendChild(cell(day, "cell header")));

    TIMES.forEach(time => {
      grid.appendChild(cell(time.label, "cell time"));
      DAYS.forEach(day => {
        const key = cellKey(day, time.id);
        const assigned = getAssignedMember(key);
        const slot = cell(assigned ? assigned.name : closedLabel(key), slotClass(key, assigned));
        slot.dataset.key = key;
        slot.dataset.day = day;
        slot.dataset.time = time.label;
        if (assigned) {
          slot.innerHTML = `<span class="assignment-name">${escapeHtml(assigned.name)}</span>`;
        }
        slot.addEventListener("click", event => openSlotPopover(event.currentTarget));
        grid.appendChild(slot);
      });
    });
  }

  function cell(content, className) {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = content;
    return div;
  }

  function slotClass(key, assigned) {
    const classes = ["cell", "slot"];
    if (isClosed(key)) classes.push("closed");
    if (assigned) classes.push("assigned");
    return classes.join(" ");
  }

  function closedLabel(key) {
    return isClosed(key) ? TEXT.closedCell : "";
  }

  function openSlotPopover(target) {
    const key = target.dataset.key;
    if (isClosed(key)) return;
    closePopover();
    const [day, timeId] = parseKey(key);
    const assigned = getAssignedMember(key);
    const candidates = state.members.filter(member => member.available.includes(key));
    const popover = document.createElement("aside");
    popover.className = "popover";
    popover.innerHTML = `<p class="popover-title">${day} ${timeLabel(timeId)} ${TEXT.available}</p>`;

    if (assigned) {
      const clear = document.createElement("button");
      clear.className = "danger";
      clear.type = "button";
      clear.textContent = TEXT.clearAssignment;
      clear.addEventListener("click", () => {
        delete state.assignments[key];
        saveState();
        closePopover();
        renderMembers();
        renderSchedule();
      });
      popover.appendChild(clear);
    }

    if (!candidates.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = TEXT.noCandidates;
      popover.appendChild(empty);
    }

    candidates.forEach(member => {
      const row = document.createElement("div");
      row.className = "candidate";
      row.innerHTML = `<strong>${escapeHtml(member.name)}</strong>`;
      const button = document.createElement("button");
      button.className = "primary";
      button.type = "button";
      button.textContent = TEXT.select;
      button.addEventListener("click", () => assignMember(key, member.id));
      row.appendChild(button);
      popover.appendChild(row);
    });

    document.body.appendChild(popover);
    positionPopover(popover, target);
    activePopover = popover;
  }

  function positionPopover(popover, target) {
    const rect = target.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 32);
    const preferRight = rect.left + rect.width + width + 16 < window.innerWidth;
    const left = preferRight ? rect.right + 8 : Math.max(16, rect.left - width - 8);
    const top = Math.min(rect.top, window.innerHeight - popover.offsetHeight - 16);
    popover.style.left = `${Math.max(16, left)}px`;
    popover.style.top = `${Math.max(16, top)}px`;
    popover.style.width = `${width}px`;
  }

  function closePopoverOnOutside(event) {
    if (!activePopover) return;
    if (activePopover.contains(event.target) || event.target.closest(".slot")) return;
    closePopover();
  }

  function closePopover() {
    activePopover?.remove();
    activePopover = null;
  }

  function assignMember(key, memberId) {
    state.assignments[key] = memberId;
    selectedMemberId = memberId;
    saveState();
    closePopover();
    renderMembers();
    renderSchedule();
  }

  function openBusinessDialog() {
    openTimeDialog({
      title: TEXT.businessTitle,
      help: TEXT.businessHelp,
      selected: new Set(state.closed),
      modeClass: "closed",
      onSave: selected => {
        state.closed = [...selected];
        Object.keys(state.assignments).forEach(key => {
          if (selected.has(key)) delete state.assignments[key];
        });
        saveState();
        renderMembers();
        renderSchedule();
      }
    });
  }

  function openMemberDialog(memberId) {
    const isNew = !memberId;
    const member = isNew ? { id: createId(), name: "", phone: "", available: [] } : state.members.find(item => item.id === memberId);
    if (!member) return;
    const selected = new Set(member.available);
    const overlay = dialogShell(isNew ? TEXT.addMember : member.name, TEXT.memberHelp);
    const dialog = overlay.querySelector(".dialog");
    const form = document.createElement("div");
    form.className = "form-row";
    form.innerHTML = `
      <input class="text-field" id="memberName" value="${escapeAttr(member.name)}" placeholder="${TEXT.namePlaceholder}">
      <input class="text-field" id="memberPhone" value="${escapeAttr(member.phone)}" placeholder="${TEXT.phonePlaceholder}">
    `;
    dialog.insertBefore(form, dialog.querySelector(".edit-grid"));
    wireTimeGrid(dialog.querySelector(".edit-grid"), selected, "available", key => isClosed(key));

    const actions = dialog.querySelector(".dialog-actions");
    if (!isNew) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "danger";
      deleteButton.type = "button";
      deleteButton.textContent = TEXT.deleteMember;
      deleteButton.addEventListener("click", () => {
        if (!confirm(TEXT.confirmDelete)) return;
        state.members = state.members.filter(item => item.id !== member.id);
        Object.keys(state.assignments).forEach(key => {
          if (state.assignments[key] === member.id) delete state.assignments[key];
        });
        selectedMemberId = state.members[0]?.id || null;
        saveState();
        overlay.remove();
        renderMembers();
        renderSchedule();
      });
      actions.prepend(deleteButton);
    }

    dialog.querySelector("[data-save]").addEventListener("click", () => {
      const name = dialog.querySelector("#memberName").value.trim();
      const phone = dialog.querySelector("#memberPhone").value.trim();
      if (!name) {
        dialog.querySelector("#memberName").focus();
        return;
      }
      member.name = name;
      member.phone = phone;
      member.available = [...selected].filter(key => !isClosed(key));
      if (isNew) state.members.push(member);
      selectedMemberId = member.id;
      saveState();
      overlay.remove();
      renderMembers();
      renderSchedule();
    });
  }

  function openTimeDialog({ title, help, selected, modeClass, onSave }) {
    const overlay = dialogShell(title, help);
    const dialog = overlay.querySelector(".dialog");
    wireTimeGrid(dialog.querySelector(".edit-grid"), selected, modeClass);
    dialog.querySelector("[data-save]").addEventListener("click", () => {
      onSave(selected);
      overlay.remove();
    });
  }

  function dialogShell(title, help) {
    closePopover();
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <section class="dialog" role="dialog" aria-modal="true">
        <header class="dialog-header">
          <div>
            <h2 class="dialog-title">${escapeHtml(title)}</h2>
            <p class="dialog-copy">${escapeHtml(help)}</p>
          </div>
          <button type="button" data-close>${TEXT.close}</button>
        </header>
        <div class="edit-grid"></div>
        <footer class="dialog-actions">
          <span></span>
          <span class="action-group">
            <button type="button" data-close>${TEXT.close}</button>
            <button type="button" class="primary" data-save>${TEXT.save}</button>
          </span>
        </footer>
      </section>
    `;
    overlay.addEventListener("pointerdown", event => {
      if (event.target === overlay) overlay.remove();
    });
    overlay.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => overlay.remove()));
    document.body.appendChild(overlay);
    return overlay;
  }

  function wireTimeGrid(grid, selected, modeClass, disabled = () => false) {
    grid.innerHTML = "";
    grid.appendChild(cell("", "cell header"));
    DAYS.forEach(day => grid.appendChild(cell(day, "cell header")));
    TIMES.forEach(time => {
      grid.appendChild(cell(time.label, "cell time"));
      DAYS.forEach(day => {
        const key = cellKey(day, time.id);
        const slot = cell("", `cell slot${selected.has(key) ? ` ${modeClass}` : ""}${disabled(key) ? " closed" : ""}`);
        slot.dataset.key = key;
        slot.addEventListener("pointerdown", event => {
          if (disabled(key)) return;
          event.preventDefault();
          dragMode = !selected.has(key);
          setSelection(slot, selected, modeClass, dragMode);
        });
        slot.addEventListener("pointerenter", () => {
          if (dragMode === null || disabled(key)) return;
          setSelection(slot, selected, modeClass, dragMode);
        });
        grid.appendChild(slot);
      });
    });
    document.addEventListener("pointerup", () => {
      dragMode = null;
    }, { once: true });
  }

  function setSelection(slot, selected, modeClass, shouldSelect) {
    const key = slot.dataset.key;
    if (shouldSelect) {
      selected.add(key);
      slot.classList.add(modeClass);
    } else {
      selected.delete(key);
      slot.classList.remove(modeClass);
    }
  }

  function resetSchedule() {
    if (!confirm(TEXT.confirmScheduleReset)) return;
    state.assignments = {};
    saveState();
    renderMembers();
    renderSchedule();
  }

  function resetAll() {
    if (!confirm(TEXT.confirmAllReset)) return;
    state = blankState();
    selectedMemberId = state.members[0]?.id || null;
    saveState();
    renderMembers();
    renderSchedule();
  }

  function saveScheduleImage() {
    const scale = 2;
    const width = 1200;
    const height = 860;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#fbf8ff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#563383";
    ctx.font = "800 30px system-ui, sans-serif";
    ctx.fillText(TEXT.imageTitle, 36, 52);

    const startX = 36;
    const startY = 86;
    const timeW = 70;
    const cellW = 150;
    const cellH = 52;
    drawRect(ctx, startX, startY, timeW + cellW * DAYS.length, cellH, "#eee3fb", "#bda6d8");
    DAYS.forEach((day, index) => drawText(ctx, day, startX + timeW + cellW * index + cellW / 2, startY + 33, "#563383", "center", "800 18px system-ui"));

    TIMES.forEach((time, row) => {
      const y = startY + cellH * (row + 1);
      drawRect(ctx, startX, y, timeW, cellH, "#eee3fb", "#d9cbe9");
      drawText(ctx, time.label, startX + timeW / 2, y + 32, "#563383", "center", "800 17px system-ui");
      DAYS.forEach((day, col) => {
        const key = cellKey(day, time.id);
        const x = startX + timeW + cellW * col;
        const assigned = getAssignedMember(key);
        const fill = isClosed(key) ? "#e4e0e8" : assigned ? "#ecf6df" : "#ffffff";
        drawRect(ctx, x, y, cellW, cellH, fill, "#d9cbe9");
        if (assigned) drawText(ctx, assigned.name, x + cellW / 2, y + 32, "#486627", "center", "800 17px system-ui");
        if (isClosed(key)) drawText(ctx, TEXT.closedCell, x + cellW / 2, y + 32, "#756d82", "center", "700 15px system-ui");
      });
    });

    const memberY = startY + cellH * (TIMES.length + 1) + 34;
    drawText(ctx, TEXT.memberList, 36, memberY, "#563383", "left", "800 22px system-ui");
    state.members.forEach((member, index) => {
      const y = memberY + 34 + index * 34;
      drawText(ctx, member.name, 36, y, "#252031", "left", "800 17px system-ui");
      drawText(ctx, memberBadges(member.id).join("  "), 170, y, "#5b4d19", "left", "700 15px system-ui");
    });

    const link = document.createElement("a");
    link.download = "fitness-schedule.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function drawRect(ctx, x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.strokeRect(x, y, w, h);
  }

  function drawText(ctx, text, x, y, color, align, font) {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.font = font;
    ctx.fillText(text, x, y);
  }

  function memberBadges(memberId) {
    return Object.entries(state.assignments)
      .filter(([, assignedId]) => assignedId === memberId)
      .map(([key]) => {
        const [day, timeId] = parseKey(key);
        return `${day} ${timeLabel(timeId)}`;
      });
  }

  function getAssignedMember(key) {
    const memberId = state.assignments[key];
    return state.members.find(member => member.id === memberId) || null;
  }

  function isClosed(key) {
    return state.closed.includes(key);
  }

  function cellKey(day, time) {
    return `${day}-${time}`;
  }

  function parseKey(key) {
    return key.split("-");
  }

  function timeLabel(timeId) {
    return TIMES.find(time => time.id === timeId)?.label || timeId;
  }

  function createId() {
    return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();
