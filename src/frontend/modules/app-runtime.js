(function () {
  const LOGIN_STORAGE_KEY = "audioTest.auth";
  window.audioTestAppRuntimeLoaded = true;
  const boundFetch = window.fetch.bind(window);
  const GUIDE_SEEN_STORAGE_KEY = "audioTest.guideSeenByUser";
  const GUIDE_FEATURE_VERSION = "cards-feature-pack-2026-03-21d";
  const LOGIN_TTL_MS = 5 * 60 * 1000;
  const AUTH_PING_MIN_INTERVAL_MS = 30 * 1000;
  const RESUME_CONTEXT_PERSIST_DELAY_MS = 250;
  const IDLE_AUTO_LOGOUT_STORAGE_KEY = "audioTest.idleAutoLogoutEnabled";
  const ALLOWED_USERS = ["zhaoying", "rhys"];
  const loginView = document.getElementById("login-view");
  const loginForm = document.getElementById("login-form");
  const loginUsername = document.getElementById("login-username");
  const loginPassword = document.getElementById("login-password");
  const loginButton = document.getElementById("login-button");
  const loginStatus = document.getElementById("login-status");
  const libraryView = document.getElementById("library-view");
  const logoutButton = document.getElementById("logout-button");
  const playerView = document.getElementById("player-view");
  const uploadButton = document.getElementById("upload-button");
  const backButton = document.getElementById("back-button");
  const input = document.getElementById("audio-file");
  const cards = document.getElementById("audio-cards");
  const emptyState = document.getElementById("empty-state");
  const saveStatus = document.getElementById("save-status");
  const moduleDashboard = document.getElementById("module-dashboard");
  const moduleGrid = document.getElementById("module-grid");
  const moduleStatus = document.getElementById("module-status");
  const ingestPanel = document.getElementById("ingest-panel");
  const fileName = document.getElementById("file-name");
  const audio = document.getElementById("audio");
  const progress = document.getElementById("progress");
  const progressTrackMain = document.getElementById("progress-track-main");
  const selectedSpanOverlay = document.getElementById("selected-span-overlay");
  const subSegOverlays = document.getElementById("subseg-overlays");
  const checkpointMarkers = document.getElementById("checkpoint-markers");
  const checkpointMagnifier = document.getElementById("checkpoint-magnifier");
  const checkpointMagnifierTime = document.getElementById("checkpoint-magnifier-time");
  const playhead = document.getElementById("playhead");
  const playheadTime = document.getElementById("playhead-time");
  const playerLoading = document.getElementById("player-loading");
  const targetProgressWrap = document.getElementById("target-progress-wrap");
  const targetProgress = document.getElementById("target-progress");
  const targetSpanOverlay = document.getElementById("target-span-overlay");
  const targetSubSegActiveFill = document.getElementById("target-subseg-active-fill");
  const targetCheckpointMarkers = document.getElementById("target-checkpoint-markers");
  const targetPlayhead = document.getElementById("target-playhead");
  const targetPlayheadTime = document.getElementById("target-playhead-time");
  const audSegNoteEditor = document.getElementById("audseg-note-editor");
  const playerSection = document.querySelector(".player");
  const subSegValuePanel = document.getElementById("subseg-value-panel");
  const subSegValueInput = document.getElementById("subseg-value-input");
  const subSegValueList = document.getElementById("subseg-value-list");
  const deleteConfirmDialog = document.getElementById("delete-confirm-dialog");
  const deleteConfirmText = document.getElementById("delete-confirm-text");
  const deleteConfirmCancel = document.getElementById("delete-confirm-cancel");
  const deleteConfirmDelete = document.getElementById("delete-confirm-delete");
  const guideButtonList = document.getElementById("guide-button-list");
  const modulesButton = document.getElementById("modules-button");
  const guideButtonPlayer = document.getElementById("guide-button-player");
  const guideOverlay = document.getElementById("guide-overlay");
  const guideSpotlight = document.getElementById("guide-spotlight");
  const guideTooltip = document.getElementById("guide-tooltip");
  const guideCloseButton = document.getElementById("guide-close-button");
  const guideStepTitle = document.getElementById("guide-step-title");
  const guideStepText = document.getElementById("guide-step-text");
  const guideLanguagePicker = document.getElementById("guide-language-picker");
  const guideLangEn = document.getElementById("guide-lang-en");
  const guideLangZh = document.getElementById("guide-lang-zh");
  const guidePrevButton = document.getElementById("guide-prev-button");
  const guideNextButton = document.getElementById("guide-next-button");
  const guideStepCounter = document.getElementById("guide-step-counter");
  const settingsButton = document.getElementById("settings-button");
  const settingsPopover = document.getElementById("settings-popover");
  const settingsLoggingCheckbox = document.getElementById("settings-logging-checkbox");
  const settingsIdleAutoLogoutCheckbox = document.getElementById("settings-idle-auto-logout-checkbox");
  const LOGGING_STORAGE_KEY = "audioTest.stateActionLoggingEnabled";

  function readLoggingPreference() {
    try {
      const raw = window.localStorage.getItem(LOGGING_STORAGE_KEY);
      if (raw === null || raw === undefined) {
        return true;
      }
      return String(raw).trim() !== "0" && String(raw).trim().toLowerCase() !== "false";
    } catch {
      return true;
    }
  }

  let loggingEnabled = readLoggingPreference();
  persistLoggingPreference(loggingEnabled);
  let idleAutoLogoutEnabled = readIdleAutoLogoutPreference();
  persistIdleAutoLogoutPreference(idleAutoLogoutEnabled);

  function readIdleAutoLogoutPreference() {
    try {
      const raw = window.localStorage.getItem(IDLE_AUTO_LOGOUT_STORAGE_KEY);
      if (raw === null || raw === undefined) {
        return true;
      }
      return String(raw).trim() !== "0" && String(raw).trim().toLowerCase() !== "false";
    } catch {
      return true;
    }
  }

  function persistIdleAutoLogoutPreference(enabled) {
    try {
      window.localStorage.setItem(IDLE_AUTO_LOGOUT_STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // Ignore storage failures.
    }
  }

  function persistLoggingPreference(enabled) {
    try {
      window.localStorage.setItem(LOGGING_STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // Ignore storage failures.
    }
    try {
      document.cookie = LOGGING_STORAGE_KEY + "=" + (enabled ? "1" : "0") + "; path=/; SameSite=Lax";
    } catch {
      // Ignore cookie failures.
    }
  }

  function isLoggingEnabled() {
    if (runtimeLogger && typeof runtimeLogger.getEnabled === "function") {
      return Boolean(runtimeLogger.getEnabled());
    }
    return Boolean(loggingEnabled);
  }

  function isSettingsPopoverOpen() {
    return Boolean(settingsPopover && !settingsPopover.classList.contains("hidden"));
  }

  function syncSettingsUi() {
    if (settingsLoggingCheckbox) {
      settingsLoggingCheckbox.checked = Boolean(isLoggingEnabled());
    }
    if (settingsIdleAutoLogoutCheckbox) {
      settingsIdleAutoLogoutCheckbox.checked = Boolean(idleAutoLogoutEnabled);
    }
    if (settingsButton) {
      settingsButton.setAttribute("aria-expanded", isSettingsPopoverOpen() ? "true" : "false");
    }
  }

  function openSettingsPopover() {
    if (!settingsPopover || !settingsButton || settingsButton.classList.contains("hidden")) {
      return;
    }
    settingsPopover.classList.remove("hidden");
    syncSettingsUi();
  }

  function closeSettingsPopover() {
    if (!settingsPopover) {
      return;
    }
    settingsPopover.classList.add("hidden");
    syncSettingsUi();
  }

  function toggleSettingsPopover() {
    if (isSettingsPopoverOpen()) {
      closeSettingsPopover();
      return;
    }
    openSettingsPopover();
  }

  async function setLoggingEnabled(nextEnabled) {
    const enabled = Boolean(nextEnabled);
    loggingEnabled = enabled;
    persistLoggingPreference(enabled);
    if (runtimeLogger && typeof runtimeLogger.setEnabled === "function") {
      await runtimeLogger.setEnabled({ data: { enabled }, deps: {} });
    }
    syncSettingsUi();
  }

  async function setIdleAutoLogoutEnabled(nextEnabled) {
    const enabled = Boolean(nextEnabled);
    const previousEnabled = Boolean(idleAutoLogoutEnabled);
    idleAutoLogoutEnabled = enabled;
    state.authIdleLogoutEnabled = enabled;
    persistIdleAutoLogoutPreference(enabled);
    logRuntimeAction("settings:idle-auto-logout-toggle", {
      enabled,
      previousEnabled,
      authUser: state.authUser,
      workspacePhase: state.workspacePhase
    });
    logRuntimeState("settings.idleAutoLogoutEnabled", previousEnabled, enabled);
    if (state.authUser && state.authToken) {
      state.lastActivityAt = Date.now();
      persistCurrentLoginActivity();
      scheduleAuthActivityTimers();
    }
    syncSettingsUi();
  }

  if (selectedSpanOverlay) {
    selectedSpanOverlay.addEventListener("click", handleSelectedSpanOverlayInteraction);
    selectedSpanOverlay.addEventListener("keydown", handleSelectedSpanOverlayInteraction);
  }
  if (playerSection) {
    playerSection.setAttribute("tabindex", "-1");
  }
  if (subSegValuePanel) {
    subSegValuePanel.setAttribute("tabindex", "-1");
  }

  const runtimeLogger = window.audioTestRuntimeLogger || null;
  function logRuntimeAction(label, detail) {
    if (runtimeLogger && typeof runtimeLogger.logAction === "function") {
      runtimeLogger.logAction(label, detail || {});
    }
  }

  function logRuntimeState(label, previous, next) {
    if (runtimeLogger && typeof runtimeLogger.logStateChange === "function") {
      runtimeLogger.logStateChange(label, previous, next);
    }
  }

  const initialState = {
    objectUrl: null,
    currentFile: null,
    activeAudioId: null,
    activeAudioUrl: null,
    pendingUpload: null,
    loadingSessionId: null,
    isListLoading: false,
    openMenuSessionId: null,
    sessionsCache: [],
    workspacePhase: "dashboard",
    moduleCardIndex: 0,
    ingestCardIndex: 0,
    checkpoints: [],
    subSegs: [],
    selectedSpanIndex: -1,
    targetSpanIndex: -1,
    targetStart: null,
    targetEnd: null,
    targetSubSegs: [],
    selectedTargetSubSegIndex: -1,
    activeSubSegValueKey: null,
    subSegValueEntries: {},
    subSegCardLiveValueOverrides: {},
    subSegCardCommitTimerIds: {},
    subSegCardInternalChangeGuards: {},
    subSegEnterChildSuppressionKey: "",
    subSegCardBubbleTargetIndexByKey: {},
    subSegCardFocusTransferStackByKey: {},
    subSegCardDeleteDialogKey: null,
    subSegValueNodeIdCounter: 0,
    subSegDraftHtmlByKey: {},
    audSegNoteEntries: {},
    audSegNoteEditorVisible: false,
    shiftHoldTss: null,
    hasAutoFocusedProgress: false,
    markerSignature: "",
    subSegSignature: "",
    targetMarkerSignature: "",
    isPlayerVisible: false,
    isPlayerLoading: false,
    checkpointDrag: null,
    checkpointPreviewTimerId: null,
    cycleLatch: { left: "", right: "" },
    authUser: null,
    authToken: null,
    authIdleTtlMs: LOGIN_TTL_MS,
    authIdleLogoutEnabled: idleAutoLogoutEnabled,
    activeSessionId: null,
    activeRevision: 0,
    saveQueue: Promise.resolve(),
    isPersisting: false,
    isGuideMode: false,
    guideStepIndex: -1,
    guideSteps: [],
    guideRafId: null,
    guideNavBlinkTimerId: null,
    guideNavBlinkIndex: 0,
    guideLanguage: "en",
    guidePhase: "list-language",
    guideTooltipLocked: false,
    deleteTargetType: "",
    deleteTargetIndex: -1,
    deleteConfirmOpen: false,
    guideFeatureBadgeVisible: false,
    guideFeatureSpotlightTimerId: null,
    authInactivityTimerId: null,
    authKeepAliveTimerId: null,
    lastActivityAt: 0,
    lastAuthPingAt: 0,
    resumeContextPersistTimerId: null,
    resumeContextRestoreInFlight: false
  };

  const state = runtimeLogger && typeof runtimeLogger.createStateProxy === "function"
    ? runtimeLogger.createStateProxy(initialState, { data: { path: "state" }, deps: {} })
    : initialState;

  const DEBUG_AUDIO = (function () {
    try {
      const qp = new URLSearchParams(window.location.search);
      if (qp.get("debugAudio") === "1") {
        return true;
      }
      return window.localStorage && window.localStorage.getItem("audioTest.debugAudio") === "1";
    } catch {
      return false;
    }
  })();
  const sessionRuntime = window.audioTestSessionRuntime || {};

  if (runtimeLogger && typeof runtimeLogger.install === "function") {
    runtimeLogger.install({ data: { state, sessionRuntime, enabled: loggingEnabled }, deps: {} });
  }

  function debugLog(label, detail) {
    if (!DEBUG_AUDIO || !isLoggingEnabled()) {
      return;
    }
    const stamp = new Date().toISOString();
    console.log("[audioTest][" + stamp + "] " + label + " " + formatDebugDetail(detail), detail || {});
  }

  function traceSubSegLog(label, detail) {
    if (!isLoggingEnabled()) {
      return;
    }
    const stamp = new Date().toISOString();
    console.log("[audioTest][" + stamp + "][subseg] " + label + " " + formatDebugDetail(detail), detail || {});
  }

  function formatDebugDetail(detail) {
    if (detail === null || detail === undefined) {
      return "{}";
    }
    if (typeof detail !== "object") {
      return String(detail);
    }
    try {
      return JSON.stringify(detail, function (key, value) {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack };
        }
        return value;
      });
    } catch {
      return "[unserializable detail]";
    }
  }

  const MODULE_CARD_DEFS = [
    {
      id: "INGEST",
      title: "INGEST",
      summary: "Current audio workflow",
      detail: "Open the audEp list, upload audio, and work through checkpoints and subSegs.",
      actionText: "Enter"
    },
    {
      id: "REVIEW",
      title: "REVIEW",
      summary: "Review workspace",
      detail: "Reserved for future review tools and user-specific inspection flows.",
      actionText: "Enter"
    },
    {
      id: "EXPORT",
      title: "EXPORT",
      summary: "Export workspace",
      detail: "Reserved for future export and handoff actions.",
      actionText: "Enter"
    },
    {
      id: "SETTINGS",
      title: "SETTINGS",
      summary: "Workspace settings",
      detail: "Reserved for future preferences and module configuration.",
      actionText: "Enter"
    }
  ];

  input.addEventListener("change", handleFileChange);
  loginForm.addEventListener("submit", handleLoginSubmit);
  if (subSegValueInput) {
    subSegValueInput.addEventListener("input", handleSubSegDraftInput);
    subSegValueInput.addEventListener("keydown", handleSubSegDraftKeyDown);
    subSegValueInput.addEventListener("beforeinput", handleSubSegRichEditorBeforeInput);
    subSegValueInput.addEventListener("focus", syncSubSegDraftEditorFocusState);
    subSegValueInput.addEventListener("blur", function () {
      commitSubSegDraftValue();
      window.requestAnimationFrame(syncSubSegDraftEditorFocusState);
    });
  }
  if (audSegNoteEditor) {
    audSegNoteEditor.addEventListener("input", handleAudSegNoteInput);
    audSegNoteEditor.addEventListener("keydown", handleAudSegNoteEditorKeyDown);
    audSegNoteEditor.addEventListener("beforeinput", handleAudSegNoteEditorBeforeInput);
    audSegNoteEditor.addEventListener("focus", syncAudSegEditorFocusState);
    audSegNoteEditor.addEventListener("blur", function () {
      window.requestAnimationFrame(syncAudSegEditorFocusState);
    });
  }
  if (deleteConfirmCancel) {
    deleteConfirmCancel.addEventListener("click", function () {
      closeDeleteConfirmDialog();
      setSaveStatus("Delete cancelled");
    });
  }
  if (deleteConfirmDelete) {
    deleteConfirmDelete.addEventListener("click", function () {
      confirmDeleteTarget();
    });
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogoutClick);
  }
  uploadButton.addEventListener("click", openFilePicker);
  backButton.addEventListener("click", goBackToLibrary);
  if (guideButtonList) {
    guideButtonList.addEventListener("click", function () {
      startGuideMode({ deps: {} });
    });
  }
  if (modulesButton) {
    modulesButton.addEventListener("click", function () {
      showLibraryView();
    });
  }
  if (guideButtonPlayer) {
    guideButtonPlayer.addEventListener("click", function () {
      startGuideMode({ deps: {} });
    });
  }
  if (guideCloseButton) {
    guideCloseButton.addEventListener("click", function () {
      stopGuideMode({ data: { reason: "closed" }, deps: {} });
    });
  }
  if (guidePrevButton) {
    guidePrevButton.addEventListener("click", function () {
      moveGuideStep({ data: { delta: -1 }, deps: {} });
    });
  }
  if (guideNextButton) {
    guideNextButton.addEventListener("click", function () {
      moveGuideStep({ data: { delta: 1 }, deps: {} });
    });
  }
  if (settingsButton) {
    settingsButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleSettingsPopover();
    });
  }
  if (settingsLoggingCheckbox) {
    settingsLoggingCheckbox.addEventListener("change", function (event) {
      void setLoggingEnabled(Boolean(event.target && event.target.checked));
    });
  }
  if (settingsIdleAutoLogoutCheckbox) {
    settingsIdleAutoLogoutCheckbox.addEventListener("change", function (event) {
      void setIdleAutoLogoutEnabled(Boolean(event.target && event.target.checked));
    });
  }
  if (guideOverlay) {
    guideOverlay.addEventListener("click", handleGuideOverlayClick);
  }
  if (guideLangEn) {
    guideLangEn.addEventListener("click", function () {
      setGuideLanguage({ data: { language: "en" }, deps: {} });
    });
  }
  if (guideLangZh) {
    guideLangZh.addEventListener("click", function () {
      setGuideLanguage({ data: { language: "zh" }, deps: {} });
    });
  }
  audio.addEventListener("loadedmetadata", updateUi);
  audio.addEventListener("timeupdate", updateUi);
  audio.addEventListener("durationchange", updateUi);
  audio.addEventListener("play", function () {
    debugLog("audio.play", { currentTime: audio.currentTime, duration: audio.duration });
  });
  audio.addEventListener("pause", function () {
    debugLog("audio.pause", { currentTime: audio.currentTime, duration: audio.duration });
  });
  audio.addEventListener("seeking", function () {
    debugLog("audio.seeking", { currentTime: audio.currentTime, duration: audio.duration });
  });
  audio.addEventListener("seeked", function () {
    debugLog("audio.seeked", { currentTime: audio.currentTime, duration: audio.duration });
  });
  window.addEventListener("keydown", handleKeyDown, { capture: true });
  window.addEventListener("keyup", handleKeyUp, { capture: true });
  window.addEventListener("mousemove", handleCheckpointDragMove, { capture: true });
  window.addEventListener("mouseup", handleCheckpointDragEnd, { capture: true });
  window.addEventListener("resize", handleGuideViewportChanged);
  window.addEventListener("scroll", handleGuideViewportChanged, { capture: true });
  document.addEventListener("click", handleGlobalClick);
  ["pointerdown", "keydown", "input", "wheel", "touchstart"].forEach(function (eventName) {
    window.addEventListener(eventName, handleAuthActivity, { capture: true });
  });

  syncSettingsUi();

  initialize();

  async function initialize() {
    fileName.textContent = "";
    setSaveStatus("Ready");
    progress.disabled = false;
    showLoginView();
    const restored = restoreLoginFromStorage();
    if (restored) {
      state.authUser = restored.username;
      state.authToken = restored.token;
      state.lastActivityAt = Number(restored.lastActivityAt || Date.now());
      state.authIdleTtlMs = LOGIN_TTL_MS;
      state.authIdleLogoutEnabled = idleAutoLogoutEnabled;
      state.lastAuthPingAt = 0;
      persistIdleAutoLogoutPreference(idleAutoLogoutEnabled);
      scheduleAuthActivityTimers();
      renderGuideFeatureBadge();
      setLoginStatus("Welcome back, " + restored.username + ".");
      showLibraryView();
      await loadPersistedAudioCards();
      if (state.authUser && state.authToken) {
        await restoreResumeContextAfterLogin(restored.username);
      }
      return;
    }
    renderGuideFeatureBadge();
    setLoginStatus("Log in to continue.");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameRaw = String(loginUsername.value || "").trim().toLowerCase();
    const password = String(loginPassword.value || "");
    logRuntimeAction("auth:login-submit", {
      username: usernameRaw,
      hasPassword: Boolean(password)
    });

    if (!usernameRaw || !password) {
      setLoginStatus("Username and password are required.", true);
      return;
    }
    if (ALLOWED_USERS.indexOf(usernameRaw) < 0) {
      setLoginStatus("User is not allowed.", true);
      return;
    }

    loginButton.disabled = true;
    setLoginStatus("Signing in...");
    try {
      const response = await boundFetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: usernameRaw,
          password
        })
      });

      if (!response.ok) {
        const detail = await response.text().catch(function () { return ""; });
        throw new Error("login_failed status=" + String(response.status) + " detail=" + detail);
      }

      const payload = await response.json();
      if (!payload || !payload.ok || !payload.username || !payload.token) {
        throw new Error("invalid_login_response");
      }

      const loggedInAt = Number.isFinite(Number(payload.loggedInAt)) ? Number(payload.loggedInAt) : Date.now();
      state.authIdleTtlMs = LOGIN_TTL_MS;
      state.authIdleLogoutEnabled = readIdleAutoLogoutPreference();
      idleAutoLogoutEnabled = state.authIdleLogoutEnabled;
      persistLogin({
        username: payload.username,
        token: payload.token,
        loggedInAt,
        ttlMs: state.authIdleLogoutEnabled ? LOGIN_TTL_MS : 0,
        lastActivityAt: Date.now()
      });

      state.authUser = payload.username;
      state.authToken = payload.token;
      state.lastActivityAt = Date.now();
      state.lastAuthPingAt = 0;
      scheduleAuthActivityTimers();
      renderGuideFeatureBadge();
      loginPassword.value = "";
      setLoginStatus("Signed in as " + payload.username + ".");
      showLibraryView();
      await loadPersistedAudioCards();
      if (state.authUser && state.authToken) {
        await restoreResumeContextAfterLogin(payload.username);
      }
    } catch (error) {
      setLoginStatus("Login failed: " + normalizeErrorMessage(error), true);
    } finally {
      loginButton.disabled = false;
    }
  }

  function openFilePicker() {
    input.value = "";
    input.click();
  }

  function handleLogoutClick() {
    if (state.isPersisting) {
      return;
    }
    logRuntimeAction("auth:logout-click", {
      authUser: state.authUser,
      workspacePhase: state.workspacePhase
    });
    clearLoginState("Logged out.");
  }

  async function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    logRuntimeAction("audio:file-change", {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    state.activeSessionId = null;
    state.activeRevision = 0;
    state.activeAudioId = null;
    state.activeAudioUrl = null;
    state.pendingUpload = {
      id: "pending-" + Date.now().toString(36),
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      },
      progress: 0,
      phase: "uploading",
      savedAt: new Date().toISOString(),
      playback: { checkpoints: [] }
    };
    setAudioSource({ data: { file, displayName: file.name }, deps: {} });
    resetPlaybackState();
    showIngestView();
    renderAudioCards(state.sessionsCache);
    await enqueueAutoSave();
  }

  function handleKeyDown(event) {
    if (event.defaultPrevented) {
      return;
    }
    if (isSettingsPopoverOpen() && (event.key === "Escape" || event.code === "Escape")) {
      event.preventDefault();
      event.stopPropagation();
      closeSettingsPopover();
      return;
    }
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    if (keyCode === "Tab" || keyValue === "Tab") {
      if (isTextEntryFocused) {
        return;
      }
      if (trapPageTabFocus(event)) {
        return;
      }
    }
    const isArrowRight = keyCode === "ArrowRight" || keyValue === "ArrowRight" || keyValue === "Right";
    const isArrowLeft = keyCode === "ArrowLeft" || keyValue === "ArrowLeft" || keyValue === "Left";
    const isArrowUp = keyCode === "ArrowUp" || keyValue === "ArrowUp" || keyValue === "Up";
    const isArrowDown = keyCode === "ArrowDown" || keyValue === "ArrowDown" || keyValue === "Down";
    const isDeleteKey = keyCode === "Delete" || keyValue === "Delete" || keyValue === "Del";
    const isBackspaceKey = keyCode === "Backspace" || keyValue === "Backspace";
    const isSpaceKey = keyCode === "Space" || keyValue === " " || keyValue === "Spacebar";
    const isEnterKey = keyCode === "Enter" || keyValue === "Enter";
    const isEscapeKey = keyCode === "Escape" || keyValue === "Escape" || keyValue === "Esc";
    const isShiftKey = keyCode === "ShiftLeft" || keyCode === "ShiftRight" || keyValue === "Shift";
    const activeElement = document.activeElement;
    const isSubSegInputFocused = activeElement === subSegValueInput;
    const isSubSegCardInputFocused = Boolean(
      activeElement &&
      activeElement.classList &&
      activeElement.classList.contains("subseg-value-card-input")
    );
    const isSubSegDeleteDialogButtonFocused = Boolean(
      activeElement &&
      activeElement.tagName === "BUTTON" &&
      activeElement.dataset &&
      (activeElement.dataset.subSegValueDeleteCancel === "1" || activeElement.dataset.subSegValueDeleteConfirm === "1")
    );
    const isDeleteConfirmControlFocused = Boolean(
      activeElement &&
      (activeElement === deleteConfirmCancel || activeElement === deleteConfirmDelete)
    );
    const isAudSegNoteEditorFocused = Boolean(
      activeElement &&
      activeElement === audSegNoteEditor
    );
    const isCommentBubbleFocused = Boolean(
      activeElement &&
      activeElement.classList &&
      activeElement.classList.contains("subseg-value-comment-bubble")
    );
    const isTextEntryFocused = Boolean(
      activeElement &&
      (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        Boolean(activeElement.isContentEditable)
      )
    );
    debugLog("keydown", {
      code: keyCode,
      key: keyValue,
      ctrl: Boolean(event.ctrlKey || event.metaKey),
      shift: Boolean(event.shiftKey),
      isPlayerActive: isPlayerActive(),
      paused: audio.paused,
      currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : null,
      selectedSpanIndex: state.selectedSpanIndex,
      targetSpanIndex: state.targetSpanIndex,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
      shiftHoldTss: state.shiftHoldTss,
      isCommentBubbleFocused: isCommentBubbleFocused
    });
    if (isCommentBubbleFocused) {
      traceSubSegLog("keydown:page-handler-received", {
        code: keyCode,
        key: keyValue,
        ctrl: Boolean(event.ctrlKey || event.metaKey),
        shift: Boolean(event.shiftKey),
        defaultPrevented: Boolean(event.defaultPrevented),
        isTextEntryFocused: isTextEntryFocused,
        activeElementClass: String(activeElement && activeElement.className ? activeElement.className : "")
      });
      return;
    }

    if (state.isGuideMode) {
      const guideControlFocus = Boolean(
        activeElement &&
        activeElement.closest &&
        activeElement.closest("#guide-tooltip") &&
        (activeElement.tagName === "BUTTON" ||
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT")
      );
      if (isEscapeKey) {
        event.preventDefault();
        event.stopPropagation();
        stopGuideMode({ data: { reason: "escape" }, deps: {} });
        return;
      }
      if (guideControlFocus) {
        return;
      }
      if (isArrowLeft) {
        event.preventDefault();
        event.stopPropagation();
        moveGuideStep({ data: { delta: -1 }, deps: {} });
        return;
      }
      if (isArrowRight || isEnterKey || isSpaceKey) {
        event.preventDefault();
        event.stopPropagation();
        moveGuideStep({ data: { delta: 1 }, deps: {} });
        return;
      }
    }

    if (!isTextEntryFocused && !state.isGuideMode && !state.deleteConfirmOpen) {
      if (state.workspacePhase === "dashboard" && (event.ctrlKey || event.metaKey) && (isArrowLeft || isArrowRight || isArrowUp || isArrowDown)) {
        event.preventDefault();
        event.stopPropagation();
        const cols = getModuleGridColumnCount();
        let delta = 0;
        if (isArrowLeft) {
          delta = -1;
        } else if (isArrowRight) {
          delta = 1;
        } else if (isArrowUp) {
          delta = -Math.max(1, cols);
        } else if (isArrowDown) {
          delta = Math.max(1, cols);
        }
        moveModuleSelection(delta);
        return;
      }
      if (state.workspacePhase === "ingest" && (event.ctrlKey || event.metaKey) && (isArrowUp || isArrowDown)) {
        event.preventDefault();
        event.stopPropagation();
        moveIngestSelection(isArrowDown ? 1 : -1);
        return;
      }
    }

    if (state.deleteConfirmOpen) {
      if (isEscapeKey || ((event.ctrlKey || event.metaKey) && isBackspaceKey)) {
        event.preventDefault();
        event.stopPropagation();
        clearDeleteTarget({ silent: false });
        updateUi();
        return;
      }
      if (isEnterKey) {
        event.preventDefault();
        event.stopPropagation();
        if (isDeleteConfirmControlFocused && activeElement === deleteConfirmDelete) {
          confirmDeleteTarget();
        } else {
          closeDeleteConfirmDialog();
          setSaveStatus("Delete cancelled");
        }
        return;
      }
      if (keyCode === "Tab") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (isSubSegCardInputFocused) {
      if (handleFocusedSubSegCardKeyDown(event)) {
        return;
      }
      return;
    }

    if (isSubSegDeleteDialogButtonFocused) {
      return;
    }

    if (isSubSegInputFocused) {
      if (keyCode === "Tab") {
        return;
      }
      if (event.shiftKey && isSpaceKey) {
        event.preventDefault();
        event.stopPropagation();
        logRuntimeAction("subseg:draft:toggle-play", {
          focused: true,
          activeSubSegValueKey: state.activeSubSegValueKey
        });
        if (audio.paused) {
          audio.play().catch(function () {});
        } else {
          audio.pause();
        }
      } else if ((event.ctrlKey || event.metaKey) && isBackspaceKey) {
        event.preventDefault();
        event.stopPropagation();
        logRuntimeAction("subseg:draft:exit", {
          activeSubSegValueKey: state.activeSubSegValueKey
        });
        exitSelectedSubSegValueSelection("audSeg subSeg value selection exited");
      } else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (isArrowUp || isArrowDown)) {
        event.preventDefault();
        event.stopPropagation();
        logRuntimeAction("subseg:draft:move-focus", {
          direction: isArrowDown ? 1 : -1,
          activeSubSegValueKey: state.activeSubSegValueKey
        });
        moveFocusFromTopSubSegInput(isArrowDown ? 1 : -1);
      } else if ((event.ctrlKey || event.metaKey) && isDeleteKey) {
        event.preventDefault();
        event.stopPropagation();
        logRuntimeAction("subseg:draft:clear-selection", {
          activeSubSegValueKey: state.activeSubSegValueKey
        });
        const activeKey = state.activeSubSegValueKey;
        state.activeSubSegValueKey = null;
        state.subSegCardDeleteDialogKey = null;
        if (subSegValueInput) {
          subSegValueInput.innerHTML = "";
        }
        if (activeKey) {
          delete state.subSegDraftHtmlByKey[activeKey];
        }
        renderSubSegValuePanel();
        setSaveStatus("audSeg subSeg value selection exited");
      }
      return;
    }

    if (isAudSegNoteEditorFocused) {
      if (event.shiftKey && isSpaceKey) {
        event.preventDefault();
        event.stopPropagation();
        if (audio.paused) {
          audio.play().catch(function () {});
        } else {
          audio.pause();
        }
        return;
      }
      if (keyCode === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        audSegNoteEditor.blur();
        focusProgressControl();
        return;
      }
      return;
    }

    if (isShiftKey && isPlayerActive() && hasTargetSpan() && !Number.isFinite(state.shiftHoldTss)) {
      state.shiftHoldTss = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      logRuntimeAction("audseg:shift-hold-start", {
        shiftHoldTss: state.shiftHoldTss,
        targetSpanIndex: state.targetSpanIndex
      });
      debugLog("target:shiftHoldStart", { tss: state.shiftHoldTss });
      setSaveStatus("audSeg tss armed at " + formatTime(state.shiftHoldTss));
      return;
    }

    if ((event.ctrlKey || event.metaKey) && isBackspaceKey) {
      if (isPlayerActive()) {
        event.preventDefault();
        logRuntimeAction("audseg:ctrl-backspace", {
          deleteConfirmOpen: state.deleteConfirmOpen,
          deleteTargetType: state.deleteTargetType,
          activeSubSegValueKey: state.activeSubSegValueKey,
          selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
          targetSpanIndex: state.targetSpanIndex,
          selectedSpanIndex: state.selectedSpanIndex
        });
        if (state.deleteConfirmOpen || hasDeleteTargetSelection()) {
          clearDeleteTarget({ silent: false });
          updateUi();
          return;
        }
        if (state.activeSubSegValueKey) {
          exitSelectedSubSegValueSelection("audSeg subSeg value selection cleared");
          return;
        }
        if (state.selectedTargetSubSegIndex >= 0) {
          state.selectedTargetSubSegIndex = -1;
          updateUi();
          setSaveStatus("audSeg subSeg deselected");
          return;
        }
        if (hasTargetSpan()) {
          clearTargetSpanLock({ preserveSelection: true });
          updateUi();
          setSaveStatus("audSeg target unlocked");
          return;
        }
        if (state.selectedSpanIndex >= 0) {
          state.selectedSpanIndex = -1;
          updateUi();
          setSaveStatus("audSeg deselected");
          enqueueAutoSave();
        } else {
          goBackToLibrary();
        }
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && (keyCode === "KeyS" || keyValue.toLowerCase() === "s")) {
      event.preventDefault();
      logRuntimeAction("audseg:ctrl-s", {
        isPlayerActive: isPlayerActive(),
        hasAudio: Boolean(audio.src),
        selectedSpanIndex: state.selectedSpanIndex,
        targetSpanIndex: state.targetSpanIndex,
        activeSubSegValueKey: state.activeSubSegValueKey
      });
      if (isPlayerActive() && audio.src) {
        enqueueAutoSave();
      }
      return;
    }

    if (!isPlayerActive() || !audio.src) {
      return;
    }

    if (isAudSegNoteEditorFocused) {
      if (event.shiftKey && isSpaceKey) {
        event.preventDefault();
        event.stopPropagation();
        if (audio.paused) {
          audio.play().catch(function () {});
        } else {
          audio.pause();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && (isBackspaceKey || isArrowLeft || isArrowRight)) {
        event.preventDefault();
        event.stopPropagation();
        if (isBackspaceKey) {
          handlePlayerCtrlBackspaceShortcut();
        } else {
          handlePlayerCtrlArrowShortcut(isArrowRight ? 1 : -1);
        }
        return;
      } else {
        return;
      }
    }

    if (isEnterKey && isSubSegInputFocused) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && (isArrowUp || isArrowDown)) {
      event.preventDefault();
      cycleDeleteTarget(isArrowDown ? 1 : -1);
      return;
    }

    if (isEnterKey && hasDeleteTargetSelection()) {
      event.preventDefault();
      openDeleteConfirmDialog();
      return;
    }

    if (isEnterKey) {
      event.preventDefault();
      logRuntimeAction("audseg:enter", {
        hasTargetSpan: hasTargetSpan(),
        selectedSpanIndex: state.selectedSpanIndex,
        selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
        activeSubSegValueKey: state.activeSubSegValueKey
      });
      if (hasTargetSpan()) {
        if (state.selectedTargetSubSegIndex >= 0) {
          activateSubSegValueSelection();
          return;
        }
        return;
      }
      lockSelectedSpanAsTarget();
      return;
    }

    if ((isArrowRight || isArrowLeft) && event.ctrlKey) {
      const latchKey = isArrowRight ? "right" : "left";
      const latchMode = hasTargetSpan() ? "target" : "span";
      if (state.cycleLatch[latchKey] === latchMode || event.repeat) {
        event.preventDefault();
        return;
      }
      state.cycleLatch[latchKey] = latchMode;
      if (hasTargetSpan()) {
        event.preventDefault();
        logRuntimeAction("audseg:ctrl-arrow-target", {
          direction: isArrowRight ? 1 : -1,
          latchMode,
          selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
          targetSpanIndex: state.targetSpanIndex
        });
        cycleTargetSubSegSelection(isArrowRight ? 1 : -1);
        return;
      }
      if (getCheckpointSeries().length <= 1) {
        return;
      }
      event.preventDefault();
      logRuntimeAction("audseg:ctrl-arrow-span", {
        direction: isArrowRight ? 1 : -1,
        latchMode,
        selectedSpanIndex: state.selectedSpanIndex
      });
      cycleSpanSelection(isArrowRight ? 1 : -1);
      debugLog("keydown:cycleSpan", { dir: isArrowRight ? 1 : -1, selectedSpanIndex: state.selectedSpanIndex });
      return;
    }

    if (isArrowRight || isArrowLeft) {
      event.preventDefault();
      debugLog("keydown:seekBy", { delta: isArrowRight ? 5 : -5 });
      seekBy(isArrowRight ? 5 : -5);
      return;
    }

    if (!isSpaceKey) {
      return;
    }

    if (isCommentBubbleFocused) {
      traceSubSegLog("keydown:page-space-branch", {
        code: keyCode,
        key: keyValue,
        ctrl: Boolean(event.ctrlKey || event.metaKey),
        shift: Boolean(event.shiftKey),
        defaultPrevented: Boolean(event.defaultPrevented),
        action: event.shiftKey ? "shift-space" : "space-toggle"
      });
    }
    event.preventDefault();

    if (event.shiftKey) {
      if (hasTargetSpan()) {
        logRuntimeAction("audseg:shift-space:create-subseg", {
          shiftHoldTss: state.shiftHoldTss,
          currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : null,
          targetSpanIndex: state.targetSpanIndex
        });
        createTargetSubSegFromShiftHold();
        return;
      }
      logRuntimeAction("audseg:shift-space:checkpoint", {
        currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : null,
        checkpoints: state.checkpoints.slice()
      });
      dropCheckpoint();
      debugLog("keydown:checkpoint", { currentTime: audio.currentTime, checkpoints: state.checkpoints.slice() });
      return;
    }

    if (audio.paused) {
      audio.play().catch(function () {});
    } else {
      audio.pause();
    }
  }

  function handleKeyUp(event) {
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    const isShiftKey = keyCode === "ShiftLeft" || keyCode === "ShiftRight" || keyValue === "Shift";
    const isArrowRight = keyCode === "ArrowRight" || keyValue === "ArrowRight" || keyValue === "Right";
    const isArrowLeft = keyCode === "ArrowLeft" || keyValue === "ArrowLeft" || keyValue === "Left";
    const isCtrlKey = keyCode === "ControlLeft" || keyCode === "ControlRight" || keyValue === "Control";
    const isMetaKey = keyCode === "MetaLeft" || keyCode === "MetaRight" || keyValue === "Meta";

    if (isArrowRight) {
      state.cycleLatch.right = "";
    }
    if (isArrowLeft) {
      state.cycleLatch.left = "";
    }
    if (isCtrlKey || isMetaKey) {
      state.cycleLatch.left = "";
      state.cycleLatch.right = "";
    }

    if (!isShiftKey || !Number.isFinite(state.shiftHoldTss)) {
      return;
    }
    state.shiftHoldTss = null;
    debugLog("target:shiftHoldClear", {});
    if (hasTargetSpan() && isPlayerActive()) {
      setSaveStatus("audSeg tss cleared");
    }
  }

  function beginCheckpointDrag(event, checkpointIndex) {
    if (!isPlayerActive() || state.isPlayerLoading) {
      return;
    }
    if (hasTargetSpan()) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (duration <= 0 || checkpointIndex < 0 || checkpointIndex >= state.checkpoints.length) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const prev = checkpointIndex > 0 ? state.checkpoints[checkpointIndex - 1] : 0;
    const next = checkpointIndex < (state.checkpoints.length - 1) ? state.checkpoints[checkpointIndex + 1] : duration;
    const wasPlaying = !audio.paused;
    if (wasPlaying) {
      audio.pause();
    }

    state.checkpointDrag = {
      index: checkpointIndex,
      prev: Number.isFinite(prev) ? prev : 0,
      next: Number.isFinite(next) ? next : duration,
      wasPlaying,
      lastAppliedTime: state.checkpoints[checkpointIndex]
    };

    const startTime = state.checkpoints[checkpointIndex];
    showCheckpointMagnifier(startTime);
    previewCheckpointPosition(startTime);
    updateUi();
  }

  function handleCheckpointDragMove(event) {
    if (!state.checkpointDrag) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (duration <= 0) {
      return;
    }
    event.preventDefault();

    const nextTime = resolveTimeFromClientX(event.clientX, duration);
    const epsilon = 0.001;
    const minTime = Math.max(0, state.checkpointDrag.prev + epsilon);
    const maxTime = Math.min(duration, state.checkpointDrag.next - epsilon);
    const clamped = Math.max(minTime, Math.min(maxTime, nextTime));
    if (!Number.isFinite(clamped)) {
      return;
    }
    if (Math.abs(clamped - state.checkpointDrag.lastAppliedTime) < 0.0005) {
      return;
    }

    state.checkpoints[state.checkpointDrag.index] = clamped;
    state.checkpointDrag.lastAppliedTime = clamped;
    state.markerSignature = "";
    state.subSegSignature = "";
    state.targetMarkerSignature = "";
    syncTargetSubSegsFromCurrentBounds();
    showCheckpointMagnifier(clamped);
    previewCheckpointPosition(clamped);
    updateUi();
  }

  function handleCheckpointDragEnd() {
    if (!state.checkpointDrag) {
      return;
    }
    const dragState = state.checkpointDrag;
    state.checkpointDrag = null;
    hideCheckpointMagnifier();
    if (state.checkpointPreviewTimerId) {
      window.clearTimeout(state.checkpointPreviewTimerId);
      state.checkpointPreviewTimerId = null;
    }
    if (dragState.wasPlaying) {
      audio.play().catch(function () {});
    } else {
      audio.pause();
    }
    syncTargetSubSegsFromCurrentBounds();
    updateUi();
    enqueueAutoSave();
  }

  function clearCheckpointDragState() {
    state.checkpointDrag = null;
    if (state.checkpointPreviewTimerId) {
      window.clearTimeout(state.checkpointPreviewTimerId);
      state.checkpointPreviewTimerId = null;
    }
    hideCheckpointMagnifier();
  }

  function resolveTimeFromClientX(clientX, duration) {
    const trackRect = progressTrackMain ? progressTrackMain.getBoundingClientRect() : progress.getBoundingClientRect();
    const ratio = trackRect.width > 0 ? (clientX - trackRect.left) / trackRect.width : 0;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return clampedRatio * duration;
  }

  function showCheckpointMagnifier(seconds) {
    if (!checkpointMagnifier) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const trackRect = progressTrackMain ? progressTrackMain.getBoundingClientRect() : progress.getBoundingClientRect();
    const percent = duration > 0 ? Math.max(0, Math.min(1, seconds / duration)) : 0;
    const x = percent * trackRect.width;
    const left = Math.max(0, Math.min(trackRect.width - 88, x - 44));
    checkpointMagnifier.style.left = String(left) + "px";
    checkpointMagnifier.classList.remove("hidden");
    if (checkpointMagnifierTime) {
      checkpointMagnifierTime.textContent = formatTimeWithMillis(seconds);
    }
  }

  function hideCheckpointMagnifier() {
    if (!checkpointMagnifier) {
      return;
    }
    checkpointMagnifier.classList.add("hidden");
  }

  function previewCheckpointPosition(seconds) {
    if (!Number.isFinite(seconds)) {
      return;
    }
    if (state.checkpointPreviewTimerId) {
      window.clearTimeout(state.checkpointPreviewTimerId);
      state.checkpointPreviewTimerId = null;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const safe = Math.max(0, Math.min(duration || seconds, seconds));
    audio.currentTime = safe;
    audio.play().catch(function () {});
    state.checkpointPreviewTimerId = window.setTimeout(function () {
      if (state.checkpointDrag) {
        const loopPoint = Number.isFinite(state.checkpointDrag.lastAppliedTime)
          ? state.checkpointDrag.lastAppliedTime
          : safe;
        previewCheckpointPosition(loopPoint);
        return;
      }
      audio.pause();
      state.checkpointPreviewTimerId = null;
    }, 1000);
  }

  function showLibraryView() {
    if (state.isGuideMode && state.guidePhase.indexOf("list-") !== 0) {
      stopGuideMode({ data: { reason: "view-hidden", silent: true }, deps: {} });
    }
    blurActiveEditable();
    logRuntimeAction("view:library", {
      previousPhase: state.workspacePhase,
      currentFile: state.currentFile ? state.currentFile.name : "",
      targetSpanIndex: state.targetSpanIndex
    });
    clearCheckpointDragState();
    state.moduleCardIndex = 0;
    loginView.classList.add("hidden");
    libraryView.classList.remove("hidden");
    if (moduleDashboard) {
      moduleDashboard.classList.remove("hidden");
    }
    if (ingestPanel) {
      ingestPanel.classList.add("hidden");
    }
    if (modulesButton) {
      modulesButton.classList.add("hidden");
    }
    if (guideButtonList) {
      guideButtonList.classList.add("hidden");
    }
    if (logoutButton) {
      logoutButton.classList.remove("hidden");
    }
    if (settingsButton) {
      settingsButton.classList.remove("hidden");
    }
    closeSettingsPopover();
    if (uploadButton) {
      uploadButton.classList.add("hidden");
    }
    playerView.classList.add("hidden");
    setPlayerLoading(false);
    state.isPlayerVisible = false;
    state.workspacePhase = "dashboard";
    clearDeleteTarget({ silent: true });
    renderModuleDashboard();
    requestAnimationFrame(function () {
      const selector = "button[data-module-card-index=\"" + String(state.moduleCardIndex) + "\"]";
      const button = moduleGrid ? moduleGrid.querySelector(selector) : null;
      if (!button) {
        return;
      }
      try {
        button.focus({ preventScroll: true });
      } catch {
        button.focus();
      }
    });
  }

  function formatTimeWithMillis(totalSeconds) {
    const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
    const whole = Math.floor(safe);
    const minutes = Math.floor(whole / 60);
    const seconds = whole % 60;
    const millis = Math.floor((safe - whole) * 1000);
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(millis).padStart(3, "0");
  }

  function showIngestView() {
    blurActiveEditable();
    logRuntimeAction("view:ingest", {
      previousPhase: state.workspacePhase,
      currentFile: state.currentFile ? state.currentFile.name : "",
      targetSpanIndex: state.targetSpanIndex
    });
    clearCheckpointDragState();
    loginView.classList.add("hidden");
    libraryView.classList.remove("hidden");
    if (moduleDashboard) {
      moduleDashboard.classList.add("hidden");
    }
    if (ingestPanel) {
      ingestPanel.classList.remove("hidden");
    }
    if (modulesButton) {
      modulesButton.classList.remove("hidden");
    }
    if (guideButtonList) {
      guideButtonList.classList.remove("hidden");
    }
    if (logoutButton) {
      logoutButton.classList.add("hidden");
    }
    if (settingsButton) {
      settingsButton.classList.add("hidden");
    }
    closeSettingsPopover();
    if (uploadButton) {
      uploadButton.classList.remove("hidden");
    }
    playerView.classList.add("hidden");
    setPlayerLoading(false);
    state.isPlayerVisible = false;
    state.workspacePhase = "ingest";
    clearDeleteTarget({ silent: true });
    renderModuleDashboard();
    renderAudioCards(state.sessionsCache);
    requestAnimationFrame(function () {
      const buttons = cards ? Array.from(cards.querySelectorAll(".audio-card-main")) : [];
      const button = buttons[Math.max(0, Math.min(buttons.length - 1, Number(state.ingestCardIndex)))];
      if (button) {
        try {
          button.focus({ preventScroll: true });
        } catch {
          button.focus();
        }
        return;
      }
      if (uploadButton && !uploadButton.classList.contains("hidden")) {
        try {
          uploadButton.focus({ preventScroll: true });
        } catch {
          uploadButton.focus();
        }
      }
    });
  }

  function showPlayerView() {
    blurActiveEditable();
    logRuntimeAction("view:player", {
      previousPhase: state.workspacePhase,
      selectedSpanIndex: state.selectedSpanIndex,
      targetSpanIndex: state.targetSpanIndex
    });
    loginView.classList.add("hidden");
    libraryView.classList.add("hidden");
    playerView.classList.remove("hidden");
    if (settingsButton) {
      settingsButton.classList.add("hidden");
    }
    closeSettingsPopover();
    state.isPlayerVisible = true;
    state.workspacePhase = "player";
    syncPlayerTabTargets();
  }

  function syncPlayerTabTargets() {
    setDescendantTabStops(playerView, playerSection);
  }

  function setDescendantTabStops(root, allowTarget) {
    if (!root) {
      return;
    }
    const focusableSelector = "button, input, select, textarea, a[href], [contenteditable=\"true\"], [tabindex]";
    const focusables = Array.from(root.querySelectorAll(focusableSelector));
    focusables.forEach(function (el) {
      if (el === allowTarget) {
        return;
      }
      if (isSubSegDeleteDialogButton(el)) {
        el.setAttribute("tabindex", "0");
        return;
      }
      el.setAttribute("tabindex", "-1");
    });
  }

  function isSubSegDeleteDialogButton(el) {
    if (!el || el.tagName !== "BUTTON") {
      return false;
    }
    if (!subSegValueList || !subSegValueList.contains(el)) {
      return false;
    }
    return Boolean(
      el.dataset &&
      (el.dataset.subSegValueDeleteCancel === "1" || el.dataset.subSegValueDeleteConfirm === "1")
    );
  }

  function showLoginView() {
    if (state.isGuideMode) {
      stopGuideMode({ data: { reason: "view-hidden", silent: true }, deps: {} });
    }
    blurActiveEditable();
    clearCheckpointDragState();
    closeSettingsPopover();
    loginView.classList.remove("hidden");
    libraryView.classList.add("hidden");
    playerView.classList.add("hidden");
    setPlayerLoading(false);
    state.isPlayerVisible = false;
    state.workspacePhase = "login";
    clearDeleteTarget({ silent: true });
  }

  function setPlayerLoading(isLoading, message) {
    const active = Boolean(isLoading);
    state.isPlayerLoading = active;
    playerView.classList.toggle("is-loading", active);
    if (playerLoading) {
      playerLoading.classList.toggle("hidden", !active);
      if (message) {
        const label = playerLoading.querySelector(".card-progress-label");
        if (label) {
          label.textContent = String(message);
        }
      }
    }
  }

  function blurActiveEditable() {
    const active = document.activeElement;
    if (!active) {
      return;
    }
    if (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable || active.tagName === "BUTTON") {
      try {
        active.blur();
      } catch {
        // Ignore blur failures.
      }
    }
  }

  function isPlayerActive() {
    return state.isPlayerVisible && !playerView.classList.contains("hidden");
  }

  async function goBackToLibrary() {
    if (!audio.paused) {
      audio.pause();
    }
    clearTargetSpanLock({ preserveSelection: false });
    showIngestView();
    state.openMenuSessionId = null;
    state.isListLoading = true;
    renderAudioCards(state.sessionsCache);
    try {
      if (state.currentFile) {
        await enqueueAutoSave();
      } else {
        await loadPersistedAudioCards();
      }
    } finally {
      state.isListLoading = false;
      renderAudioCards(state.sessionsCache);
    }
  }

  function handleGlobalClick(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    if (isSettingsPopoverOpen()) {
      const withinSettingsPopover = target.closest && target.closest("#settings-popover");
      const withinSettingsButton = target.closest && target.closest("#settings-button");
      if (!withinSettingsPopover && !withinSettingsButton) {
        closeSettingsPopover();
      }
    }
    if (state.openMenuSessionId == null) {
      return;
    }
    const withinMenu = target.closest && target.closest(".item-actions");
    const withinSettingsButton = target.closest && target.closest(".item-settings-button");
    if (!withinMenu && !withinSettingsButton) {
      state.openMenuSessionId = null;
      renderAudioCards(state.sessionsCache);
    }
  }

  function handleGuideOverlayClick(event) {
    if (!state.isGuideMode || !guideOverlay || !guideTooltip) {
      return;
    }
    const target = event.target;
    const withinTooltip = target && target.closest && target.closest("#guide-tooltip");
    if (!withinTooltip) {
      stopGuideMode({ data: { reason: "backdrop" }, deps: {} });
    }
  }

  function handleGuideViewportChanged() {
    scheduleGuideStepRender({ deps: {} });
  }

  function getGuideCopy(ctx) {
    const { deps } = ctx;
    void deps;
    const copy = {
      en: {
        next: "Next",
        finish: "Finish",
        closed: "Guide mode closed",
        complete: "Guide complete",
        languageTitle: "Language",
        languageText: "Choose guide language. You can switch later in this same step.",
        uploadButtonTitle: "Upload Button",
        uploadButtonText: "Click Upload, choose your audio file, then wait for it to appear in the list.",
        demoCardReadyTitle: "Select Audio Item",
        demoCardReadyText: "When a file appears in the list, click its card to open it.",
        demoCardUploadTitle: "Watch Processing Progress",
        demoCardUploadText: "Use the progress state to confirm upload/processing is still running before you open the item.",
        demoCardLoadingTitle: "Enter Player",
        demoCardLoadingText: "After you click a card, wait for loading to finish, then continue in the player screen.",
        playerOverviewTitle: "Player Screen",
        playerOverviewText: "This is where playback editing happens. Follow the next steps in order during real work.",
        playerMainTitle: "Main Timeline",
        playerMainText: "Press Space to toggle play/pause on this timeline, then listen for structure points before adding checkpoints. Each span between two checkpoints is an audSeg.",
        checkpointSetTitle: "Add Checkpoint At Cursor",
        checkpointSetText: "Move playback to a logical boundary. Here the cursor is at 01:25. Press Shift+Space to add a checkpoint at this exact time.",
        checkpointAddTitle: "Checkpoint Timestamps",
        checkpointAddText: "Checkpoint tags are shown as timestamps, matching runtime view. Each pair of timestamps defines one audSeg boundary.",
        checkpointDeleteTargetTitle: "Delete Checkpoint Target",
        checkpointDeleteTargetText: "On the audEp bar, press Ctrl+Up/Down to cycle delete targets across checkpoint tags.",
        checkpointDeleteConfirmTitle: "Delete Checkpoint Confirm",
        checkpointDeleteConfirmText: "Press Enter to open delete dialog. In dialog, Enter on Delete confirms; Esc or Ctrl+Backspace cancels.",
        checkpointCycleTitle: "Cycle-Select Span",
        checkpointCycleText: "Use Ctrl+Left/Right to cycle checkpoint spans, then press Enter to lock the current span as target audSeg.",
        playerFocusTitle: "Target audSeg Bar",
        playerFocusText: "This lower bar shows the target audSeg you locked with Enter, so you can work inside that exact span.",
        subSegCardTitle: "subSeg Purpose",
        subSegCardText: "Use subSeg for short unclear audio you want to understand better (or cannot fully catch). Keep it very short, usually less than one sentence.",
        subSegStartTitle: "Set subSeg Start",
        subSegStartText: "At the beginning of unclear audio, hold Shift to set subSeg start, then keep listening for the end point.",
        subSegEndTitle: "Set subSeg End",
        subSegEndText: "At the end of that unclear audio, press Shift+Space to set subSeg end and finalize the subSeg.",
        subSegSelectTitle: "Select subSeg For Input",
        subSegSelectText: "Press Ctrl+Left/Right to cycle subSegs inside this audSeg. Stop on your target subSeg, then press Enter to open text input mode.",
        subSegDeleteTargetTitle: "Delete subSeg Target",
        subSegDeleteTargetText: "Inside target audSeg, press Ctrl+Up/Down to cycle delete targets across subSeg tags.",
        subSegDeleteConfirmTitle: "Delete subSeg Confirm",
        subSegDeleteConfirmText: "Press Enter to open delete dialog. In dialog, Enter on Delete confirms; Esc cancels.",
        guideCheckpointDeleteSummary: "checkpoint at 02:12",
        guideSubSegDeleteSummary: "subSeg 01:41-49",
        inputTitle: "Text Input",
        inputText: "Purpose: write your best attempt of the target subSeg audio. If words are uncertain, approximate from hearing only. Do not use dictionary or outside sources.",
        firstCardInputTitle: "Enter First Card Value",
        firstCardInputText: "Type your first best-attempt text (example: 'å‰åŽä¸¤æ¸…') in the top input, use Enter for a new line if you want one, and blur to promote the blank card into a tracked card.",
        cardsTitle: "First Version Saved",
        cardsText: "Blur saves the current text onto this card record.",
        cardEditTitle: "Edit To New Version",
        cardEditText: "Focus this card, update your text after re-listening (example now: 'é’±è´§ä¸¤æ¸…'), then blur to save. The prior text remains as version history on the same card.",
        cardChildSelectTitle: "Create Child Cards",
        cardChildSelectText: "Goal: split a long parent phrase into a smaller focused idea you want to track as its own child card. On parent rich text 'é’±è´§ä¸¤æ¸…', focus the parent card editor, highlight 'é’±è´§', then press Enter.",
        cardChildCreatedTitle: "Child Card Created",
        cardChildCreatedText: "After Enter, a child card appears directly under the parent using the selected fragment. Repeat on any child to nest deeper. Siblings are ordered by earliest highlighted index in the parent text, and each child indents +5px per level.",
        cardNavVerticalTitle: "Move Between Cards",
        cardNavVerticalText: "Press Ctrl+Up or Ctrl+Down to move focus to another card.",
        cardNavHistoryTitle: "Edit Current Card",
        cardNavHistoryText: "Edit the focused card directly, blur to save, and Ctrl+Up or Ctrl+Down to move between cards.",
        cardDeleteTitle: "Card Delete Dialog",
        cardDeleteText: "Use the card's delete actions when you want to remove a saved card.",
        cardDeleteConfirmTitle: "Card Delete Actions",
        cardDeleteConfirmText: "Use Cancel to close the dialog or Delete to remove the current card.",
        exitValueModeTitle: "Exit Input Mode",
        exitValueModeText: "Press Ctrl+Backspace while in top value input mode to exit value-entry mode.",
        exitSubSegTitle: "Exit subSeg Selection",
        exitSubSegText: "While focused in a subSeg card editor, press Ctrl+Backspace to exit the current subSeg selection.",
        exitTargetTitle: "Exit target audSeg",
        exitTargetText: "Press Ctrl+Backspace again to unlock and exit target audSeg mode.",
        exitAudSegTitle: "Exit audSeg Selection",
        exitAudSegText: "Press Ctrl+Backspace again to clear current audSeg selection on the main timeline.",
        exitListTitle: "Return to List",
        exitListText: "Press Ctrl+Backspace once more (with no selection active) to return to the list page."
      },
      zh: {
        next: "\u4e0b\u4e00\u6b65",
        finish: "\u5b8c\u6210",
        closed: "\u5f15\u5bfc\u6a21\u5f0f\u5df2\u5173\u95ed",
        complete: "\u5f15\u5bfc\u5b8c\u6210",
        languageTitle: "\u8bed\u8a00",
        languageText: "\u8bf7\u9009\u62e9\u5f15\u5bfc\u8bed\u8a00\u3002\u4f60\u53ef\u4ee5\u5728\u672c\u6b65\u9aa4\u968f\u65f6\u5207\u6362\u3002",
        uploadButtonTitle: "\u4e0a\u4f20\u6309\u94ae",
        uploadButtonText: "\u70b9\u51fb\u4e0a\u4f20\uff0c\u9009\u62e9\u97f3\u9891\u6587\u4ef6\uff0c\u7136\u540e\u7b49\u5f85\u5b83\u51fa\u73b0\u5728\u5217\u8868\u91cc\u3002",
        demoCardReadyTitle: "\u9009\u62e9\u97f3\u9891\u6761\u76ee",
        demoCardReadyText: "\u5f53\u6587\u4ef6\u51fa\u73b0\u5728\u5217\u8868\u4e2d\uff0c\u70b9\u51fb\u8be5\u5361\u7247\u8fdb\u5165\u64ad\u653e\u9875\u3002",
        demoCardUploadTitle: "\u67e5\u770b\u5904\u7406\u8fdb\u5ea6",
        demoCardUploadText: "\u5148\u786e\u8ba4\u4e0a\u4f20/\u5904\u7406\u8fdb\u5ea6\u8fd8\u5728\u8fd0\u884c\uff0c\u518d\u53bb\u6253\u5f00\u8be5\u6761\u76ee\u3002",
        demoCardLoadingTitle: "\u8fdb\u5165\u64ad\u653e\u9875",
        demoCardLoadingText: "\u70b9\u51fb\u5361\u7247\u540e\uff0c\u7b49\u5f85\u52a0\u8f7d\u5b8c\u6210\uff0c\u7136\u540e\u5728\u64ad\u653e\u9875\u7ee7\u7eed\u64cd\u4f5c\u3002",
        playerOverviewTitle: "\u64ad\u653e\u5668\u9875\u9762",
        playerOverviewText: "\u8fd9\u91cc\u662f\u64ad\u653e\u4e0e\u6807\u6ce8\u7684\u4e3b\u5de5\u4f5c\u533a\u3002\u6309\u7167\u540e\u7eed\u6b65\u9aa4\u5373\u53ef\u5b8c\u6210\u5b9e\u9645\u64cd\u4f5c\u3002",
        playerMainTitle: "\u4e3b\u65f6\u95f4\u8f74",
        playerMainText: "\u5728\u4e3b\u65f6\u95f4\u8f74\u6309 Space \u5207\u6362\u64ad\u653e/\u6682\u505c\uff0c\u5148\u542c\u51fa\u5185\u5bb9\u7ed3\u6784\u65ad\u70b9\uff0c\u518d\u6dfb\u52a0\u68c0\u67e5\u70b9\u3002\u6bcf\u4e24\u4e2a\u68c0\u67e5\u70b9\u4e4b\u95f4\u7684\u7247\u6bb5\u79f0\u4e3a audSeg\u3002",
        checkpointSetTitle: "\u5728\u5149\u6807\u5904\u6dfb\u52a0\u68c0\u67e5\u70b9",
        checkpointSetText: "\u5c06\u64ad\u653e\u5b9a\u4f4d\u5230\u903b\u8f91\u8fb9\u754c\u3002\u6b64\u5904\u5149\u6807\u5728 01:25\uff0c\u6309 Shift+Space \u5373\u53ef\u5728\u8be5\u65f6\u95f4\u6dfb\u52a0\u68c0\u67e5\u70b9\u3002",
        checkpointAddTitle: "\u68c0\u67e5\u70b9\u65f6\u95f4\u6233",
        checkpointAddText: "\u68c0\u67e5\u70b9\u6807\u7b7e\u4ee5\u65f6\u95f4\u6233\u663e\u793a\uff08\u4e0e\u8fd0\u884c\u754c\u9762\u4e00\u81f4\uff09\u3002\u6bcf\u4e24\u4e2a\u65f6\u95f4\u6233\u5b9a\u4e49\u4e00\u4e2a audSeg \u8fb9\u754c\u3002",
        checkpointDeleteTargetTitle: "\u9009\u62e9\u8981\u5220\u9664\u7684 checkpoint",
        checkpointDeleteTargetText: "\u5728 audEp \u8fdb\u5ea6\u6761\u4e0a\u6309 Ctrl+\u4e0a/\u4e0b\uff0c\u5728 checkpoint \u6807\u7b7e\u95f4\u5faa\u73af\u9009\u62e9\u5220\u9664\u76ee\u6807\u3002",
        checkpointDeleteConfirmTitle: "\u786e\u8ba4\u5220\u9664 checkpoint",
        checkpointDeleteConfirmText: "\u6309 Enter \u6253\u5f00\u5220\u9664\u786e\u8ba4\u6846\u3002\u5728\u786e\u8ba4\u6846\u4e2d\uff0c\u5bf9\u7740 Delete \u6309 Enter \u6267\u884c\u5220\u9664\uff1bEsc \u6216 Ctrl+Backspace \u53d6\u6d88\u3002",
        checkpointCycleTitle: "\u5faa\u73af\u9009\u62e9\u8303\u56f4",
        checkpointCycleText: "\u4f7f\u7528 Ctrl+\u5de6/\u53f3 \u5728\u68c0\u67e5\u70b9\u5206\u6bb5\u95f4\u5faa\u73af\u9009\u62e9\uff0c\u7136\u540e\u6309 Enter \u5c06\u5f53\u524d\u5206\u6bb5\u9501\u5b9a\u4e3a target audSeg\u3002",
        playerFocusTitle: "\u76ee\u6807 audSeg \u8303\u56f4\u6761",
        playerFocusText: "\u8fd9\u4e2a\u4e0b\u65b9\u8303\u56f4\u6761\u5c31\u662f\u4f60\u7528 Enter \u9501\u5b9a\u7684 target audSeg\uff0c\u7528\u4e8e\u5728\u8be5\u8303\u56f4\u5185\u7cbe\u7ec6\u64cd\u4f5c\u3002",
        subSegCardTitle: "subSeg \u7528\u9014",
        subSegCardText: "subSeg \u7528\u4e8e\u622a\u53d6\u4f60\u542c\u4e0d\u592a\u61c2\u3001\u60f3\u8fdb\u4e00\u6b65\u7406\u89e3\u6216\u65e0\u6cd5\u786e\u5b9a\u7684\u77ed\u97f3\u9891\u7247\u6bb5\u3002\u5c3d\u91cf\u4fdd\u6301\u5f88\u77ed\uff0c\u901a\u5e38\u5c11\u4e8e\u4e00\u53e5\u8bdd\u3002",
        subSegStartTitle: "\u8bbe\u7f6e subSeg \u8d77\u70b9",
        subSegStartText: "\u5728\u542c\u4e0d\u6e05\u5185\u5bb9\u7684\u8d77\u70b9\u6309\u4f4f Shift \u8bbe\u5b9a subSeg \u5f00\u59cb\uff0c\u7136\u540e\u7ee7\u7eed\u542c\u5230\u7ed3\u675f\u70b9\u3002",
        subSegEndTitle: "\u8bbe\u7f6e subSeg \u7ec8\u70b9",
        subSegEndText: "\u5728\u8be5\u542c\u4e0d\u6e05\u7247\u6bb5\u7684\u7ed3\u675f\u70b9\u6309 Shift+Space\uff0c\u8bbe\u7f6e subSeg \u7ec8\u70b9\u5e76\u5b8c\u6210 subSeg\u3002",
        subSegSelectTitle: "\u9009\u62e9\u8981\u8f93\u5165\u7684 subSeg",
        subSegSelectText: "\u6309 Ctrl+\u5de6/\u53f3 \u5728\u5f53\u524d audSeg \u5185\u5faa\u73af\u9009\u62e9 subSeg\u3002\u9009\u4e2d\u76ee\u6807 subSeg \u540e\uff0c\u6309 Enter \u8fdb\u5165\u6587\u672c\u8f93\u5165\u6a21\u5f0f\u3002",
        subSegDeleteTargetTitle: "\u9009\u62e9\u8981\u5220\u9664\u7684 subSeg",
        subSegDeleteTargetText: "\u5728 target audSeg \u5185\u6309 Ctrl+\u4e0a/\u4e0b\uff0c\u5728 subSeg \u6807\u7b7e\u95f4\u5faa\u73af\u9009\u62e9\u5220\u9664\u76ee\u6807\u3002",
        subSegDeleteConfirmTitle: "\u786e\u8ba4\u5220\u9664 subSeg",
        subSegDeleteConfirmText: "\u6309 Enter \u6253\u5f00\u5220\u9664\u786e\u8ba4\u6846\u3002\u5728\u786e\u8ba4\u6846\u4e2d\uff0c\u5bf9\u7740 Delete \u6309 Enter \u6267\u884c\u5220\u9664\uff1bEsc \u53d6\u6d88\u3002",
        guideCheckpointDeleteSummary: "checkpoint at 02:12",
        guideSubSegDeleteSummary: "subSeg 01:41-49",
        inputTitle: "\u6587\u672c\u8f93\u5165\u6846",
        inputText: "\u76ee\u7684\uff1a\u5c06 target subSeg \u7684\u97f3\u9891\u5185\u5bb9\u5c3d\u529b\u5199\u4e0b\u6765\u3002\u4e0d\u786e\u5b9a\u7684\u8bcd\u8bf7\u6309\u542c\u611f\u8fd1\u4f3c\u62fc\u5199\uff0c\u4e0d\u8981\u67e5\u5b57\u5178\uff0c\u4e5f\u4e0d\u8981\u4f9d\u8d56\u5916\u90e8\u8d44\u6e90\u3002",
        firstCardInputTitle: "\u8f93\u5165\u7b2c\u4e00\u7248\u5361\u7247\u5185\u5bb9",
        firstCardInputText: "\u5728\u9876\u90e8\u8f93\u5165\u6846\u8f93\u5165\u7b2c\u4e00\u6b21\u542c\u5199\uff08\u793a\u4f8b\uff1a\u201c\u524d\u540e\u4e24\u6e05\u201d\uff09\uff0c\u5982\u679c\u9700\u8981\u53ef\u4ee5\u7528 Enter \u6362\u884c\uff0c\u7136\u540e\u79bb\u5f00\u6765\u628a\u7a7a\u767d\u5361\u7247\u63d0\u5347\u4e3a\u53ef\u8bb0\u5f55\u7684\u5361\u7247\u3002",
        cardsTitle: "\u7b2c\u4e00\u7248\u5df2\u4fdd\u5b58",
        cardsText: "\u79bb\u5f00\u540e\uff0c\u5f53\u524d\u6587\u5b57\u4f1a\u4fdd\u5b58\u5230\u8fd9\u5f20\u5361\u8bb0\u5f55\u4e0a\u3002",
        cardEditTitle: "\u4fee\u6539\u4e3a\u65b0\u7248\u672c",
        cardEditText: "\u805a\u7126\u8be5\u5361\u540e\uff0c\u91cd\u542c\u97f3\u9891\u5e76\u4fee\u6539\u6587\u5b57\uff08\u793a\u4f8b\u66f4\u65b0\u4e3a\u201c\u94b1\u8d27\u4e24\u6e05\u201d\uff09\uff0c\u7136\u540e\u79bb\u5f00\u6765\u4fdd\u5b58\u3002\u65e7\u7248\u672c\u4f1a\u7559\u5728\u540c\u4e00\u5f20\u5361\u7684\u5386\u53f2\u4e2d\u3002",
        cardChildSelectTitle: "\u521b\u5efa\u5b50\u5361\u7247",
        cardChildSelectText: "\u76ee\u7684\uff1a\u628a\u8f83\u957f\u7684\u7236\u5361\u77ed\u8bed\u62c6\u6210\u4e00\u4e2a\u66f4\u805a\u7126\u7684\u5b50\u610f\u601d\uff0c\u4f5c\u4e3a\u72ec\u7acb\u5b50\u5361\u8ddf\u8e2a\u3002\u4ee5\u201c\u94b1\u8d27\u4e24\u6e05\u201d\u4e3a\u7236\u5361\uff0c\u805a\u7126\u7236\u5361\u8f93\u5165\u6846\uff0c\u9ad8\u4eae\u9009\u4e2d\u201c\u94b1\u8d27\u201d\uff0c\u7136\u540e\u6309 Enter\u3002",
        cardChildCreatedTitle: "\u5b50\u5361\u5df2\u521b\u5efa",
        cardChildCreatedText: "\u6309 Enter \u540e\uff0c\u4f1a\u5728\u7236\u5361\u4e0b\u65b9\u521b\u5efa\u4e00\u5f20\u5b50\u5361\uff08\u5185\u5bb9\u4e3a\u9009\u4e2d\u5b50\u4e32\uff09\u3002\u53ef\u5728\u5b50\u5361\u4e0a\u7ee7\u7eed\u6267\u884c\u76f8\u540c\u64cd\u4f5c\u4ee5\u5d4c\u5957\u3002\u540c\u7ea7\u5b50\u5361\u4f1a\u6309\u7236\u6587\u672c\u4e2d\u9ad8\u4eae\u8d77\u59cb\u4f4d\u7f6e\u6392\u5e8f\uff0c\u6bcf\u5c42\u76f8\u5bf9\u7236\u5361\u5411\u53f3\u7f29\u8fdb +5px\u3002",
        cardNavVerticalTitle: "\u5728\u5361\u7247\u95f4\u79fb\u52a8",
        cardNavVerticalText: "\u6309 Ctrl+\u4e0a \u6216 Ctrl+\u4e0b\uff0c\u628a\u7126\u70b9\u79fb\u5230\u5176\u4ed6\u5361\u7247\u3002",
        cardNavHistoryTitle: "\u7f16\u8f91\u5f53\u524d\u5361\u7247",
        cardNavHistoryText: "\u76f4\u63a5\u7f16\u8f91\u5f53\u524d\u5361\u7247\uff0c\u79bb\u5f00\u6765\u4fdd\u5b58\uff0c\u6309 Ctrl+\u4e0a \u6216 Ctrl+\u4e0b \u5728\u5361\u7247\u95f4\u79fb\u52a8\u3002",
        cardDeleteTitle: "\u6253\u5f00\u5361\u7247\u5220\u9664\u5bf9\u8bdd",
        cardDeleteText: "\u4f7f\u7528\u5361\u7247\u7684\u5220\u9664\u64cd\u4f5c\u6765\u79fb\u9664\u5df2\u4fdd\u5b58\u7684\u5361\u7247\u3002",
        cardDeleteConfirmTitle: "\u5361\u7247\u5220\u9664\u64cd\u4f5c",
        cardDeleteConfirmText: "\u70b9 Cancel \u5173\u95ed\u5bf9\u8bdd\uff0c\u70b9 Delete \u5220\u9664\u5f53\u524d\u5361\u7247\u3002",
        exitValueModeTitle: "\u9000\u51fa\u8f93\u5165\u6a21\u5f0f",
        exitValueModeText: "\u5728\u9876\u90e8\u503c\u8f93\u5165\u6a21\u5f0f\u4e0b\u6309 Ctrl+Backspace\uff0c\u9000\u51fa\u503c\u8f93\u5165\u6a21\u5f0f\u3002",
        exitSubSegTitle: "\u9000\u51fa subSeg \u9009\u4e2d",
        exitSubSegText: "\u5728 subSeg \u5361\u7247\u7f16\u8f91\u5668\u91cc\uff0c\u6309 Ctrl+Backspace \u9000\u51fa\u5f53\u524d subSeg \u9009\u4e2d\u3002",
        exitTargetTitle: "\u9000\u51fa target audSeg",
        exitTargetText: "\u518d\u6309\u4e00\u6b21 Ctrl+Backspace\uff0c\u89e3\u9501\u5e76\u9000\u51fa target audSeg \u6a21\u5f0f\u3002",
        exitAudSegTitle: "\u9000\u51fa audSeg \u9009\u4e2d",
        exitAudSegText: "\u518d\u6309\u4e00\u6b21 Ctrl+Backspace\uff0c\u6e05\u9664\u4e3b\u65f6\u95f4\u8f74\u4e0a\u5f53\u524d audSeg \u9009\u4e2d\u3002",
        exitListTitle: "\u8fd4\u56de\u5217\u8868\u9875",
        exitListText: "\u65e0\u4efb\u4f55\u9009\u4e2d\u65f6\uff0c\u518d\u6309\u4e00\u6b21 Ctrl+Backspace \u8fd4\u56de\u5217\u8868\u9875\u3002"
      }
    };
    return copy[state.guideLanguage] || copy.en;
  }
  function setGuideLanguage(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    const next = data.language === "zh" ? "zh" : "en";
    state.guideLanguage = next;
    renderGuideLanguagePicker({ deps: {} });
    if (state.isGuideMode) {
      renderGuideStep({ deps: {} });
    }
  }

  function renderGuideLanguagePicker(ctx) {
    const { deps } = ctx;
    void deps;
    if (!guideLanguagePicker || !guideLangEn || !guideLangZh) {
      return;
    }
    guideLangEn.classList.toggle("is-active", state.guideLanguage === "en");
    guideLangZh.classList.toggle("is-active", state.guideLanguage === "zh");
  }

  function isGuideListPhase(ctx) {
    const { deps } = ctx;
    void deps;
    return state.guidePhase.indexOf("list-") === 0;
  }

  function applyGuidePhase(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    const phase = String(data.phase || "");
    state.guidePhase = phase;

    if (phase.indexOf("list-") === 0) {
      showIngestView();
      state.openMenuSessionId = null;
      cards.innerHTML = "";
      renderGuideAudioCards({ deps: {} });
      return;
    }

    showPlayerView();
    setPlayerLoading(false);
    renderGuidePlayerState({ data: { phase }, deps: {} });
  }

  function renderGuideAudioCards(ctx) {
    const { deps } = ctx;
    void deps;
    cards.innerHTML = "";
    emptyState.classList.add("hidden");
    const phase = state.guidePhase;

    if (phase === "list-language" || phase === "list-overview" || phase === "list-card-ready") {
      cards.appendChild(createGuideReadyCard({ deps: {} }));
      return;
    }

    if (phase === "list-card-upload") {
      cards.appendChild(createPendingAudioCard({
        file: { name: "Guide Demo - New Recording.mp3" },
        phase: "uploading",
        progress: 0.62
      }));
      return;
    }

    if (phase === "list-card-loading") {
      cards.appendChild(createGuideLoadingCard({ deps: {} }));
      return;
    }

    cards.appendChild(createGuideReadyCard({ deps: {} }));
  }

  function createGuideReadyCard(ctx) {
    const { deps } = ctx;
    void deps;
    const row = document.createElement("div");
    row.className = "audio-card-row";
    row.id = "guide-demo-card-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "audio-card audio-card-main";
    button.id = "guide-demo-card";

    const title = document.createElement("span");
    title.className = "audio-card-title";
    title.textContent = "Guide Demo - Episode 01.mp3";

    const meta = document.createElement("span");
    meta.className = "audio-card-meta";
    meta.textContent = "Guide sample  |  checkpoints: 6";

    button.appendChild(title);
    button.appendChild(meta);
    row.appendChild(button);

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "item-settings-button";
    settingsButton.textContent = "...";
    settingsButton.disabled = true;
    row.appendChild(settingsButton);
    return row;
  }

  function createGuideLoadingCard(ctx) {
    const { deps } = ctx;
    void deps;
    const row = document.createElement("div");
    row.className = "audio-card-row";
    row.id = "guide-demo-card-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "audio-card audio-card-main is-loading";
    button.id = "guide-demo-card";
    button.disabled = true;

    const title = document.createElement("span");
    title.className = "audio-card-title";
    title.textContent = "Guide Demo - Episode 01.mp3";
    const meta = document.createElement("span");
    meta.className = "audio-card-meta";
    meta.textContent = "Opening...";
    button.appendChild(title);
    button.appendChild(meta);
    button.appendChild(createProgressRow({ mode: "indeterminate", label: "Loading audio..." }));
    row.appendChild(button);
    return row;
  }

  function renderGuideCheckpointMarkers(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    const markers = Array.isArray(data.markers) ? data.markers : [];
    checkpointMarkers.innerHTML = "";
    markers.forEach(function (markerDef) {
      const marker = document.createElement("span");
      marker.className = "checkpoint-marker";
      if (markerDef.boundary === "start" || markerDef.boundary === "end") {
        marker.classList.add("is-cycle-target-" + markerDef.boundary);
        marker.classList.add("is-tag-target");
      }
      marker.style.left = String(markerDef.pct || 0) + "%";

      const tag = document.createElement("span");
      tag.className = "checkpoint-tag";
      if (markerDef.deleteTarget) {
        tag.classList.add("is-delete-target");
        marker.classList.add("is-tag-target");
      }
      if (markerDef.boundary === "start" || markerDef.boundary === "end") {
        tag.classList.add("cycle-target-tag", "cycle-target-tag-" + markerDef.boundary);
      }
      tag.textContent = String(markerDef.label || "");
      marker.appendChild(tag);
      checkpointMarkers.appendChild(marker);
    });
  }

  function renderGuideBoundaryTagMarkers(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    const container = data.container;
    const startLabel = String(data.startLabel || "");
    const endLabel = String(data.endLabel || "");
    const tagExtraClass = String(data.tagExtraClass || "");
    if (!container) {
      return;
    }
    [
      { pct: 0, label: startLabel },
      { pct: 100, label: endLabel }
    ].forEach(function (item) {
      const marker = document.createElement("span");
      marker.className = "checkpoint-marker";
      marker.style.left = String(item.pct) + "%";
      const tag = document.createElement("span");
      tag.className = "checkpoint-tag" + (tagExtraClass ? " " + tagExtraClass : "");
      tag.textContent = item.label;
      marker.appendChild(tag);
      container.appendChild(marker);
    });
  }

  function trapPageTabFocus(event) {
    const targets = getPageTabTargets();
    if (!targets.length) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    const active = document.activeElement;
    const currentIndex = targets.indexOf(active);
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = currentIndex < 0
      ? (event.shiftKey ? targets.length - 1 : 0)
      : (currentIndex + direction + targets.length) % targets.length;
    focusPageTabTarget(targets[nextIndex]);
    return true;
  }

  function getPageTabTargets() {
    const roots = [];
    if (document.querySelector(".app")) {
      roots.push(document.querySelector(".app"));
    }
    if (playerView && !playerView.classList.contains("hidden")) {
      roots.push(playerView);
    }
    if (guideOverlay && !guideOverlay.classList.contains("hidden")) {
      roots.push(guideOverlay);
    }

    const seen = new Set();
    const focusables = [];
    const selector = "button, input, select, textarea, a[href], [contenteditable=\"true\"], [tabindex]";
    roots.forEach(function (root) {
      Array.from(root.querySelectorAll(selector)).forEach(function (el) {
        if (!el || seen.has(el)) {
          return;
        }
        if (el === playerSection) {
          return;
        }
        if (el === subSegValuePanel) {
          return;
        }
        seen.add(el);
        if (!isTabbableElement(el)) {
          return;
        }
        focusables.push(el);
      });
    });
    return focusables;
  }

  function isTabbableElement(el) {
    if (!el || el.hidden || el.getAttribute("aria-hidden") === "true") {
      return false;
    }
    if (el === playerSection) {
      return false;
    }
    if (el === subSegValuePanel) {
      return false;
    }
    if (el.disabled) {
      return false;
    }
    const tabindex = el.getAttribute("tabindex");
    if (tabindex === "-1") {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (!style || style.visibility === "hidden" || style.display === "none") {
      return false;
    }
    return el.getClientRects().length > 0;
  }

  function focusPageTabTarget(el) {
    if (!el) {
      return;
    }
    try {
      el.focus({ preventScroll: true });
    } catch {
      try {
        el.focus();
      } catch {
        // Ignore focus failures.
      }
    }
  }

  function isFocusedSubSegEditor() {
    const active = document.activeElement;
    if (!active) {
      return false;
    }
    if (active === subSegValueInput) {
      return true;
    }
    return Boolean(
      subSegValuePanel &&
      subSegValuePanel.contains(active) &&
      active.classList &&
      active.classList.contains("subseg-value-card-input")
    );
  }

  function isFocusedSubSegCommentBubble() {
    const active = document.activeElement;
    if (!active) {
      return false;
    }
    return Boolean(
      active.classList &&
      active.classList.contains("subseg-value-comment-bubble")
    );
  }

  function setSelectedSpanOverlayTag(text) {
    if (!selectedSpanOverlay) {
      return;
    }
    selectedSpanOverlay.innerHTML = "";
    const label = String(text || "").trim();
    if (!label) {
      return;
    }
    const tag = document.createElement("span");
    tag.className = "checkpoint-tag selected-span-tag";
    tag.textContent = label;
    tag.setAttribute("role", "button");
    tag.setAttribute("tabindex", "0");
    selectedSpanOverlay.appendChild(tag);
  }

  function getAudSegNoteKey() {
    const target = getTargetSpanBounds();
    if (target) {
      return target.start.toFixed(3) + "|" + target.end.toFixed(3);
    }
    if (!isCheckpointCycleSelectMode()) {
      return "";
    }
    const span = getSpanBoundsByIndex(state.selectedSpanIndex);
    if (!span) {
      return "";
    }
    return span.start.toFixed(3) + "|" + span.end.toFixed(3);
  }

  function getAudSegNoteHtmlForCurrentTarget() {
    const key = getAudSegNoteKey();
    if (!key) {
      return "";
    }
    return String(state.audSegNoteEntries[key] || "");
  }

  function setAudSegNoteHtmlForCurrentTarget(html) {
    const key = getAudSegNoteKey();
    if (!key) {
      return;
    }
    const value = String(html || "");
    const previous = String(state.audSegNoteEntries[key] || "");
    logRuntimeAction("audseg-note:change", {
      key,
      previousHtml: previous,
      nextHtml: value,
      previousText: htmlToPlainText(previous).trim(),
      nextText: htmlToPlainText(value).trim()
    });
    if (value) {
      state.audSegNoteEntries[key] = value;
    } else {
      delete state.audSegNoteEntries[key];
    }
    logRuntimeState("audseg-note:html", previous, value);
  }

  function handleAudSegTagActivation() {
    logRuntimeAction("audseg:tag-activate", {
      hasTargetSpan: hasTargetSpan(),
      selectedSpanIndex: state.selectedSpanIndex,
      targetSpanIndex: state.targetSpanIndex
    });
    if (!hasTargetSpan()) {
      lockSelectedSpanAsTarget();
      return;
    }
  }

  function handleAudSegNoteInput() {
    if (!audSegNoteEditor) {
      return;
    }
    const nextHtml = String(audSegNoteEditor.innerHTML || "");
    const nextText = String(audSegNoteEditor.textContent || "").trim();
    const previous = String(state.audSegNoteEntries[getAudSegNoteKey()] || "");
    logRuntimeAction("audseg-note:input", {
      key: getAudSegNoteKey(),
      visible: Boolean(state.audSegNoteEditorVisible),
      previousHtml: previous,
      nextHtml,
      previousText: htmlToPlainText(previous).trim(),
      nextText
    });
    setAudSegNoteHtmlForCurrentTarget(nextHtml);
  }

  function handleAudSegNoteEditorKeyDown(event) {
    if (!event || !event.shiftKey) {
      return;
    }
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    const isArrowRight = keyCode === "ArrowRight" || keyValue === "ArrowRight" || keyValue === "Right";
    const isArrowLeft = keyCode === "ArrowLeft" || keyValue === "ArrowLeft" || keyValue === "Left";
    const isBackspaceKey = keyCode === "Backspace" || keyValue === "Backspace";
    const isSpaceKey = keyCode === "Space" || keyValue === " " || keyValue === "Spacebar";
    logRuntimeAction("audseg-note:keydown", {
      code: keyCode,
      key: keyValue,
      isBackspaceKey,
      isSpaceKey,
      isArrowLeft,
      isArrowRight
    });
    if (isSpaceKey) {
      event.preventDefault();
      event.stopPropagation();
      if (audio.paused) {
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
      return;
    }
    if (isBackspaceKey) {
      event.preventDefault();
      event.stopPropagation();
      handlePlayerCtrlBackspaceShortcut();
      return;
    }
    if (isArrowLeft || isArrowRight) {
      event.preventDefault();
      event.stopPropagation();
      handlePlayerCtrlArrowShortcut(isArrowRight ? 1 : -1);
    }
  }

  function handleAudSegNoteEditorBeforeInput(event) {
    const inputType = String(event && event.inputType ? event.inputType : "");
    if (inputType === "deleteWordBackward" || inputType === "deleteWordForward") {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handlePlayerCtrlBackspaceShortcut() {
    if (!isPlayerActive()) {
      return;
    }
    logRuntimeAction("audseg:ctrl-backspace", {
      deleteConfirmOpen: state.deleteConfirmOpen,
      deleteTargetType: state.deleteTargetType,
      activeSubSegValueKey: state.activeSubSegValueKey,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
      targetSpanIndex: state.targetSpanIndex,
      selectedSpanIndex: state.selectedSpanIndex
    });
    if (state.deleteConfirmOpen || hasDeleteTargetSelection()) {
      clearDeleteTarget({ silent: false });
      updateUi();
      return;
    }
    if (state.activeSubSegValueKey) {
      const activeKey = state.activeSubSegValueKey;
      state.activeSubSegValueKey = null;
      if (subSegValueInput) {
        subSegValueInput.innerHTML = "";
      }
      delete state.subSegDraftHtmlByKey[activeKey];
      renderSubSegValuePanel();
      setSaveStatus("audSeg subSeg value selection cleared");
      return;
    }
    if (state.selectedTargetSubSegIndex >= 0) {
      state.selectedTargetSubSegIndex = -1;
      updateUi();
      setSaveStatus("audSeg subSeg deselected");
      return;
    }
    if (hasTargetSpan()) {
      clearTargetSpanLock({ preserveSelection: true });
      updateUi();
      setSaveStatus("audSeg target unlocked");
      return;
    }
    if (state.selectedSpanIndex >= 0) {
      state.selectedSpanIndex = -1;
      updateUi();
      setSaveStatus("audSeg deselected");
      enqueueAutoSave();
      return;
    }
    goBackToLibrary();
  }

  function handlePlayerCtrlArrowShortcut(direction) {
    if (!isPlayerActive() || !audio.src) {
      return;
    }
    logRuntimeAction("audseg:ctrl-arrow", {
      direction,
      hasTargetSpan: hasTargetSpan(),
      selectedSpanIndex: state.selectedSpanIndex,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex
    });
    const latchKey = direction > 0 ? "right" : "left";
    const latchMode = hasTargetSpan() ? "target" : "span";
    if (state.cycleLatch[latchKey] === latchMode) {
      return;
    }
    state.cycleLatch[latchKey] = latchMode;
    if (hasTargetSpan()) {
      cycleTargetSubSegSelection(direction);
      return;
    }
    if (getCheckpointSeries().length <= 1) {
      return;
    }
    cycleSpanSelection(direction);
    debugLog("keydown:cycleSpan", { dir: direction, selectedSpanIndex: state.selectedSpanIndex });
  }

  function focusAudSegNoteEditor() {
    if (!audSegNoteEditor) {
      return;
    }
    requestAnimationFrame(function () {
      try {
        audSegNoteEditor.focus({ preventScroll: true });
      } catch {
        audSegNoteEditor.focus();
      }
      syncAudSegEditorFocusState();
    });
  }

  function syncAudSegEditorFocusState() {
    if (!playerSection) {
      return;
    }
    const isFocused = Boolean(audSegNoteEditor && document.activeElement === audSegNoteEditor);
    playerSection.classList.toggle("is-audseg-note-focused", isFocused);
  }

  function syncSubSegDraftEditorFocusState() {
    if (!subSegValuePanel) {
      return;
    }
    const isFocused = Boolean(subSegValueInput && document.activeElement === subSegValueInput);
    subSegValuePanel.classList.toggle("is-subseg-draft-focused", isFocused);
  }

  function handleSelectedSpanOverlayInteraction(event) {
    const key = event && event.key ? String(event.key) : "";
    const isKeyboardToggle = event && event.type === "keydown" && (key === "Enter" || key === " " || key === "Spacebar");
    const isClickToggle = event && event.type === "click";
    if (!isClickToggle && !isKeyboardToggle) {
      return;
    }
    const target = event && event.target && event.target.closest
      ? event.target.closest(".selected-span-tag")
      : null;
    if (!target || !selectedSpanOverlay || !selectedSpanOverlay.contains(target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    handleAudSegTagActivation();
  }

  function toggleAudSegNoteEditorVisibility(forceVisible, options) {
    const shouldShow = typeof forceVisible === "boolean"
      ? forceVisible
      : !state.audSegNoteEditorVisible;
    const shouldFocus = !(options && options.focus === false);
    logRuntimeAction("audseg-note:toggle-visibility", {
      previousVisible: Boolean(state.audSegNoteEditorVisible),
      nextVisible: shouldShow,
      focus: shouldFocus,
      currentKey: getAudSegNoteKey()
    });
    state.audSegNoteEditorVisible = shouldShow;
    renderAudSegNotePanel();
    if (shouldShow && shouldFocus) {
      focusAudSegNoteEditor();
      return;
    }
    if (audSegNoteEditor && document.activeElement === audSegNoteEditor) {
      audSegNoteEditor.blur();
    }
    syncAudSegEditorFocusState();
  }

  function renderAudSegNotePanel() {
    if (!audSegNoteEditor) {
      return;
    }
    const key = getAudSegNoteKey();
    const isVisible = Boolean(key && shouldShowAudSegNoteEditor());
    const isProgressActive = Boolean(hasTargetSpan());
    const collapsedGap = 10;
    const activeMarginTop = isProgressActive
      ? Math.round(collapsedGap - (audSegNoteEditor.offsetHeight * 0.5))
      : collapsedGap;
    const previousKey = String(audSegNoteEditor.dataset.audSegNoteKey || "");
    state.audSegNoteEditorVisible = isVisible;
    audSegNoteEditor.classList.toggle("hidden", !isVisible);
    audSegNoteEditor.classList.toggle("is-progress-active", isProgressActive);
    audSegNoteEditor.setAttribute("tabindex", isProgressActive ? "-1" : "0");
    audSegNoteEditor.setAttribute("aria-disabled", isProgressActive ? "true" : "false");
    audSegNoteEditor.contentEditable = isProgressActive ? "false" : "true";
    if (targetProgressWrap) {
      targetProgressWrap.style.marginTop = isVisible ? String(activeMarginTop) + "px" : collapsedGap + "px";
    }
    if (!isVisible) {
      audSegNoteEditor.dataset.audSegNoteKey = "";
      if (audSegNoteEditor && document.activeElement === audSegNoteEditor) {
        audSegNoteEditor.blur();
      }
      syncAudSegEditorFocusState();
      return;
    }
    const html = String(state.audSegNoteEntries[key] || "");
    audSegNoteEditor.dataset.audSegNoteKey = key;
    if (previousKey !== key || audSegNoteEditor.innerHTML !== html) {
      audSegNoteEditor.innerHTML = html;
    }
    syncAudSegEditorFocusState();
  }

  function shouldShowAudSegNoteEditor() {
    return hasTargetSpan() || isCheckpointCycleSelectMode() || state.selectedTargetSubSegIndex >= 0;
  }

  function renderGuideTargetSubSeg(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    const mode = String(data.mode || "complete");
    const deleteTarget = Boolean(data.deleteTarget);
    if (targetSubSegActiveFill) {
      if (mode === "complete") {
        targetSubSegActiveFill.style.display = "block";
        targetSubSegActiveFill.style.left = "34%";
        targetSubSegActiveFill.style.width = "18%";
      } else {
        targetSubSegActiveFill.style.display = "none";
      }
    }
    if (targetCheckpointMarkers) {
      targetCheckpointMarkers.innerHTML = "";
      renderGuideBoundaryTagMarkers({
        data: {
          container: targetCheckpointMarkers,
          startLabel: "01:25",
          endLabel: "02:12",
          tagExtraClass: "target-subseg-tag"
        },
        deps: {}
      });
      if (mode === "start-only") {
        const marker = document.createElement("span");
        marker.className = "checkpoint-marker is-cycle-target-start";
        marker.style.left = "34.4%";
        const tag = document.createElement("span");
        tag.className = "checkpoint-tag cycle-target-tag cycle-target-tag-start checkpoint-tag-target-start";
        tag.textContent = "subSeg start";
        marker.appendChild(tag);
        targetCheckpointMarkers.appendChild(marker);
      } else {
        const span = document.createElement("span");
        span.className = "target-subseg-span selected";
        span.style.left = "34.4%";
        span.style.width = "18.7%";
        const tag = document.createElement("span");
        tag.className = "checkpoint-tag target-subseg-tag";
        if (deleteTarget) {
          tag.classList.add("is-delete-target");
        }
        tag.textContent = "01:41-49";
        span.appendChild(tag);
        targetCheckpointMarkers.appendChild(span);
      }
    }
  }

  function hideGuideDeleteDialog() {
    if (!deleteConfirmDialog) {
      return;
    }
    deleteConfirmDialog.classList.add("hidden");
  }

  function showGuideDeleteDialog(summary) {
    if (!deleteConfirmDialog || !deleteConfirmText) {
      return;
    }
    deleteConfirmText.textContent = "Delete " + String(summary || "target") + "? This cannot be undone.";
    deleteConfirmDialog.classList.remove("hidden");
  }

  function renderGuideMainSubSegOverlay(ctx) {
    const { deps } = ctx;
    void deps;
    if (!subSegOverlays) {
      return;
    }
    subSegOverlays.innerHTML = "";
    const span = document.createElement("span");
    span.className = "subseg-main-span";
    span.style.left = "44%";
    span.style.width = "7%";
    subSegOverlays.appendChild(span);
  }

  function renderGuidePlayerState(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    const phase = String(data.phase || "");
    const guideCopy = getGuideCopy({ deps: {} });
    stopGuideNavInputBlink();
    fileName.textContent = "Guide Demo - Episode 01.mp3";
    hideGuideDeleteDialog();
    progress.disabled = true;
    progress.value = 320;
    progress.style.setProperty("--progress-pct", "32%");
    playhead.style.left = "32%";
    playheadTime.textContent = "01:12";
    if (subSegOverlays) {
      subSegOverlays.innerHTML = "";
    }
    if (audSegNoteEditor) {
      audSegNoteEditor.classList.add("hidden");
    }
    selectedSpanOverlay.style.display = "none";
    selectedSpanOverlay.style.left = "0%";
    selectedSpanOverlay.style.width = "0%";
    selectedSpanOverlay.classList.remove("is-cycle-select");
    setSelectedSpanOverlayTag("");

    if (phase === "player-main" || phase === "player-overview") {
      checkpointMarkers.innerHTML = "";
      renderGuideBoundaryTagMarkers({
        data: {
          container: checkpointMarkers,
          startLabel: "00:00",
          endLabel: "03:45"
        },
        deps: {}
      });
      targetProgressWrap.classList.add("hidden");
      subSegValuePanel.classList.add("hidden");
      subSegValueList.innerHTML = "";
      return;
    }

    if (
      phase === "player-checkpoint-set" ||
      phase === "player-checkpoint-add" ||
      phase === "player-checkpoint-delete-target" ||
      phase === "player-checkpoint-delete-confirm" ||
      phase === "player-checkpoint-cycle"
    ) {
      if (phase === "player-checkpoint-set") {
        progress.value = 378;
        progress.style.setProperty("--progress-pct", "37.8%");
        playhead.style.left = "37.8%";
        playheadTime.textContent = "01:25";
      } else {
        progress.value = 378;
        progress.style.setProperty("--progress-pct", "37.8%");
        playhead.style.left = "37.8%";
        playheadTime.textContent = "01:25";
      }
      renderGuideCheckpointMarkers({
        data: {
          markers: phase === "player-checkpoint-set"
            ? [
              { pct: 13.8, label: "00:31" },
              { pct: 58.7, label: "02:12" },
              { pct: 84, label: "03:09" }
            ]
            : [
              { pct: 13.8, label: "00:31" },
              { pct: 37.8, label: "01:25", boundary: "start" },
              { pct: 58.7, label: "02:12", boundary: "end", deleteTarget: phase === "player-checkpoint-delete-target" || phase === "player-checkpoint-delete-confirm" },
              { pct: 84, label: "03:09" }
            ]
        },
        deps: {}
      });
      renderGuideBoundaryTagMarkers({
        data: {
          container: checkpointMarkers,
          startLabel: "00:00",
          endLabel: "03:45"
        },
        deps: {}
      });
      if (phase === "player-checkpoint-cycle") {
        selectedSpanOverlay.style.display = "block";
        selectedSpanOverlay.style.left = "37.8%";
        selectedSpanOverlay.style.width = "20.9%";
        selectedSpanOverlay.classList.add("is-cycle-select");
        setSelectedSpanOverlayTag("01:25-02:12");
      }
      if (phase === "player-checkpoint-delete-confirm") {
        showGuideDeleteDialog(guideCopy.guideCheckpointDeleteSummary || "checkpoint at 02:12");
      }
      targetProgressWrap.classList.add("hidden");
      subSegValuePanel.classList.add("hidden");
      subSegValueList.innerHTML = "";
      return;
    }

    targetProgressWrap.classList.remove("hidden");
    targetProgress.disabled = true;
    progress.value = 413;
    progress.style.setProperty("--progress-pct", "41.3%");
    playhead.style.left = "41.3%";
    playheadTime.textContent = "01:33";
    targetProgress.value = 170;
    targetProgress.style.setProperty("--progress-pct", "17%");
    targetPlayhead.style.left = "17%";
    targetPlayheadTime.textContent = "01:33";
    if (phase === "player-subseg-start") {
      progress.value = 449;
      progress.style.setProperty("--progress-pct", "44.9%");
      playhead.style.left = "44.9%";
      playheadTime.textContent = "01:41";
      targetProgress.value = 344;
      targetProgress.style.setProperty("--progress-pct", "34.4%");
      targetPlayhead.style.left = "34.4%";
      targetPlayheadTime.textContent = "01:41";
    } else if (phase === "player-subseg-end") {
      progress.value = 486;
      progress.style.setProperty("--progress-pct", "48.6%");
      playhead.style.left = "48.6%";
      playheadTime.textContent = "01:49";
      targetProgress.value = 531;
      targetProgress.style.setProperty("--progress-pct", "53.1%");
      targetPlayhead.style.left = "53.1%";
      targetPlayheadTime.textContent = "01:49";
    }
    if (targetSubSegActiveFill) {
      targetSubSegActiveFill.style.display = "none";
      targetSubSegActiveFill.style.left = "0%";
      targetSubSegActiveFill.style.width = "0%";
    }
    if (targetCheckpointMarkers) {
      targetCheckpointMarkers.innerHTML = "";
      renderGuideBoundaryTagMarkers({
        data: {
          container: targetCheckpointMarkers,
          startLabel: "01:25",
          endLabel: "02:12",
          tagExtraClass: "target-subseg-tag"
        },
        deps: {}
      });
    }

    if (phase === "player-focus") {
      subSegValuePanel.classList.add("hidden");
      subSegValueList.innerHTML = "";
      return;
    }

    if (
      phase === "player-subseg-start" ||
      phase === "player-subseg-end" ||
      phase === "player-subseg-select" ||
      phase === "player-subseg-delete-target" ||
      phase === "player-subseg-delete-confirm" ||
      phase === "player-input" ||
      phase === "player-card-first-input" ||
      phase === "player-cards" ||
      phase === "player-card-edit" ||
      phase === "player-card-nav-history" ||
      phase === "player-card-child-select" ||
      phase === "player-card-child-created" ||
      phase === "player-card-nav-list" ||
      phase === "player-card-delete" ||
      phase === "player-card-delete-confirm" ||
      phase === "player-exit-value-mode" ||
      phase === "player-exit-subseg" ||
      phase === "player-exit-target" ||
      phase === "player-exit-audseg" ||
      phase === "player-exit-list"
    ) {
      const targetMode = phase === "player-subseg-start" ? "start-only" : "complete";
      renderGuideTargetSubSeg({
        data: {
          mode: targetMode,
          deleteTarget: phase === "player-subseg-delete-target" || phase === "player-subseg-delete-confirm"
        },
        deps: {}
      });
      if (targetMode === "complete") {
        renderGuideMainSubSegOverlay({ deps: {} });
      }
    }

    if (phase === "player-exit-audseg" || phase === "player-exit-list") {
      if (targetSubSegActiveFill) {
        targetSubSegActiveFill.style.display = "none";
      }
      if (targetCheckpointMarkers) {
        targetCheckpointMarkers.innerHTML = "";
      }
    }

    if (phase === "player-exit-audseg" || phase === "player-exit-list") {
      targetProgressWrap.classList.add("hidden");
      selectedSpanOverlay.style.display = "block";
      selectedSpanOverlay.style.left = "37.8%";
      selectedSpanOverlay.style.width = "20.9%";
      selectedSpanOverlay.classList.remove("is-cycle-select");
      setSelectedSpanOverlayTag("");
    }

    if (phase === "player-exit-list") {
      selectedSpanOverlay.style.display = "none";
      setSelectedSpanOverlayTag("");
    }

    if (phase === "player-subseg-delete-confirm") {
      showGuideDeleteDialog(guideCopy.guideSubSegDeleteSummary || "subSeg 01:41-49");
    }

    if (
      phase === "player-subseg-card" ||
      phase === "player-subseg-start" ||
      phase === "player-subseg-end" ||
      phase === "player-subseg-select" ||
      phase === "player-subseg-delete-target" ||
      phase === "player-subseg-delete-confirm"
    ) {
      subSegValuePanel.classList.add("hidden");
      subSegValueList.innerHTML = "";
      return;
    }

    subSegValuePanel.classList.remove("hidden");
    if (subSegValueInput) {
      subSegValueInput.contentEditable = "true";
      subSegValueInput.innerHTML = "";
    }

    if (phase === "player-input") {
      subSegValueList.innerHTML = "";
      return;
    }
    if (phase === "player-card-first-input") {
      if (subSegValueInput) {
        subSegValueInput.innerHTML = "å‰åŽä¸¤æ¸…";
      }
      subSegValueList.innerHTML = "";
      return;
    }

    if (
      phase === "player-card-edit" ||
      phase === "player-cards" ||
      phase === "player-card-nav-history" ||
      phase === "player-card-child-select" ||
      phase === "player-card-child-created" ||
      phase === "player-card-nav-list" ||
      phase === "player-card-delete" ||
      phase === "player-card-delete-confirm" ||
      phase === "player-exit-value-mode" ||
      phase === "player-exit-subseg"
    ) {
      subSegValueList.innerHTML = "";
      if (phase === "player-card-child-select" || phase === "player-card-child-created") {
        const showCreated = phase === "player-card-child-created";
        const cluster = document.createElement("div");
        if (showCreated) {
          cluster.id = "guide-card-child-cluster";
        }
        const rootCard = document.createElement("div");
        rootCard.className = "subseg-value-card";
        const rootVersion = document.createElement("div");
        rootVersion.className = "subseg-value-version";
        rootVersion.textContent = "current -0 | current version";
        const rootInput = document.createElement("input");
        rootInput.type = "text";
        rootInput.className = "subseg-value-card-input";
        rootInput.value = "é’±è´§ä¸¤æ¸…";
        rootInput.readOnly = true;
        rootInput.style.outline = "2px solid #6e92c9";
        rootInput.style.borderRadius = "4px";
        if (!showCreated) {
          rootInput.id = "guide-card-child-select-target";
        }
        rootCard.appendChild(rootVersion);
        rootCard.appendChild(rootInput);
        cluster.appendChild(rootCard);

        if (showCreated) {
          const childCard = document.createElement("div");
          childCard.className = "subseg-value-card is-nested is-last-sibling";
          childCard.style.setProperty("--subseg-card-depth", "1");
          childCard.style.setProperty("--subseg-card-line-left", "-4px");
          childCard.style.setProperty("--subseg-card-bridge-left", "-4px");
          childCard.style.setProperty("--subseg-card-bridge-width", "4px");
          const childVersion = document.createElement("div");
          childVersion.className = "subseg-value-version";
          childVersion.textContent = "current -0 | child card";
          const childInput = document.createElement("input");
          childInput.type = "text";
          childInput.className = "subseg-value-card-input";
          childInput.value = "é’±è´§";
          childInput.readOnly = true;
          childCard.appendChild(childVersion);
          childCard.appendChild(childInput);
          cluster.appendChild(childCard);
        }

        subSegValueList.appendChild(cluster);
        if (!showCreated) {
          requestAnimationFrame(function () {
            try {
              rootInput.focus({ preventScroll: true });
            } catch {
              rootInput.focus();
            }
            try {
              rootInput.setSelectionRange(0, 2);
            } catch {
              // Ignore selection failures.
            }
          });
        }
        return;
      }
      if (phase === "player-card-nav-list") {
        const cluster = document.createElement("div");
        cluster.id = "guide-card-nav-list-cluster";

        const rootCard = document.createElement("div");
        rootCard.className = "subseg-value-card";
        const rootVersion = document.createElement("div");
        rootVersion.className = "subseg-value-version";
        rootVersion.textContent = "current -0 | current version";
        const rootInput = document.createElement("input");
        rootInput.type = "text";
        rootInput.className = "subseg-value-card-input";
        rootInput.id = "guide-nav-parent-input";
        rootInput.value = "é’±è´§ä¸¤æ¸…";
        rootInput.readOnly = false;
        rootInput.classList.add("guide-nav-caret-demo");
        rootInput.addEventListener("beforeinput", function (event) {
          event.preventDefault();
        });
        rootInput.addEventListener("keydown", function (event) {
          event.preventDefault();
        });
        rootCard.appendChild(rootVersion);
        rootCard.appendChild(rootInput);
        cluster.appendChild(rootCard);

        const childCard = document.createElement("div");
        childCard.className = "subseg-value-card is-nested is-last-sibling";
        childCard.style.setProperty("--subseg-card-depth", "1");
        childCard.style.setProperty("--subseg-card-line-left", "-4px");
        childCard.style.setProperty("--subseg-card-bridge-left", "-4px");
        childCard.style.setProperty("--subseg-card-bridge-width", "4px");
        const childVersion = document.createElement("div");
        childVersion.className = "subseg-value-version";
        childVersion.textContent = "current -0 | child card";
        const childInput = document.createElement("input");
        childInput.type = "text";
        childInput.className = "subseg-value-card-input";
        childInput.id = "guide-nav-child-input";
        childInput.value = "é’±è´§";
        childInput.readOnly = false;
        childInput.classList.add("guide-nav-caret-demo");
        childInput.addEventListener("beforeinput", function (event) {
          event.preventDefault();
        });
        childInput.addEventListener("keydown", function (event) {
          event.preventDefault();
        });
        childCard.appendChild(childVersion);
        childCard.appendChild(childInput);
        cluster.appendChild(childCard);

        subSegValueList.appendChild(cluster);
        startGuideNavInputBlink([rootInput, childInput]);
        return;
      }
      const card = document.createElement("div");
      card.className = "subseg-value-card";
      const editing = phase === "player-card-edit";

      const version = document.createElement("div");
      version.className = "subseg-value-version";
      version.textContent = "current version";

      const inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.className = "subseg-value-card-input";
      inputEl.value = "\u524d\u540e\u4e24\u6e05";
      inputEl.readOnly = false;
      if (phase === "player-card-delete" || phase === "player-card-delete-confirm") {
        inputEl.style.outline = "2px solid #6e92c9";
        inputEl.style.borderRadius = "4px";
        inputEl.id = "guide-card-delete-target";
      }
      if (editing) {
        inputEl.style.outline = "2px solid #6e92c9";
        inputEl.style.borderRadius = "4px";
      }

      card.appendChild(version);
      card.appendChild(inputEl);

      if (phase === "player-card-delete" || phase === "player-card-delete-confirm") {
        const actions = document.createElement("div");
        actions.className = "subseg-value-delete-row";
        actions.id = "guide-card-delete-actions";
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "subseg-value-delete-cancel";
        cancelButton.id = "guide-delete-cancel";
        cancelButton.textContent = "Cancel";
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "subseg-value-delete-confirm";
        deleteButton.id = "guide-delete-confirm";
        deleteButton.textContent = "Delete";
        actions.appendChild(cancelButton);
        actions.appendChild(deleteButton);
        card.appendChild(actions);
      }

      subSegValueList.appendChild(card);
    }
  }

  function stopGuideNavInputBlink() {
    if (state.guideNavBlinkTimerId) {
      window.clearInterval(state.guideNavBlinkTimerId);
      state.guideNavBlinkTimerId = null;
    }
    state.guideNavBlinkIndex = 0;
  }

  function startGuideNavInputBlink(inputs) {
    const list = Array.isArray(inputs)
      ? inputs.filter(function (el) { return Boolean(el); })
      : [];
    if (list.length < 2) {
      return;
    }
    stopGuideNavInputBlink();
    function focusIndex(index) {
      const target = list[index % list.length];
      if (!target) {
        return;
      }
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
      const len = String(target.value || "").length;
      try {
        target.setSelectionRange(len, len);
      } catch {
        // Ignore selection failures.
      }
    }
    focusIndex(0);
    state.guideNavBlinkIndex = 0;
    state.guideNavBlinkTimerId = window.setInterval(function () {
      state.guideNavBlinkIndex = (state.guideNavBlinkIndex + 1) % list.length;
      focusIndex(state.guideNavBlinkIndex);
    }, 650);
  }

  function startGuideMode(ctx) {
    const { deps } = ctx;
    void deps;
    if (loginView && !loginView.classList.contains("hidden")) {
      setLoginStatus("Log in first, then start Guide.", true);
      return;
    }
    if (!guideOverlay || !guideSpotlight || !guideTooltip || !guideStepTitle || !guideStepText || !guideStepCounter) {
      return;
    }
    if (!audio.paused) {
      audio.pause();
    }
    if (state.workspacePhase === "ingest") {
      showIngestView();
    } else if (state.workspacePhase === "player") {
      showPlayerView();
    } else {
      showLibraryView();
    }
    state.guideSteps = buildGuideSteps({ deps: {} });
    if (!Array.isArray(state.guideSteps) || state.guideSteps.length === 0) {
      return;
    }
    state.isGuideMode = true;
    state.guideStepIndex = 0;
    state.guidePhase = "list-language";
    state.guideTooltipLocked = false;
    markGuideFeatureSeenForCurrentUser();
    renderGuideFeatureBadge();
    guideOverlay.classList.remove("hidden");
    renderGuideLanguagePicker({ deps: {} });
    renderGuideStep({ deps: {} });
  }

  function stopGuideMode(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    if (!state.isGuideMode && (!guideOverlay || guideOverlay.classList.contains("hidden"))) {
      return;
    }
    state.isGuideMode = false;
    state.guideStepIndex = -1;
    state.guideSteps = [];
    state.guideTooltipLocked = false;
    stopGuideNavInputBlink();
    if (state.guideRafId) {
      cancelAnimationFrame(state.guideRafId);
      state.guideRafId = null;
    }
    if (guideOverlay) {
      guideOverlay.classList.add("hidden");
    }
    if (guideLanguagePicker) {
      guideLanguagePicker.classList.add("hidden");
    }
    targetProgressWrap.classList.add("hidden");
    subSegValuePanel.classList.add("hidden");
    subSegValueList.innerHTML = "";
    if (state.workspacePhase === "ingest") {
      showIngestView();
    } else if (state.workspacePhase === "player") {
      showPlayerView();
    } else {
      showLibraryView();
    }
    renderAudioCards(state.sessionsCache);
    if (!data.silent) {
      setSaveStatus(getGuideCopy({ deps: {} }).closed);
    }
  }

  function moveGuideStep(ctx) {
    const { data = {}, deps } = ctx;
    void deps;
    if (!state.isGuideMode || !Array.isArray(state.guideSteps) || state.guideSteps.length === 0) {
      return;
    }
    const delta = Number.isFinite(data.delta) ? data.delta : 0;
    if (!delta) {
      return;
    }
    const nextIndex = state.guideStepIndex + delta;
    if (nextIndex < 0) {
      state.guideStepIndex = 0;
      renderGuideStep({ deps: {} });
      return;
    }
    if (nextIndex >= state.guideSteps.length) {
      stopGuideMode({ data: { reason: "complete", silent: true }, deps: {} });
      setSaveStatus(getGuideCopy({ deps: {} }).complete);
      return;
    }
    state.guideStepIndex = nextIndex;
    renderGuideStep({ deps: {} });
  }

  function scheduleGuideStepRender(ctx) {
    const { deps } = ctx;
    void deps;
    if (!state.isGuideMode) {
      return;
    }
    if (state.guideRafId) {
      cancelAnimationFrame(state.guideRafId);
      state.guideRafId = null;
    }
    state.guideRafId = requestAnimationFrame(function () {
      state.guideRafId = null;
      renderGuideStep({ deps: {} });
    });
  }

  function renderGuideStep(ctx) {
    const { deps } = ctx;
    void deps;
    if (!state.isGuideMode || !Array.isArray(state.guideSteps) || state.guideSteps.length === 0) {
      return;
    }
    const safeIndex = Math.max(0, Math.min(state.guideSteps.length - 1, state.guideStepIndex));
    state.guideStepIndex = safeIndex;
    const step = state.guideSteps[safeIndex];
    if (!step) {
      return;
    }
    applyGuidePhase({ data: { phase: step.phase }, deps: {} });

    if (guideLanguagePicker) {
      guideLanguagePicker.classList.toggle("hidden", step.id !== "language");
    }
    renderGuideLanguagePicker({ deps: {} });

    const resolved = resolveGuideStepTarget({ data: { step }, deps: {} });
    if (!resolved) {
      return;
    }

    const targetRect = resolved.getBoundingClientRect();
    const isOffscreen = targetRect.bottom < 0 || targetRect.top > window.innerHeight;
    if (isOffscreen && resolved.scrollIntoView) {
      resolved.scrollIntoView({ block: "center", inline: "nearest" });
      scheduleGuideStepRender({ deps: {} });
      return;
    }

    const copy = getGuideCopy({ deps: {} });
    const titleText = copy[step.titleKey] || "Guide";
    const bodyText = copy[step.textKey] || "";
    guideStepTitle.textContent = titleText;
    guideStepText.textContent = bodyText;
    guideStepCounter.textContent = String(safeIndex + 1) + " / " + String(state.guideSteps.length);
    if (guidePrevButton) {
      guidePrevButton.disabled = safeIndex <= 0;
    }
    if (guideNextButton) {
      guideNextButton.textContent = safeIndex >= state.guideSteps.length - 1 ? copy.finish : copy.next;
    }
    const noSpotlight = Boolean(step.noSpotlight);
    if (guideSpotlight) {
      guideSpotlight.classList.toggle("hidden", noSpotlight);
    }
    if (!noSpotlight) {
      if (step.fullViewport) {
        positionGuideSpotlight({
          data: {
            rect: {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight
            },
            minWidth: window.innerWidth,
            minHeight: window.innerHeight
          },
          deps: {}
        });
      } else {
        positionGuideSpotlight({
          data: {
            rect: targetRect,
            element: resolved,
            padding: step.spotlightPadding || null,
            minWidth: step.spotlightMinWidth || null,
            minHeight: step.spotlightMinHeight || null
          },
          deps: {}
        });
      }
    }
    if (step.id === "language") {
      if (!state.guideTooltipLocked) {
        positionGuideTooltipCentered({ deps: {} });
        state.guideTooltipLocked = true;
      }
    } else {
      state.guideTooltipLocked = false;
      positionGuideTooltip({ data: { rect: targetRect }, deps: {} });
    }
  }

  function resolveGuideStepTarget(ctx) {
    const { data, deps } = ctx;
    void deps;
    const { step } = data;
    if (!step) {
      return null;
    }
    const target = step.getTarget ? step.getTarget({ deps: {} }) : null;
    if (target && isGuideElementVisible({ data: { element: target }, deps: {} })) {
      return target;
    }
    return cards || progressTrackMain || libraryView || playerView;
  }

  function isGuideElementVisible(ctx) {
    const { data, deps } = ctx;
    void deps;
    const { element } = data;
    if (!element || !element.getBoundingClientRect || !element.isConnected) {
      return false;
    }
    if (element.classList && element.classList.contains("hidden")) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  function positionGuideSpotlight(ctx) {
    const { data, deps } = ctx;
    void deps;
    const { rect, element, padding, minWidth, minHeight } = data;
    if (!guideSpotlight || !rect) {
      return;
    }
    const hasTags = Boolean(
      element &&
      element.querySelector &&
      element.querySelector(".checkpoint-tag, .target-subseg-tag")
    );
    const padTop = padding && Number.isFinite(Number(padding.top)) ? Number(padding.top) : (hasTags ? 34 : 10);
    const padRight = padding && Number.isFinite(Number(padding.right)) ? Number(padding.right) : 12;
    const padBottom = padding && Number.isFinite(Number(padding.bottom)) ? Number(padding.bottom) : 12;
    const padLeft = padding && Number.isFinite(Number(padding.left)) ? Number(padding.left) : 12;
    const top = Math.max(0, rect.top - padTop);
    const left = Math.max(0, rect.left - padLeft);
    const width = Math.max(24, Number.isFinite(Number(minWidth)) ? Number(minWidth) : 24, rect.width + padLeft + padRight);
    const height = Math.max(24, Number.isFinite(Number(minHeight)) ? Number(minHeight) : 24, rect.height + padTop + padBottom);
    guideSpotlight.style.top = String(top) + "px";
    guideSpotlight.style.left = String(left) + "px";
    guideSpotlight.style.width = String(width) + "px";
    guideSpotlight.style.height = String(height) + "px";
  }

  function positionGuideTooltip(ctx) {
    const { data, deps } = ctx;
    void deps;
    const { rect } = data;
    if (!guideTooltip || !rect) {
      return;
    }
    const viewportPad = 12;
    const width = Math.max(220, Math.min(320, window.innerWidth - viewportPad * 2));
    guideTooltip.style.width = String(width) + "px";
    const tipRect = guideTooltip.getBoundingClientRect();
    const idealTop = rect.bottom + 12;
    const top = idealTop + tipRect.height <= window.innerHeight - viewportPad
      ? idealTop
      : Math.max(viewportPad, rect.top - tipRect.height - 12);
    const left = Math.max(viewportPad, Math.min(window.innerWidth - tipRect.width - viewportPad, rect.left));
    guideTooltip.style.top = String(top) + "px";
    guideTooltip.style.left = String(left) + "px";
  }

  function positionGuideTooltipCentered(ctx) {
    const { deps } = ctx;
    void deps;
    if (!guideTooltip) {
      return;
    }
    const viewportPad = 12;
    const width = Math.max(220, Math.min(320, window.innerWidth - viewportPad * 2));
    guideTooltip.style.width = String(width) + "px";
    const tipRect = guideTooltip.getBoundingClientRect();
    const top = Math.max(viewportPad, Math.round((window.innerHeight - tipRect.height) / 2));
    const left = Math.max(viewportPad, Math.round((window.innerWidth - tipRect.width) / 2));
    guideTooltip.style.top = String(top) + "px";
    guideTooltip.style.left = String(left) + "px";
  }

  function buildGuideSteps(ctx) {
    const { deps } = ctx;
    void deps;
    return [
      {
        id: "language",
        phase: "list-language",
        titleKey: "languageTitle",
        textKey: "languageText",
        noSpotlight: true,
        getTarget: function () { return guideLanguagePicker || guideTooltip; }
      },
      {
        id: "list-overview",
        phase: "list-overview",
        titleKey: "uploadButtonTitle",
        textKey: "uploadButtonText",
        getTarget: function () { return uploadButton || libraryView.querySelector(".library-head-row"); }
      },
      {
        id: "list-card-ready",
        phase: "list-card-ready",
        titleKey: "demoCardReadyTitle",
        textKey: "demoCardReadyText",
        getTarget: function () { return document.getElementById("guide-demo-card") || cards; }
      },
      {
        id: "list-card-upload",
        phase: "list-card-upload",
        titleKey: "demoCardUploadTitle",
        textKey: "demoCardUploadText",
        getTarget: function () { return cards.querySelector(".audio-card"); }
      },
      {
        id: "list-card-loading",
        phase: "list-card-loading",
        titleKey: "demoCardLoadingTitle",
        textKey: "demoCardLoadingText",
        getTarget: function () { return document.getElementById("guide-demo-card") || cards; }
      },
      {
        id: "player-overview",
        phase: "player-overview",
        titleKey: "playerOverviewTitle",
        textKey: "playerOverviewText",
        fullViewport: true,
        getTarget: function () { return playerView || progressTrackMain; }
      },
      {
        id: "player-main",
        phase: "player-main",
        titleKey: "playerMainTitle",
        textKey: "playerMainText",
        getTarget: function () { return progressTrackMain; }
      },
      {
        id: "player-checkpoint-set",
        phase: "player-checkpoint-set",
        titleKey: "checkpointSetTitle",
        textKey: "checkpointSetText",
        getTarget: function () { return progressTrackMain; }
      },
      {
        id: "player-checkpoint-add",
        phase: "player-checkpoint-add",
        titleKey: "checkpointAddTitle",
        textKey: "checkpointAddText",
        getTarget: function () { return checkpointMarkers || progressTrackMain; }
      },
      {
        id: "player-checkpoint-delete-target",
        phase: "player-checkpoint-delete-target",
        titleKey: "checkpointDeleteTargetTitle",
        textKey: "checkpointDeleteTargetText",
        getTarget: function () { return checkpointMarkers || progressTrackMain; }
      },
      {
        id: "player-checkpoint-delete-confirm",
        phase: "player-checkpoint-delete-confirm",
        titleKey: "checkpointDeleteConfirmTitle",
        textKey: "checkpointDeleteConfirmText",
        getTarget: function () { return deleteConfirmDialog || checkpointMarkers || progressTrackMain; }
      },
      {
        id: "player-checkpoint-cycle",
        phase: "player-checkpoint-cycle",
        titleKey: "checkpointCycleTitle",
        textKey: "checkpointCycleText",
        getTarget: function () { return selectedSpanOverlay || progressTrackMain; }
      },
      {
        id: "player-focus",
        phase: "player-focus",
        titleKey: "playerFocusTitle",
        textKey: "playerFocusText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-subseg-card",
        phase: "player-subseg-card",
        titleKey: "subSegCardTitle",
        textKey: "subSegCardText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-subseg-start",
        phase: "player-subseg-start",
        titleKey: "subSegStartTitle",
        textKey: "subSegStartText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-subseg-end",
        phase: "player-subseg-end",
        titleKey: "subSegEndTitle",
        textKey: "subSegEndText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-subseg-select",
        phase: "player-subseg-select",
        titleKey: "subSegSelectTitle",
        textKey: "subSegSelectText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-subseg-delete-target",
        phase: "player-subseg-delete-target",
        titleKey: "subSegDeleteTargetTitle",
        textKey: "subSegDeleteTargetText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-subseg-delete-confirm",
        phase: "player-subseg-delete-confirm",
        titleKey: "subSegDeleteConfirmTitle",
        textKey: "subSegDeleteConfirmText",
        getTarget: function () { return deleteConfirmDialog || targetProgressWrap; }
      },
      {
        id: "player-input",
        phase: "player-input",
        titleKey: "inputTitle",
        textKey: "inputText",
        getTarget: function () { return subSegValueInput || subSegValuePanel; }
      },
      {
        id: "player-card-first-input",
        phase: "player-card-first-input",
        titleKey: "firstCardInputTitle",
        textKey: "firstCardInputText",
        getTarget: function () { return subSegValueInput || subSegValuePanel; }
      },
      {
        id: "player-cards",
        phase: "player-cards",
        titleKey: "cardsTitle",
        textKey: "cardsText",
        spotlightPadding: { top: 20, right: 20, bottom: 20, left: 20 },
        spotlightMinWidth: 380,
        getTarget: function () { return subSegValueList.querySelector(".subseg-value-card-input") || subSegValuePanel; }
      },
      {
        id: "player-card-edit",
        phase: "player-card-edit",
        titleKey: "cardEditTitle",
        textKey: "cardEditText",
        spotlightPadding: { top: 20, right: 20, bottom: 20, left: 20 },
        spotlightMinWidth: 380,
        getTarget: function () { return subSegValueList.querySelector(".subseg-value-card-input") || subSegValuePanel; }
      },
      {
        id: "player-card-nav-history",
        phase: "player-card-nav-history",
        titleKey: "cardNavHistoryTitle",
        textKey: "cardNavHistoryText",
        spotlightPadding: { top: 18, right: 18, bottom: 18, left: 18 },
        spotlightMinWidth: 360,
        getTarget: function () { return subSegValueList || subSegValuePanel; }
      },
      {
        id: "player-card-child-select",
        phase: "player-card-child-select",
        titleKey: "cardChildSelectTitle",
        textKey: "cardChildSelectText",
        spotlightPadding: { top: 20, right: 20, bottom: 20, left: 20 },
        spotlightMinWidth: 380,
        getTarget: function () { return document.getElementById("guide-card-child-select-target") || subSegValueList || subSegValuePanel; }
      },
      {
        id: "player-card-child-created",
        phase: "player-card-child-created",
        titleKey: "cardChildCreatedTitle",
        textKey: "cardChildCreatedText",
        spotlightPadding: { top: 20, right: 20, bottom: 20, left: 20 },
        spotlightMinWidth: 380,
        getTarget: function () { return document.getElementById("guide-card-child-cluster") || subSegValueList || subSegValuePanel; }
      },
      {
        id: "player-card-nav-list",
        phase: "player-card-nav-list",
        titleKey: "cardNavVerticalTitle",
        textKey: "cardNavVerticalText",
        spotlightPadding: { top: 18, right: 18, bottom: 18, left: 18 },
        spotlightMinWidth: 360,
        getTarget: function () { return document.getElementById("guide-card-nav-list-cluster") || subSegValueList || subSegValuePanel; }
      },
      {
        id: "player-card-delete",
        phase: "player-card-delete",
        titleKey: "cardDeleteTitle",
        textKey: "cardDeleteText",
        spotlightPadding: { top: 20, right: 20, bottom: 20, left: 20 },
        spotlightMinWidth: 380,
        getTarget: function () { return document.getElementById("guide-card-delete-target") || subSegValueList; }
      },
      {
        id: "player-card-delete-confirm",
        phase: "player-card-delete-confirm",
        titleKey: "cardDeleteConfirmTitle",
        textKey: "cardDeleteConfirmText",
        getTarget: function () { return document.getElementById("guide-card-delete-actions") || subSegValueList; }
      },
      {
        id: "player-exit-value-mode",
        phase: "player-exit-value-mode",
        titleKey: "exitValueModeTitle",
        textKey: "exitValueModeText",
        getTarget: function () { return subSegValueInput || subSegValuePanel; }
      },
      {
        id: "player-exit-subseg",
        phase: "player-exit-subseg",
        titleKey: "exitSubSegTitle",
        textKey: "exitSubSegText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-exit-target",
        phase: "player-exit-target",
        titleKey: "exitTargetTitle",
        textKey: "exitTargetText",
        getTarget: function () { return targetProgressWrap; }
      },
      {
        id: "player-exit-audseg",
        phase: "player-exit-audseg",
        titleKey: "exitAudSegTitle",
        textKey: "exitAudSegText",
        getTarget: function () { return progressTrackMain; }
      },
      {
        id: "player-exit-list",
        phase: "player-exit-list",
        titleKey: "exitListTitle",
        textKey: "exitListText",
        getTarget: function () { return backButton || playerView; }
      }
    ];
  }

  async function loadPersistedAudioCards() {
    return sessionRuntime.loadPersistedAudioCards({
      data: { state },
      deps: {
        fetch,
        fetch: boundFetch,
        buildAuthHeaders,
        clearLoginState,
        renderAudioCards
      }
    });
  }

  function renderAudioCards(sessions) {
    state.sessionsCache = Array.isArray(sessions) ? sessions : [];
    if (state.isGuideMode && isGuideListPhase({ deps: {} })) {
      renderGuideAudioCards({ deps: {} });
      renderModuleDashboard();
      return;
    }
    cards.innerHTML = "";

    const hasPending = Boolean(state.pendingUpload);
    if (!state.sessionsCache.length && !hasPending && !state.isListLoading) {
      emptyState.classList.remove("hidden");
      renderModuleDashboard();
      return;
    }

    emptyState.classList.add("hidden");

    if (state.isListLoading) {
      cards.appendChild(createListLoadingCard());
    }

    if (state.pendingUpload) {
      cards.appendChild(createPendingAudioCard(state.pendingUpload));
    }

    const selectedIngestCardIndex = Math.max(0, Math.min(Math.max(0, state.sessionsCache.length - 1), Number(state.ingestCardIndex)));
    state.ingestCardIndex = selectedIngestCardIndex;
    state.sessionsCache.forEach(function (session, index) {
      const row = document.createElement("div");
      row.className = "audio-card-row";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "audio-card audio-card-main";
      const cardIndex = index;
      const isLoading = state.loadingSessionId && state.loadingSessionId === session.id;
      button.disabled = state.isPersisting;
      button.classList.toggle("is-disabled", state.isPersisting);
      button.classList.toggle("is-loading", Boolean(isLoading));
      button.classList.toggle("is-selected", selectedIngestCardIndex === cardIndex);
      button.dataset.ingestCardIndex = String(cardIndex);
      button.addEventListener("click", function () {
        if (state.isPersisting || state.loadingSessionId) {
          return;
        }
        openPersistedSession(session.id).catch(function () {});
      });
      button.addEventListener("keydown", function (event) {
        handleIngestCardKeyDown(event, cardIndex);
      });
      button.addEventListener("focus", function () {
        state.ingestCardIndex = cardIndex;
        renderModuleStatus();
      });

      const title = document.createElement("span");
      title.className = "audio-card-title";
      title.textContent = (session.file && session.file.name) || "Untitled audio";

      const meta = document.createElement("span");
      meta.className = "audio-card-meta";
      meta.textContent = buildSessionMeta(session, isLoading ? "loading" : "");

      button.appendChild(title);
      button.appendChild(meta);
      if (isLoading) {
        button.appendChild(createProgressRow({ mode: "indeterminate", label: "Loading audio..." }));
      }
      row.appendChild(button);

      const settingsButton = document.createElement("button");
      settingsButton.type = "button";
      settingsButton.className = "item-settings-button";
      settingsButton.setAttribute("aria-label", "Item settings");
      settingsButton.title = "Item settings";
      settingsButton.textContent = "...";
      settingsButton.disabled = state.isPersisting || Boolean(state.loadingSessionId);
      settingsButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleSessionMenu(session.id);
      });
      row.appendChild(settingsButton);

      if (state.openMenuSessionId === session.id) {
        row.appendChild(createItemActionsMenu(session.id));
      }

      cards.appendChild(row);
    });
    renderModuleDashboard();
  }

  function renderModuleDashboard() {
    if (!moduleDashboard || !moduleGrid) {
      return;
    }
    moduleGrid.innerHTML = "";
    const selectedIndex = Math.max(0, Math.min(MODULE_CARD_DEFS.length - 1, Number(state.moduleCardIndex)));
    state.moduleCardIndex = selectedIndex;
    MODULE_CARD_DEFS.forEach(function (moduleDef, index) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "module-card";
      button.dataset.moduleCardIndex = String(index);
      button.classList.toggle("is-selected", index === selectedIndex);
      button.classList.toggle("is-ingest", moduleDef.id === "INGEST");

      const heading = document.createElement("span");
      heading.className = "module-card-title";
      heading.textContent = moduleDef.title;

      const summary = document.createElement("span");
      summary.className = "module-card-summary";
      summary.textContent = moduleDef.summary;

      const detail = document.createElement("span");
      detail.className = "module-card-detail";
      detail.textContent = moduleDef.id === "INGEST"
        ? String(moduleDef.detail || "") + "  |  " + String(state.sessionsCache.length) + " audEps"
        : String(moduleDef.detail || "");

      const footer = document.createElement("span");
      footer.className = "module-card-action";
      footer.textContent = moduleDef.actionText || "Enter";

      button.appendChild(heading);
      button.appendChild(summary);
      button.appendChild(detail);
      button.appendChild(footer);
      button.addEventListener("click", function () {
        activateModuleCard(moduleDef.id);
      });
      button.addEventListener("keydown", function (event) {
        handleModuleCardKeyDown(event, index);
      });
      button.addEventListener("focus", function () {
        state.moduleCardIndex = index;
        renderModuleStatus();
      });
      moduleGrid.appendChild(button);
    });
    renderModuleStatus();
  }

  function renderModuleStatus() {
    if (!moduleStatus) {
      return;
    }
    moduleStatus.classList.remove("error");
    const selected = MODULE_CARD_DEFS[Math.max(0, Math.min(MODULE_CARD_DEFS.length - 1, Number(state.moduleCardIndex)))];
    if (!selected) {
      moduleStatus.textContent = "Select a module.";
      return;
    }
    moduleStatus.textContent = selected.id === "INGEST"
      ? "INGEST opens the current audio workflow."
      : selected.summary + " - not wired yet.";
  }

  function activateModuleCard(moduleId) {
    const id = String(moduleId || "");
    if (id === "INGEST") {
      showIngestView();
      return;
    }
    setModuleStatus(id + " is not wired yet.", true);
  }

  function setModuleStatus(text, isError) {
    if (!moduleStatus) {
      return;
    }
    moduleStatus.textContent = String(text || "");
    moduleStatus.classList.toggle("error", Boolean(isError));
  }

  function handleModuleCardKeyDown(event, index) {
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    const isArrowRight = keyCode === "ArrowRight" || keyValue === "ArrowRight" || keyValue === "Right";
    const isArrowLeft = keyCode === "ArrowLeft" || keyValue === "ArrowLeft" || keyValue === "Left";
    const isArrowUp = keyCode === "ArrowUp" || keyValue === "ArrowUp" || keyValue === "Up";
    const isArrowDown = keyCode === "ArrowDown" || keyValue === "ArrowDown" || keyValue === "Down";
    const isEnter = keyCode === "Enter" || keyValue === "Enter";
    if ((event.ctrlKey || event.metaKey) && (isArrowLeft || isArrowRight || isArrowUp || isArrowDown)) {
      event.preventDefault();
      event.stopPropagation();
      const cols = getModuleGridColumnCount();
      let delta = 0;
      if (isArrowLeft) {
        delta = -1;
      } else if (isArrowRight) {
        delta = 1;
      } else if (isArrowUp) {
        delta = -Math.max(1, cols);
      } else if (isArrowDown) {
        delta = Math.max(1, cols);
      }
      moveModuleSelection(delta);
      return;
    }
    if (isEnter) {
      event.preventDefault();
      event.stopPropagation();
      activateModuleCard(MODULE_CARD_DEFS[index] && MODULE_CARD_DEFS[index].id);
    }
  }

  function getModuleGridColumnCount() {
    if (!moduleGrid) {
      return 3;
    }
    const computed = window.getComputedStyle(moduleGrid);
    const columns = String(computed.gridTemplateColumns || "").trim().split(/\s+/).filter(Boolean);
    return Math.max(1, columns.length || 3);
  }

  function focusModuleCardByIndex(index) {
    setModuleSelection(index);
  }

  function setModuleSelection(index) {
    const clamped = Math.max(0, Math.min(MODULE_CARD_DEFS.length - 1, Number(index)));
    state.moduleCardIndex = clamped;
    renderModuleDashboard();
    requestAnimationFrame(function () {
      const selector = "button[data-module-card-index=\"" + String(clamped) + "\"]";
      const button = moduleGrid ? moduleGrid.querySelector(selector) : null;
      if (!button) {
        return;
      }
      try {
        button.focus({ preventScroll: true });
      } catch {
        button.focus();
      }
    });
  }

  function moveModuleSelection(delta) {
    const current = Math.max(0, Math.min(MODULE_CARD_DEFS.length - 1, Number(state.moduleCardIndex)));
    const next = current + Number(delta);
    setModuleSelection(next);
  }

  function focusIngestListByIndex(index) {
    setIngestSelection(index);
  }

  function setIngestSelection(index) {
    if (!cards) {
      return;
    }
    const buttons = Array.from(cards.querySelectorAll(".audio-card-main"));
    if (!buttons.length) {
      if (uploadButton && !uploadButton.classList.contains("hidden")) {
        try {
          uploadButton.focus({ preventScroll: true });
        } catch {
          uploadButton.focus();
        }
      }
      return;
    }
    const clamped = Math.max(0, Math.min(buttons.length - 1, Number(index)));
    state.ingestCardIndex = clamped;
    renderAudioCards(state.sessionsCache);
    requestAnimationFrame(function () {
      const nextButtons = cards ? Array.from(cards.querySelectorAll(".audio-card-main")) : [];
      const button = nextButtons[clamped];
      if (!button) {
        return;
      }
      try {
        button.focus({ preventScroll: true });
      } catch {
        button.focus();
      }
    });
  }

  function moveIngestSelection(delta) {
    const next = Math.max(0, Math.min(Math.max(0, state.sessionsCache.length - 1), Number(state.ingestCardIndex) + Number(delta)));
    setIngestSelection(next);
  }

  function handleIngestCardKeyDown(event, index) {
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    const isArrowUp = keyCode === "ArrowUp" || keyValue === "ArrowUp" || keyValue === "Up";
    const isArrowDown = keyCode === "ArrowDown" || keyValue === "ArrowDown" || keyValue === "Down";
    if ((event.ctrlKey || event.metaKey) && (isArrowUp || isArrowDown)) {
      event.preventDefault();
      event.stopPropagation();
      focusIngestListByIndex(index + (isArrowDown ? 1 : -1));
    }
  }

  function createListLoadingCard() {
    const wrap = document.createElement("div");
    wrap.className = "audio-card is-pending";

    const title = document.createElement("span");
    title.className = "audio-card-title";
    title.textContent = "Refreshing list";

    const meta = document.createElement("span");
    meta.className = "audio-card-meta";
    meta.textContent = "Loading updated sessions...";

    wrap.appendChild(title);
    wrap.appendChild(meta);
    wrap.appendChild(createProgressRow({ mode: "indeterminate", label: "Loading..." }));
    return wrap;
  }

  function createItemActionsMenu(sessionId) {
    const menu = document.createElement("div");
    menu.className = "item-actions";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "item-action-button danger";
    del.textContent = "Delete";
    del.disabled = state.isPersisting || Boolean(state.loadingSessionId);
    del.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      deleteSession(sessionId).catch(function () {});
    });

    menu.appendChild(del);
    return menu;
  }

  function toggleSessionMenu(sessionId) {
    if (state.isPersisting || state.loadingSessionId) {
      return;
    }
    state.openMenuSessionId = state.openMenuSessionId === sessionId ? null : sessionId;
    renderAudioCards(state.sessionsCache);
  }

  function createPendingAudioCard(upload) {
    const wrap = document.createElement("div");
    wrap.className = "audio-card is-pending";

    const title = document.createElement("span");
    title.className = "audio-card-title";
    title.textContent = (upload.file && upload.file.name) || "Uploading audio";

    const phaseText = upload.phase === "saving"
      ? "Finalizing metadata..."
      : upload.phase === "failed"
        ? "Upload failed"
        : "Uploading audio...";

    const meta = document.createElement("span");
    meta.className = "audio-card-meta";
    meta.textContent = phaseText;

    const progress = createProgressRow({
      mode: upload.phase === "uploading" ? "percent" : upload.phase === "saving" ? "indeterminate" : "stopped",
      percent: upload.progress || 0,
      label: upload.phase === "failed"
        ? "Failed"
        : upload.phase === "saving"
          ? "Saving..."
          : String(Math.round((upload.progress || 0) * 100)) + "%"
    });

    wrap.appendChild(title);
    wrap.appendChild(meta);
    wrap.appendChild(progress);
    return wrap;
  }

  function createProgressRow(ctx) {
    const data = ctx || {};
    const row = document.createElement("div");
    row.className = "card-progress";

    const bar = document.createElement("span");
    bar.className = "card-progress-bar";
    if (data.mode === "indeterminate") {
      bar.classList.add("is-indeterminate");
    } else if (data.mode === "stopped") {
      bar.style.setProperty("--card-progress", "0%");
    } else {
      const pct = Math.max(0, Math.min(100, Math.round(Number(data.percent || 0) * 100)));
      bar.style.setProperty("--card-progress", String(pct) + "%");
    }

    const label = document.createElement("span");
    label.className = "card-progress-label";
    label.textContent = data.label || "";

    row.appendChild(bar);
    row.appendChild(label);
    return row;
  }

  function buildSessionMeta(session, mode) {
    const playback = session && session.playback ? session.playback : {};
    const checkpointCount = Array.isArray(playback.checkpoints) ? playback.checkpoints.length : 0;
    const subSegCount = Array.isArray(playback.subSegs) ? playback.subSegs.length : 0;
    const subSegValueEntries = playback.subSegValueEntries && typeof playback.subSegValueEntries === "object"
      ? playback.subSegValueEntries
      : {};
    const fallbackInputCardCount = Object.keys(subSegValueEntries).reduce(function (sum, key) {
      const list = Array.isArray(subSegValueEntries[key]) ? subSegValueEntries[key] : [];
      return sum + list.length;
    }, 0);
    const subSegEntryKeyCount = Object.keys(subSegValueEntries).length;
    const stats = playback.stats && typeof playback.stats === "object" ? playback.stats : {};
    const audSegCount = Number.isFinite(Number(stats.audSegs)) ? Number(stats.audSegs) : Math.max(0, checkpointCount + 1);
    const statsSubSegCount = Number.isFinite(Number(stats.subSegs)) ? Number(stats.subSegs) : 0;
    const resolvedSubSegCount = Math.max(statsSubSegCount, subSegCount, subSegEntryKeyCount);
    const inputCardCount = Number.isFinite(Number(stats.inputCards)) ? Number(stats.inputCards) : fallbackInputCardCount;
    const countsText = "audSegs: " + String(audSegCount) +
      "  |  subSegs: " + String(resolvedSubSegCount) +
      "  |  audEps: " + String(inputCardCount);
    const when = formatSavedAt(session.savedAt);
    if (mode === "loading") {
      return "Opening...  |  " + countsText;
    }
    return when + "  |  " + countsText;
  }

  function formatSavedAt(savedAt) {
    if (!savedAt) {
      return "saved";
    }
    const date = new Date(savedAt);
    if (Number.isNaN(date.getTime())) {
      return "saved";
    }
    return date.toLocaleString();
  }

  async function openPersistedSession(sessionId, options) {
    if (state.isPersisting || state.loadingSessionId) {
      return;
    }
    state.loadingSessionId = sessionId;
    state.openMenuSessionId = null;
    const resumeSnapshot = options && options.resumeSnapshot && typeof options.resumeSnapshot === "object"
      ? options.resumeSnapshot
      : null;
    debugLog("openPersistedSession:start", { sessionId });
    renderAudioCards(state.sessionsCache);

    try {
      showPlayerView();
      setPlayerLoading(true, "Restoring checkpoints and subSegs...");

      const response = await boundFetch("/api/session?id=" + encodeURIComponent(sessionId), {
        method: "GET",
        cache: "no-store",
        headers: buildAuthHeaders()
      });
      if (response.status === 401) {
        clearLoginState("Login expired. Please sign in again.");
        return;
      }

      if (!response.ok) {
        throw new Error("session_load_failed");
      }

      const saved = await response.json();
      if (!saved || typeof saved !== "object") {
        throw new Error("session_payload_invalid");
      }

      state.activeSessionId = saved.id || sessionId;
      state.activeRevision = normalizeRevision(saved.revision);
      state.activeAudioId = typeof saved.audioId === "string" ? saved.audioId : null;
      state.activeAudioUrl = typeof saved.audioUrl === "string" ? saved.audioUrl : null;
      await applySavedSession(saved, resumeSnapshot);
      if (resumeSnapshot) {
        applyResumeContextOverlay(resumeSnapshot);
      }
      debugLog("openPersistedSession:loaded", {
        sessionId: state.activeSessionId,
        revision: state.activeRevision,
        audioId: state.activeAudioId,
        audioUrl: state.activeAudioUrl,
        checkpoints: Array.isArray(saved.playback && saved.playback.checkpoints) ? saved.playback.checkpoints.length : 0
      });
      setPlayerLoading(false);
      focusProgressControl();
    } catch (error) {
      debugLog("openPersistedSession:error", { sessionId, error: normalizeErrorMessage(error) });
      showLibraryView();
      await loadPersistedAudioCards();
      setSaveStatus("Resume failed: " + normalizeErrorMessage(error), true);
    } finally {
      setPlayerLoading(false);
      state.loadingSessionId = null;
      renderAudioCards(state.sessionsCache);
    }
  }

  function resetPlaybackState() {
    clearCheckpointDragState();
    state.checkpoints = [];
    state.subSegs = [];
    state.subSegValueEntries = {};
    state.subSegDraftHtmlByKey = {};
    state.audSegNoteEntries = {};
    state.audSegNoteEditorVisible = false;
    state.subSegCardInternalChangeGuards = {};
    state.subSegCardBubbleTargetIndexByKey = {};
    state.subSegCardFocusTransferStackByKey = {};
    state.subSegCardDeleteDialogKey = null;
    state.activeSubSegValueKey = null;
    state.selectedSpanIndex = -1;
    clearTargetSpanLock({ preserveSelection: false });
    state.shiftHoldTss = null;
    state.markerSignature = "";
    state.subSegSignature = "";
    state.targetMarkerSignature = "";
    clearDeleteTarget({ silent: true });
    renderAudSegNotePanel();
    renderSubSegValuePanel();
    if (subSegValueInput) {
      subSegValueInput.innerHTML = "";
      subSegValueInput.classList.add("hidden");
    }
  }

  function dropCheckpoint() {
    if (hasTargetSpan()) {
      setSaveStatus("audSeg target mode: checkpoint set disabled");
      return;
    }
    const seconds = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    debugLog("dropCheckpoint:before", { seconds, checkpoints: state.checkpoints.slice() });
    state.checkpoints.push(seconds);
    state.checkpoints.sort(function (a, b) { return a - b; });
    state.selectedSpanIndex = -1;
    state.markerSignature = "";
    updateUi();
    enqueueAutoSave();
    debugLog("dropCheckpoint:after", { checkpoints: state.checkpoints.slice() });
  }

  function cycleSpanSelection(step) {
    if (hasTargetSpan()) {
      return;
    }
    const allCheckpoints = getCheckpointSeries();
    const spanCount = allCheckpoints.length - 1;
    if (spanCount <= 0) {
      return;
    }

    if (state.selectedSpanIndex < 0 || state.selectedSpanIndex >= spanCount) {
      state.selectedSpanIndex = step > 0 ? 0 : spanCount - 1;
    } else {
      state.selectedSpanIndex = (state.selectedSpanIndex + step + spanCount) % spanCount;
    }

    snapToSelectedSpanStart();
    updateUi();
  }

  function snapToSelectedSpanStart() {
    const range = getSpanBoundsByIndex(state.selectedSpanIndex);
    if (!range) {
      return;
    }
    const spanLength = range.end - range.start;
    if (!Number.isFinite(spanLength) || spanLength <= 0) {
      return;
    }

    const epsilon = Math.min(0.02, Math.max(0.003, spanLength / 20));
    const target = Math.min(range.end - 0.001, range.start + epsilon);
    audio.currentTime = target;

    window.setTimeout(function () {
      const verifyRange = getSpanBoundsByIndex(state.selectedSpanIndex);
      if (!verifyRange) {
        return;
      }
      const current = Number.isFinite(audio.currentTime) ? audio.currentTime : target;
      if (current >= verifyRange.end || current < (verifyRange.start - 0.01)) {
        audio.currentTime = Math.min(verifyRange.end - 0.001, verifyRange.start + epsilon);
        updateUi();
      }
    }, 50);
  }

  function createTargetSubSegFromShiftHold() {
    if (!hasTargetSpan()) {
      return;
    }
    const tss = Number.isFinite(state.shiftHoldTss)
      ? state.shiftHoldTss
      : (Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    if (!Number.isFinite(state.shiftHoldTss)) {
      state.shiftHoldTss = tss;
      debugLog("target:shiftHoldStart:auto", { tss });
    }

    const tse = Number.isFinite(audio.currentTime) ? audio.currentTime : tss;
    const bounds = getTargetSpanBounds();
    if (!bounds) {
      return;
    }

    const start = Math.max(bounds.start, Math.min(bounds.end, Math.min(tss, tse)));
    const end = Math.max(bounds.start, Math.min(bounds.end, Math.max(tss, tse)));
    if (!Number.isFinite(start) || !Number.isFinite(end) || (end - start) <= 0.03) {
      setSaveStatus("audSeg subSeg ignored (too short)");
      return;
    }

    const created = {
      start,
      end,
      createdAt: new Date().toISOString()
    };
    logRuntimeAction("subseg:create", {
      targetSpanIndex: state.targetSpanIndex,
      tss,
      tse,
      start,
      end
    });
    state.subSegs.push(created);
    state.subSegs = normalizeSubSegs(state.subSegs);
    syncTargetSubSegsFromCurrentBounds();
    state.subSegSignature = "";
    state.markerSignature = "";
    state.targetMarkerSignature = "";
    audio.currentTime = start;
    updateUi();
    debugLog("target:subSegCreated", {
      tss,
      tse,
      start,
      end,
      count: state.subSegs.length,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex
    });
    setSaveStatus("audSeg subSeg created: " + formatTime(start) + " -> " + formatTime(end));
    enqueueAutoSave();
  }

  function cycleTargetSubSegSelection(step) {
    if (!hasTargetSpan()) {
      return;
    }
    syncTargetSubSegsFromCurrentBounds();
    const total = state.targetSubSegs.length;
    if (total <= 0) {
      setSaveStatus("No audSeg subSegs yet (Shift hold, then Shift+Space)");
      return;
    }
    logRuntimeAction("subseg:cycle-target", {
      step,
      targetSpanIndex: state.targetSpanIndex,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
      total
    });
    if (state.selectedTargetSubSegIndex < 0 || state.selectedTargetSubSegIndex >= total) {
      state.selectedTargetSubSegIndex = step > 0 ? 0 : total - 1;
    } else {
      state.selectedTargetSubSegIndex = (state.selectedTargetSubSegIndex + step + total) % total;
    }
    const selected = state.targetSubSegs[state.selectedTargetSubSegIndex];
    if (selected) {
      audio.currentTime = selected.start;
      state.audSegNoteEditorVisible = true;
      syncAudSegEditorFocusState();
      renderAudSegNotePanel();
      setSaveStatus(
        "audSeg subSeg " + String(state.selectedTargetSubSegIndex + 1) + "/" + String(total) +
        ": " + formatTime(selected.start) + " -> " + formatTime(selected.end)
      );
    }
    updateUi();
    debugLog("target:cycleSubSeg", {
      step,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
      total
    });
    syncSubSegValueSelectionToCurrentTarget();
    renderSubSegValuePanel();
  }

  function hasDeleteTargetSelection() {
    return (state.deleteTargetType === "checkpoint" || state.deleteTargetType === "subseg") &&
      Number.isFinite(state.deleteTargetIndex) &&
      state.deleteTargetIndex >= 0;
  }

  function clearDeleteTarget(ctx) {
    const data = ctx || {};
    const silent = Boolean(data.silent);
    const hadTarget = hasDeleteTargetSelection() || state.deleteConfirmOpen;
    logRuntimeAction("delete-target:clear", {
      silent,
      hadTarget,
      deleteTargetType: state.deleteTargetType,
      deleteTargetIndex: state.deleteTargetIndex,
      deleteConfirmOpen: state.deleteConfirmOpen
    });
    state.deleteTargetType = "";
    state.deleteTargetIndex = -1;
    state.deleteConfirmOpen = false;
    state.markerSignature = "";
    state.targetMarkerSignature = "";
    if (deleteConfirmDialog) {
      deleteConfirmDialog.classList.add("hidden");
    }
    if (!silent && hadTarget) {
      setSaveStatus("Delete target cleared");
    }
  }

  function cycleDeleteTarget(step) {
    if (!isPlayerActive() || !audio.src) {
      return;
    }
    syncTargetSubSegsFromCurrentBounds();
    let targetType = "";
    let total = 0;
    if (hasTargetSpan() && state.targetSubSegs.length > 0) {
      targetType = "subseg";
      total = state.targetSubSegs.length;
    } else if (!hasTargetSpan() && state.checkpoints.length > 0) {
      targetType = "checkpoint";
      total = state.checkpoints.length;
    }
    logRuntimeAction("delete-target:cycle", {
      step,
      targetType,
      total,
      hasTargetSpan: hasTargetSpan(),
      deleteTargetType: state.deleteTargetType,
      deleteTargetIndex: state.deleteTargetIndex
    });
    if (!targetType || total <= 0) {
      setSaveStatus(hasTargetSpan() ? "No subSeg tags available for delete target" : "No checkpoints available for delete target");
      return;
    }
    if (state.deleteTargetType !== targetType || state.deleteTargetIndex < 0 || state.deleteTargetIndex >= total) {
      state.deleteTargetIndex = step > 0 ? 0 : total - 1;
    } else {
      state.deleteTargetIndex = (state.deleteTargetIndex + step + total) % total;
    }
    state.deleteTargetType = targetType;
    state.deleteConfirmOpen = false;
    state.markerSignature = "";
    state.targetMarkerSignature = "";
    updateUi();

    if (targetType === "checkpoint") {
      const point = state.checkpoints[state.deleteTargetIndex];
      setSaveStatus(
        "Delete target checkpoint " + String(state.deleteTargetIndex + 1) + "/" + String(total) +
        ": " + formatTime(Number.isFinite(point) ? point : 0)
      );
      return;
    }
    const seg = state.targetSubSegs[state.deleteTargetIndex];
    setSaveStatus(
      "Delete target subSeg " + String(state.deleteTargetIndex + 1) + "/" + String(total) +
      ": " + formatCompactedRange(seg ? seg.start : 0, seg ? seg.end : 0)
    );
  }

  function openDeleteConfirmDialog() {
    const target = getActiveDeleteTarget();
    if (!target) {
      setSaveStatus("Select a delete target first (Ctrl+Up/Down)");
      return;
    }
    state.deleteConfirmOpen = true;
    renderDeleteConfirmDialog();
    requestAnimationFrame(function () {
      if (!deleteConfirmCancel) {
        return;
      }
      try {
        deleteConfirmCancel.focus({ preventScroll: true });
      } catch {
        deleteConfirmCancel.focus();
      }
    });
    setSaveStatus("Confirm delete target");
  }

  function closeDeleteConfirmDialog() {
    state.deleteConfirmOpen = false;
    renderDeleteConfirmDialog();
  }

  function getActiveDeleteTarget() {
    if (!hasDeleteTargetSelection()) {
      return null;
    }
    if (state.deleteTargetType === "checkpoint") {
      const idx = state.deleteTargetIndex;
      const seconds = state.checkpoints[idx];
      if (!Number.isFinite(seconds)) {
        return null;
      }
      return {
        type: "checkpoint",
        index: idx,
        summary: "checkpoint at " + formatTime(seconds)
      };
    }
    if (state.deleteTargetType === "subseg") {
      syncTargetSubSegsFromCurrentBounds();
      const idx = state.deleteTargetIndex;
      const seg = state.targetSubSegs[idx];
      if (!seg || !Number.isFinite(seg.start) || !Number.isFinite(seg.end) || seg.end <= seg.start) {
        return null;
      }
      return {
        type: "subseg",
        index: idx,
        start: seg.start,
        end: seg.end,
        summary: "subSeg " + formatCompactedRange(seg.start, seg.end)
      };
    }
    return null;
  }

  function confirmDeleteTarget() {
    const target = getActiveDeleteTarget();
    if (!target) {
      clearDeleteTarget({ silent: true });
      updateUi();
      setSaveStatus("Delete target is no longer valid");
      return;
    }

    if (target.type === "checkpoint") {
      const deletedTime = state.checkpoints[target.index];
      state.checkpoints.splice(target.index, 1);
      state.selectedSpanIndex = -1;
      state.markerSignature = "";
      state.targetMarkerSignature = "";
      clearDeleteTarget({ silent: true });
      updateUi();
      enqueueAutoSave();
      setSaveStatus("Deleted checkpoint " + formatTime(Number.isFinite(deletedTime) ? deletedTime : 0));
      return;
    }

    const subSegIndex = state.subSegs.findIndex(function (seg) {
      return Math.abs(seg.start - target.start) <= 0.01 && Math.abs(seg.end - target.end) <= 0.01;
    });
    if (subSegIndex < 0) {
      clearDeleteTarget({ silent: true });
      updateUi();
      setSaveStatus("Delete target is no longer valid");
      return;
    }
    state.subSegs.splice(subSegIndex, 1);
    const valueKey = getSubSegValueKey(target);
    if (valueKey && Object.prototype.hasOwnProperty.call(state.subSegValueEntries, valueKey)) {
      delete state.subSegValueEntries[valueKey];
    }
    syncTargetSubSegsFromCurrentBounds();
    state.selectedTargetSubSegIndex = -1;
    state.subSegSignature = "";
    state.markerSignature = "";
    state.targetMarkerSignature = "";
    clearDeleteTarget({ silent: true });
    updateUi();
    enqueueAutoSave();
    setSaveStatus("Deleted " + target.summary);
  }

  function getSubSegValueKey(seg) {
    if (!seg || !Number.isFinite(seg.start) || !Number.isFinite(seg.end)) {
      return "";
    }
    return seg.start.toFixed(3) + "|" + seg.end.toFixed(3);
  }

  function getSelectedTargetSubSegValueKey() {
    const seg = getTargetSubSegBoundsByIndex(state.selectedTargetSubSegIndex);
    return getSubSegValueKey(seg);
  }

  function hideSubSegTimeline() {
    return;
  }

  function resetSubSegTimelineUiState() {
    return;
  }

  function isSubSegTimelineTraversalActiveForKey(key) {
    return false;
  }

  function cloneSubSegValueEntryList(entries) {
    const list = Array.isArray(entries) ? entries : [];
    return JSON.parse(JSON.stringify(list));
  }

  function parseSubSegValueKey(key) {
    const raw = String(key || "");
    const parts = raw.split("|");
    if (parts.length !== 2) {
      return null;
    }
    const start = Number(parts[0]);
    const end = Number(parts[1]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return null;
    }
    return { start, end };
  }

  function getSubSegCreatedAtByKey(key) {
    const parsed = parseSubSegValueKey(key);
    if (!parsed) {
      return "";
    }
    const match = state.subSegs.find(function (seg) {
      return Math.abs(seg.start - parsed.start) <= 0.01 && Math.abs(seg.end - parsed.end) <= 0.01;
    });
    if (!match) {
      return "";
    }
    const createdAt = String(match.createdAt || "");
    const stamp = new Date(createdAt);
    if (Number.isNaN(stamp.getTime())) {
      return "";
    }
    return createdAt;
  }

  function createTimelineEventId() {
    return "timeline-" + Date.now().toString(36);
  }

  function ensureSubSegTimeline(key) {
    return null;
  }

  function recordSubSegTimelineEvent(key, label, createdAt) {
    return;
  }

  function getSelectedSubSegTimeline() {
    return null;
  }

  function getTimelineNodeSnapshot(key) {
    return null;
  }

  function traverseSubSegTimeline(step) {
    return;
  }

  function renderSubSegTimeline(key) {
    return;
  }

  function activateSubSegValueSelection() {
    const key = getSelectedTargetSubSegValueKey();
    if (!key) {
      setSaveStatus("Select a subSeg first (Ctrl+Left/Right)");
      return;
    }
    state.activeSubSegValueKey = key;
    clearSubSegCardFocusTransferStack(key);
    ensureSubSegTimeline(key);
    resetSubSegTimelineUiState();
    const starterEntry = ensureStarterSubSegValueEntry(key);
    renderSubSegValuePanel();
    const focusActivatedSubSegInput = function () {
      if (focusFirstRealSubSegCardInput(key)) {
        return true;
      }
      return focusStarterSubSegInput();
    };
    requestAnimationFrame(function () {
      if (focusActivatedSubSegInput()) {
        return;
      }
      requestAnimationFrame(function () {
        if (focusActivatedSubSegInput()) {
          return;
        }
        setTimeout(function () {
          focusActivatedSubSegInput();
        }, 0);
      });
    });
  }

  function syncSubSegValueSelectionToCurrentTarget() {
    if (!state.activeSubSegValueKey) {
      return;
    }
    const currentKey = getSelectedTargetSubSegValueKey();
    if (!currentKey || currentKey !== state.activeSubSegValueKey) {
      logRuntimeAction("subseg-selection:sync-current-target", {
        activeSubSegValueKey: state.activeSubSegValueKey,
        currentKey
      });
      clearSubSegCardFocusTransferStack(state.activeSubSegValueKey);
      state.activeSubSegValueKey = null;
      resetSubSegTimelineUiState();
      syncSubSegDraftEditorFocusState();
    }
  }

  function handleSubSegValueSubmit(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    commitSubSegDraftValue();
  }

  function handleSubSegDraftBeforeInput(event) {
    handleSubSegRichEditorBeforeInput(event);
  }

  function handleSubSegDraftKeyDown(event) {
    void event;
  }

  function setSubSegEnterChildSuppression(key, pathKey) {
    state.subSegEnterChildSuppressionKey = getSubSegCardRecallStateKey(key, pathKey);
    window.setTimeout(function () {
      clearSubSegEnterChildSuppression();
    }, 0);
  }

  function clearSubSegEnterChildSuppression() {
    state.subSegEnterChildSuppressionKey = "";
  }

  function insertLineBreakInRichEditor(inputEl) {
    if (!inputEl || !inputEl.isContentEditable) {
      return false;
    }
    const selection = window.getSelection ? window.getSelection() : null;
    if (!selection || selection.rangeCount <= 0) {
      traceSubSegLog("linebreak:no-selection", {
        key: String(inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : ""),
        pathKey: String(inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "")
      });
      return false;
    }
    const range = selection.getRangeAt(0);
    if (!range || !inputEl.contains(range.startContainer) || !inputEl.contains(range.endContainer)) {
      traceSubSegLog("linebreak:range-outside", {
        key: String(inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : ""),
        pathKey: String(inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : ""),
        selectionText: String(selection.toString() || "")
      });
      return false;
    }
    traceSubSegLog("linebreak:insert", {
      key: String(inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : ""),
      pathKey: String(inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : ""),
      selectionText: String(selection.toString() || "")
    });
    range.deleteContents();
    const br = document.createElement("br");
    range.insertNode(br);
    const after = document.createRange();
    after.setStartAfter(br);
    after.collapse(true);
    selection.removeAllRanges();
    selection.addRange(after);
    try {
      inputEl.focus({ preventScroll: true });
    } catch {
      inputEl.focus();
    }
    return true;
  }

  function handleSubSegRichEditorBeforeInput(event) {
    const inputType = String(event && event.inputType ? event.inputType : "");
    const inputEl = event ? event.target : null;
    const selection = window.getSelection ? window.getSelection() : null;
    const selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    traceSubSegLog("beforeinput", {
      inputType,
      key: String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : ""),
      pathKey: String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : ""),
      selectionText: selection && selection.rangeCount > 0 ? String(selection.toString() || "") : "",
      selectionHtml: selectionRange ? getContentEditableSelectionHtml(selectionRange) : "",
      selectionOffsets: inputEl && selectionRange ? getContentEditableSelectionOffsets(inputEl, selectionRange) : null,
      inputHtml: String(inputEl && inputEl.innerHTML ? inputEl.innerHTML : ""),
      inputText: getContentEditableDisplayText(inputEl)
    });
    if (inputType === "insertParagraph") {
      const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
      const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
      const suppressionKey = getSubSegCardRecallStateKey(key, pathKey);
      if (suppressionKey && suppressionKey === state.subSegEnterChildSuppressionKey) {
        event.preventDefault();
        event.stopPropagation();
        clearSubSegEnterChildSuppression();
        return;
      }
      if (!inputEl || !inputEl.classList || !inputEl.classList.contains("subseg-value-card-input")) {
        return;
      }
      const entry = getSubSegValueEntry(key, pathKey);
      if (!entry) {
        return;
      }
      traceSubSegLog("beforeinput:enter-child-attempt", {
        key,
        pathKey,
        selectionText: selectionRange ? String(selection.toString() || "") : "",
        selectionHtml: selectionRange ? getContentEditableSelectionHtml(selectionRange) : "",
        selectionOffsets: selectionRange ? getContentEditableSelectionOffsets(inputEl, selectionRange) : null,
        entryValue: String(entry.value || ""),
        entryHtml: String(entry.html || ""),
        childCount: Array.isArray(entry.children) ? entry.children.length : 0
      });
      const childPathKey = createChildCardFromSelection(key, pathKey, inputEl, entry);
      if (!childPathKey) {
        traceSubSegLog("beforeinput:enter-child-miss", {
          key,
          pathKey,
          selectionText: selectionRange ? String(selection.toString() || "") : "",
          selectionHtml: selectionRange ? getContentEditableSelectionHtml(selectionRange) : "",
          selectionOffsets: selectionRange ? getContentEditableSelectionOffsets(inputEl, selectionRange) : null
        });
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      traceSubSegLog("beforeinput:enter-child-success", {
        key,
        pathKey,
        childPathKey
      });
      setSubSegEnterChildSuppression(key, pathKey);
      renderSubSegValuePanel();
      focusSubSegCardInput(key, childPathKey, false, { immediate: true });
      enqueueAutoSave();
      return;
    }
    if (inputType !== "deleteWordBackward") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    exitSelectedSubSegValueSelection("audSeg subSeg value selection exited");
  }

  function handleSubSegDraftInput() {
    const key = state.activeSubSegValueKey;
    if (!key || !subSegValueInput) {
      return;
    }
    const html = String(subSegValueInput.innerHTML || "");
    const text = String(subSegValueInput.textContent || "").trim();
    logRuntimeAction("subseg-draft:input", {
      key,
      html,
      text
    });
    if (text) {
      state.subSegDraftHtmlByKey[key] = html;
    } else {
      delete state.subSegDraftHtmlByKey[key];
    }
  }

  function commitSubSegDraftValue() {
    const key = state.activeSubSegValueKey;
    if (!key || !subSegValueInput) {
      return;
    }
    const html = String(subSegValueInput.innerHTML || "");
    const text = String(subSegValueInput.textContent || "").trim();
    const starterEntry = ensureStarterSubSegValueEntry(key);
    if (!starterEntry || (!text && !String(html).trim())) {
      return;
    }
    const createdAt = new Date().toISOString();
    const value = text || htmlToPlainText(html).trim();
    logRuntimeAction("subseg-draft:commit", {
      key,
      createdAt,
      value,
      html,
      text
    });
    starterEntry.html = html;
    starterEntry.value = value;
    starterEntry.createdAt = createdAt;
    starterEntry.isStarter = false;
    delete state.subSegDraftHtmlByKey[key];
    subSegValueInput.innerHTML = html;
    renderSubSegValuePanel();
    enqueueAutoSave();
  }

  function htmlToPlainText(html) {
    const probe = document.createElement("div");
    probe.innerHTML = String(html || "");
    return String(probe.textContent || "");
  }

  function getContentEditableDisplayText(inputEl, htmlFallback) {
    const html = String(htmlFallback != null ? htmlFallback : inputEl && inputEl.innerHTML ? inputEl.innerHTML : "");
    const fromHtml = getPlainTextFromContentEditableHtml(html);
    if (fromHtml) {
      return fromHtml;
    }
    if (!inputEl) {
      return "";
    }
    const raw = typeof inputEl.innerText === "string"
      ? inputEl.innerText
      : String(inputEl.textContent || "");
    return String(raw || "").replace(/\r\n?/g, "\n");
  }

  function getPlainTextFromContentEditableHtml(html) {
    const probe = document.createElement("div");
    probe.innerHTML = String(html || "");
    const parts = [];
    const blockTags = {
      DIV: true,
      P: true,
      LI: true,
      UL: true,
      OL: true,
      SECTION: true,
      ARTICLE: true,
      HEADER: true,
      FOOTER: true,
      ASIDE: true,
      MAIN: true,
      BLOCKQUOTE: true
    };

    function visit(node) {
      if (!node) {
        return;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(String(node.nodeValue || ""));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const tag = String(node.tagName || "").toUpperCase();
      if (tag === "BR") {
        parts.push("\n");
        return;
      }
      const shouldWrap = Boolean(blockTags[tag]);
      if (shouldWrap && parts.length > 0) {
        const prior = parts[parts.length - 1];
        if (!/\n$/.test(prior)) {
          parts.push("\n");
        }
      }
      Array.from(node.childNodes || []).forEach(visit);
      if (shouldWrap) {
        const latest = parts[parts.length - 1] || "";
        if (!/\n$/.test(latest)) {
          parts.push("\n");
        }
      }
    }

    Array.from(probe.childNodes || []).forEach(visit);
    return String(parts.join("").replace(/\r\n?/g, "\n")).replace(/\n{3,}/g, "\n\n").trim();
  }

  function textToSafeHtml(text) {
    const probe = document.createElement("div");
    probe.textContent = String(text || "");
    return String(probe.innerHTML || "");
  }

  function textToDisplayHtml(text) {
    return String(text || "")
      .split("\n")
      .map(function (part) {
        return textToSafeHtml(part);
      })
      .join("<br>");
  }

  function normalizeSubSegHighlightRanges(ranges, maxLength) {
    const source = Array.isArray(ranges) ? ranges : [];
    const limit = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : Number.MAX_SAFE_INTEGER;
    const normalized = source
      .map(function (range) {
        const start = Number(range && range.start);
        const end = Number(range && range.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          return null;
        }
        const clippedStart = Math.max(0, Math.min(limit, Math.floor(start)));
        const clippedEnd = Math.max(clippedStart, Math.min(limit, Math.floor(end)));
        if (clippedEnd <= clippedStart) {
          return null;
        }
        return { start: clippedStart, end: clippedEnd };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        if (a.start !== b.start) {
          return a.start - b.start;
        }
        return a.end - b.end;
      });
    const merged = [];
    normalized.forEach(function (range) {
      const last = merged[merged.length - 1];
      if (last && range.start <= last.end) {
        last.end = Math.max(last.end, range.end);
        return;
      }
      merged.push({ start: range.start, end: range.end });
    });
    return merged;
  }

  function buildSubSegInlineHighlightHtml(text, ranges) {
    const source = String(text || "");
    if (!source) {
      return "";
    }
    const normalized = normalizeSubSegHighlightRanges(ranges, source.length);
    if (!normalized.length) {
      return textToDisplayHtml(source);
    }
    let html = "";
    let cursor = 0;
    normalized.forEach(function (range) {
      if (range.start > cursor) {
        html += textToDisplayHtml(source.slice(cursor, range.start));
      }
      const selected = source.slice(range.start, range.end);
      if (selected) {
        html += "<span class=\"subseg-inline-highlight\">" + textToDisplayHtml(selected) + "</span>";
      }
      cursor = range.end;
    });
    if (cursor < source.length) {
      html += textToDisplayHtml(source.slice(cursor));
    }
    return html;
  }

  function buildSubSegInlineBoldHtml(text, ranges) {
    const source = String(text || "");
    if (!source) {
      return "";
    }
    const normalized = normalizeSubSegHighlightRanges(ranges, source.length);
    if (!normalized.length) {
      return textToDisplayHtml(source);
    }
    let html = "";
    let cursor = 0;
    normalized.forEach(function (range) {
      if (range.start > cursor) {
        html += textToDisplayHtml(source.slice(cursor, range.start));
      }
      const selected = source.slice(range.start, range.end);
      if (selected) {
        html += "<strong>" + textToDisplayHtml(selected) + "</strong>";
      }
      cursor = range.end;
    });
    if (cursor < source.length) {
      html += textToDisplayHtml(source.slice(cursor));
    }
    return html;
  }

  function getSubSegCardHighlightRanges(visibleChildren) {
    return Array.isArray(visibleChildren)
      ? visibleChildren
        .map(function (item) {
          return item && item.resolvedSelection ? item.resolvedSelection : null;
        })
        .filter(Boolean)
      : [];
  }

  function getSubSegCardDisplayedHtml(entry, sourceHtml, visibleChildren, activeBubbleIndex) {
    const html = String(sourceHtml != null ? sourceHtml : getSubSegEntryHtml(entry) || "");
    const sourceText = getContentEditableDisplayText(null, html);
    const activeIndex = Number.isFinite(Number(activeBubbleIndex)) ? Math.floor(Number(activeBubbleIndex)) : -1;
    const activeRange = activeIndex >= 0 && Array.isArray(visibleChildren) && visibleChildren[activeIndex]
      ? [visibleChildren[activeIndex].resolvedSelection]
      : null;
    if (activeRange) {
      return buildSubSegInlineHighlightHtml(sourceText, activeRange);
    }
    return buildSubSegInlineBoldHtml(sourceText, getSubSegCardHighlightRanges(visibleChildren));
  }

  function getSubSegEntryHtml(entry) {
    if (!entry || typeof entry !== "object") {
      return "";
    }
    if (entry.seedDisplaySuppressed && !entry.isStarter) {
      return "";
    }
    if (typeof entry.html === "string") {
      return entry.html;
    }
    return textToSafeHtml(entry.value || "");
  }

  function getSubSegEntryCommentHtml(entry) {
    if (!entry || typeof entry !== "object") {
      return "";
    }
    if (typeof entry.commentHtml === "string") {
      return entry.commentHtml;
    }
    return "";
  }

  function hasSubSegEntryCommentContent(entry) {
    return Boolean(htmlToPlainText(getSubSegEntryCommentHtml(entry)).trim());
  }

  function getSubSegEntryText(entry) {
    if (!entry || typeof entry !== "object") {
      return "";
    }
    if (typeof entry.value === "string") {
      return entry.value;
    }
    return htmlToPlainText(getSubSegEntryHtml(entry)).trim();
  }

  function setSubSegEditorHtml(editor, html) {
    if (!editor) {
      return;
    }
    const nextHtml = String(html || "");
    if (String(editor.innerHTML || "") !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }

  function appendSubSegCommentBubble(card, key, pathKey, entry) {
    if (!card || !entry || typeof entry !== "object" || !hasSubSegEntryCommentContent(entry)) {
      return null;
    }
    const bubble = document.createElement("div");
    bubble.className = "subseg-value-comment-bubble";
    bubble.contentEditable = "true";
    bubble.setAttribute("tabindex", "0");
    bubble.dataset.subSegValueKey = String(key || "");
    bubble.dataset.subSegValuePath = String(pathKey || "");
    bubble.addEventListener("focus", handleSubSegCommentBubbleFocus);
    bubble.addEventListener("keydown", handleSubSegCommentBubbleKeyDown);
    bubble.addEventListener("input", handleSubSegCommentBubbleInputLive);
    bubble.addEventListener("change", handleSubSegCommentBubbleInputChange);
    bubble.addEventListener("blur", handleSubSegCommentBubbleInputBlur);
    setSubSegEditorHtml(bubble, getSubSegEntryCommentHtml(entry));
    card.appendChild(bubble);
    return bubble;
  }

  function updateSubSegCardDisplayedHtml(key, pathKey, entry, activeBubbleIndex) {
    if (!subSegValueList || !entry) {
      return false;
    }
    const selector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(pathKey) + "\"]";
    const editor = subSegValueList.querySelector(selector);
    if (!editor) {
      return false;
    }
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    const sourceHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)
      ? String(state.subSegCardLiveValueOverrides[stateKey] || "")
      : getSubSegEntryHtml(entry);
    const displayedValue = getContentEditableDisplayText(editor, sourceHtml);
    const visibleChildren = getSubSegCardVisibleChildren({
      data: {
        entry,
        path: getSubSegValuePathArray(pathKey),
        displayedValue,
        sortedChildren: getSortedChildEntries(entry && entry.children ? entry.children : [])
      },
      deps: {}
    });
    const nextHtml = getSubSegCardDisplayedHtml(entry, sourceHtml, visibleChildren, activeBubbleIndex);
    if (String(editor.innerHTML || "") !== String(nextHtml || "")) {
      editor.innerHTML = nextHtml;
    }
    return true;
  }

  function refreshSubSegCardEditorDisplaysForKey(key) {
    if (!key || !subSegValueList) {
      return false;
    }
    const selector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"]";
    const editors = subSegValueList.querySelectorAll(selector);
    if (!editors || editors.length <= 0) {
      return false;
    }
    const values = Array.isArray(state.subSegValueEntries[key]) ? state.subSegValueEntries[key] : [];
    const starterEntry = values.length > 0 && values[0] && values[0].isStarter ? values[0] : null;
    let changed = false;
    editors.forEach(function (editor) {
      if (!editor) {
        return;
      }
      const pathKey = String(editor.dataset && editor.dataset.subSegValuePath ? editor.dataset.subSegValuePath : "");
      const card = editor.closest ? editor.closest(".subseg-value-card") : null;
      const activeElement = document.activeElement;
      const shouldRestoreSelection = Boolean(activeElement && activeElement === editor && editor.isContentEditable);
      const selection = shouldRestoreSelection && window.getSelection ? window.getSelection() : null;
      const selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const selectionOffsets = shouldRestoreSelection && selectionRange && editor.contains(selectionRange.startContainer) && editor.contains(selectionRange.endContainer)
        ? getContentEditableSelectionOffsets(editor, selectionRange)
        : null;
      let nextHtml = "";
      let isTargetBubble = false;
      if (!pathKey) {
        if (starterEntry) {
          const starterStateKey = getSubSegCardBubbleTargetStateKey(key, "");
          const starterSourceHtml = String(state.subSegDraftHtmlByKey[key] || "") || getSubSegEntryHtml(starterEntry);
          const starterDisplayedValue = getContentEditableDisplayText(editor, starterSourceHtml);
          const starterVisibleChildren = getSubSegCardVisibleChildren({
            data: {
              entry: starterEntry,
              path: [],
              displayedValue: starterDisplayedValue,
              sortedChildren: getSortedChildEntries(starterEntry.children || [])
            },
            deps: {}
          });
          const activeBubbleIndex = getSubSegCardBubbleTargetIndex(starterStateKey, starterVisibleChildren.length);
          nextHtml = getSubSegCardDisplayedHtml(starterEntry, starterSourceHtml, starterVisibleChildren, activeBubbleIndex);
          isTargetBubble = activeBubbleIndex >= 0;
          if (String(starterEntry.html || "") !== String(nextHtml || "")) {
            starterEntry.html = String(nextHtml || "");
          }
        }
      } else {
        const entry = getSubSegValueEntry(key, pathKey);
        if (entry) {
          const stateKey = getSubSegCardRecallStateKey(key, pathKey);
          const sourceHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)
            ? String(state.subSegCardLiveValueOverrides[stateKey] || "")
            : getSubSegEntryHtml(entry);
          const displayedValue = getContentEditableDisplayText(editor, sourceHtml);
          const visibleChildren = getSubSegCardVisibleChildren({
            data: {
              entry,
              path: getSubSegValuePathArray(pathKey),
              displayedValue,
              sortedChildren: getSortedChildEntries(entry && entry.children ? entry.children : [])
            },
            deps: {}
          });
          const activeBubbleIndex = getSubSegCardBubbleTargetIndex(stateKey, visibleChildren.length);
          nextHtml = getSubSegCardDisplayedHtml(entry, sourceHtml, visibleChildren, activeBubbleIndex);
          isTargetBubble = activeBubbleIndex >= 0;
          if (String(entry.html || "") !== String(nextHtml || "")) {
            entry.html = String(nextHtml || "");
          }
        }
      }
      if (card) {
        card.classList.toggle("is-target-bubble", isTargetBubble);
      }
      if (String(editor.innerHTML || "") !== String(nextHtml || "")) {
        editor.innerHTML = nextHtml;
        changed = true;
      }
      if (selectionOffsets) {
        restoreContentEditableSelection(editor, selectionOffsets);
      }
    });
    return changed;
  }

  function renderSubSegValuePanel() {
    if (!subSegValuePanel || !subSegValueList) {
      return;
    }
    const selectedKey = getSelectedTargetSubSegValueKey();
    const isVisible = Boolean(hasTargetSpan() && selectedKey && state.activeSubSegValueKey && selectedKey === state.activeSubSegValueKey);
    logRuntimeAction("subseg-panel:render", {
      selectedKey,
      isVisible,
      activeSubSegValueKey: state.activeSubSegValueKey
    });
    subSegValuePanel.classList.toggle("hidden", !isVisible);
    if (!isVisible) {
      if (subSegValueInput && document.activeElement === subSegValueInput) {
        subSegValueInput.blur();
      }
      subSegValueList.innerHTML = "";
      state.subSegCardLiveValueOverrides = {};
      state.subSegCardInternalChangeGuards = {};
      clearAllSubSegCardCommitTimers();
      scheduleGuideStepRender({ deps: {} });
      return;
    }

    const focusedCommentBubbleSnapshot = captureFocusedSubSegCommentBubbleSnapshot();
    if (subSegValueInput) {
      subSegValueInput.contentEditable = "true";
      subSegValueInput.setAttribute("tabindex", "0");
    }
    const values = Array.isArray(state.subSegValueEntries[selectedKey]) ? state.subSegValueEntries[selectedKey] : [];
    const starterEntry = values.length > 0 && values[0] && values[0].isStarter ? values[0] : null;
    const draftHtml = String(state.subSegDraftHtmlByKey[selectedKey] || "");
    const starterHtml = draftHtml || getSubSegEntryHtml(starterEntry);
    traceSubSegLog("render", {
      selectedKey,
      isVisible,
      activeSubSegValueKey: state.activeSubSegValueKey,
      valueCount: values.length,
      starterPresent: Boolean(starterEntry),
      draftHtmlLength: draftHtml.length,
      activeElementTag: document.activeElement ? String(document.activeElement.tagName || "") : "",
      activeElementClass: document.activeElement && document.activeElement.classList ? String(document.activeElement.className || "") : ""
    });
    if (starterEntry && subSegValueInput) {
      const starterSourceHtml = starterHtml;
      const starterSourceText = getContentEditableDisplayText(subSegValueInput, starterSourceHtml);
      const starterVisibleChildren = getSubSegCardVisibleChildren({
        data: {
          entry: starterEntry,
          path: [],
          displayedValue: starterSourceText,
          sortedChildren: getSortedChildEntries(starterEntry.children || [])
        },
        deps: {}
      });
      const starterDisplayHtml = getSubSegCardDisplayedHtml(starterEntry, starterSourceHtml, starterVisibleChildren);
      const previousDraftKey = String(subSegValueInput.dataset.subSegDraftKey || "");
      subSegValueInput.dataset.subSegDraftKey = selectedKey;
      subSegValueInput.classList.remove("hidden");
      subSegValueInput.contentEditable = "true";
      subSegValueInput.setAttribute("tabindex", "0");
      if (String(starterEntry.html || "") !== String(starterDisplayHtml || "")) {
        starterEntry.html = String(starterDisplayHtml || "");
      }
      if (previousDraftKey !== selectedKey || String(subSegValueInput.innerHTML || "") !== starterDisplayHtml) {
        setSubSegEditorHtml(subSegValueInput, starterDisplayHtml);
      }
    }
    subSegValueList.innerHTML = "";
    if (starterEntry && subSegValueInput) {
      const starterCard = document.createElement("div");
      starterCard.className = "subseg-value-card subseg-value-draft-card";
      starterCard.dataset.subSegStarterCard = "1";
      starterCard.appendChild(subSegValueInput);
      appendSubSegCommentBubble(starterCard, selectedKey, "", starterEntry);
      subSegValueList.appendChild(starterCard);
    } else if (subSegValueInput) {
      subSegValueInput.classList.add("hidden");
    }
    values.forEach(function (entry, entryIndex) {
      if (entry === starterEntry) {
        return;
      }
      renderSubSegValueCardNode(
        selectedKey,
        entry,
        [entryIndex],
        0,
        entryIndex === (values.length - 1),
        [],
        entryIndex + 1,
        entryIndex < (values.length - 1)
      );
    });
    syncSubSegCommentBubbleTabStops();
    restoreFocusedSubSegCommentBubbleSnapshot(focusedCommentBubbleSnapshot);
    syncPlayerTabTargets();
    syncSubSegDraftEditorFocusState();
    scheduleGuideStepRender({ deps: {} });
  }

  function ensureStarterSubSegValueEntry(key) {
    if (!key) {
      return null;
    }
    if (!Array.isArray(state.subSegValueEntries[key])) {
      state.subSegValueEntries[key] = [];
    }
    const list = state.subSegValueEntries[key];
    const firstEntry = list[0];
    if (firstEntry && typeof firstEntry === "object") {
      const firstValue = String(firstEntry.value || "").trim();
      const hasChildren = Array.isArray(firstEntry.children) && firstEntry.children.length > 0;
      const hasAnchors = Number.isFinite(Number(firstEntry.anchorStart)) || Number.isFinite(Number(firstEntry.anchorEnd));
      const isBlankLooseStarter = !firstValue && !hasChildren && !hasAnchors && list.length === 1;
      if (firstEntry.isStarter || isBlankLooseStarter) {
        firstEntry.isStarter = true;
        if (typeof firstEntry.html !== "string") {
          firstEntry.html = textToSafeHtml(firstEntry.value || "");
        }
        if (!firstEntry.nodeId) {
          firstEntry.nodeId = createSubSegValueNodeId();
        }
        if (!Array.isArray(firstEntry.children)) {
          firstEntry.children = [];
        }
        return firstEntry;
      }
    }
    if (list.length === 0) {
      const starterEntry = {
        nodeId: createSubSegValueNodeId(),
        value: "",
        html: "",
        commentHtml: "",
        createdAt: new Date().toISOString(),
        children: [],
        anchorStart: null,
        anchorEnd: null,
        isStarter: true
      };
      list.unshift(starterEntry);
      return starterEntry;
    }
    return null;
  }

  function renderSubSegValueCardNode(key, entry, path, depth, isLastSibling, ancestorGuideDepths, siblingOrder, hasFollowingBranch, isBubbleTarget) {
    if (!subSegValueList || !entry || typeof entry !== "object") {
      return;
    }
    const pathKey = getSubSegValuePathKey(path);
    const card = document.createElement("div");
    card.className = "subseg-value-card";
    card.style.setProperty("--subseg-card-depth", String(Math.max(0, depth)));
    card.classList.toggle("is-nested", depth > 0);
    card.classList.toggle("is-last-sibling", Boolean(isLastSibling) && depth > 0);
    card.classList.toggle("is-target-bubble", Boolean(isBubbleTarget));
    const bridgeLeft = depth > 0 ? -9 : 0;
    const bridgeWidth = depth > 0 ? 4 : 0;
    card.style.setProperty("--subseg-card-line-left", String(bridgeLeft) + "px");
    card.style.setProperty("--subseg-card-bridge-left", String(bridgeLeft) + "px");
    card.style.setProperty("--subseg-card-bridge-width", String(bridgeWidth) + "px");
    card.style.setProperty("--subseg-card-indent-step", "10px");
    card.style.setProperty("--subseg-card-top-extension", "0px");
    card.style.setProperty("--subseg-card-tail-length", "0px");
    if (depth > 0 && Array.isArray(ancestorGuideDepths) && ancestorGuideDepths.length > 0) {
      const uniqueGuideDepths = ancestorGuideDepths.filter(function (guideDepth, idx, arr) {
        return Number.isFinite(guideDepth) && guideDepth > 0 && arr.indexOf(guideDepth) === idx;
      });
      if (uniqueGuideDepths.length > 0) {
        const guides = document.createElement("div");
        guides.className = "subseg-value-ancestor-guides";
        uniqueGuideDepths.forEach(function (guideDepth) {
          const depthDelta = depth - guideDepth;
          if (depthDelta <= 0) {
            return;
          }
          const guide = document.createElement("span");
          guide.className = "subseg-value-ancestor-guide";
          const guideLeft = -9 - (10 * depthDelta);
          guide.style.left = String(guideLeft) + "px";
          guides.appendChild(guide);
        });
        if (guides.childNodes.length > 0) {
          card.appendChild(guides);
        }
      }
    }
    if (depth > 0 && Number.isFinite(siblingOrder) && siblingOrder > 0) {
      void siblingOrder;
    }
    const inputShell = document.createElement("div");
    inputShell.className = "subseg-value-card-input-shell";
    const editor = document.createElement("div");
    editor.className = "subseg-value-card-input";
    editor.contentEditable = "true";
    editor.setAttribute("tabindex", "0");
    editor.dataset.subSegValueKey = key;
    editor.dataset.subSegValuePath = pathKey;
    const liveOverrideKey = getSubSegCardRecallStateKey(key, pathKey);
    const sourceHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, liveOverrideKey)
        ? String(state.subSegCardLiveValueOverrides[liveOverrideKey] || "")
        : getSubSegEntryHtml(entry);
    const displayedValue = getContentEditableDisplayText(null, sourceHtml);
    editor.addEventListener("input", handleSubSegCardInputLive);
    editor.addEventListener("focus", handleSubSegCardInputFocus);
    editor.addEventListener("change", handleSubSegCardInputChange);
    editor.addEventListener("beforeinput", handleSubSegRichEditorBeforeInput);
    editor.addEventListener("blur", handleSubSegCardInputBlur);
    inputShell.appendChild(editor);
    card.appendChild(inputShell);

    const deleteDialogKey = getSubSegCardRecallStateKey(key, pathKey);
    if (state.subSegCardDeleteDialogKey === deleteDialogKey) {
      const actions = document.createElement("div");
      actions.className = "subseg-value-delete-row";

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "subseg-value-delete-cancel";
      cancelButton.dataset.subSegValueDeleteCancel = "1";
      cancelButton.dataset.subSegValueKey = key;
      cancelButton.dataset.subSegValuePath = pathKey;
      cancelButton.textContent = "Cancel";
      cancelButton.addEventListener("click", function () {
        state.subSegCardDeleteDialogKey = null;
        renderSubSegValuePanel();
        focusSubSegCardInput(key, pathKey, false);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "subseg-value-delete-confirm";
      deleteButton.dataset.subSegValueDeleteConfirm = "1";
      deleteButton.dataset.subSegValueKey = key;
      deleteButton.dataset.subSegValuePath = pathKey;
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        deleteSubSegValueCard(key, pathKey);
      });

      actions.appendChild(cancelButton);
      actions.appendChild(deleteButton);
      card.appendChild(actions);
    }

    entry.children = getSortedChildEntries(entry.children);
    const sortedChildren = entry.children;
    const nextAncestorGuideDepths = Array.isArray(ancestorGuideDepths)
      ? ancestorGuideDepths.slice()
      : [];
    if (depth > 0 && !isLastSibling) {
      nextAncestorGuideDepths.push(depth);
    }
    const visibleChildren = getSubSegCardVisibleChildren({
      data: {
        entry,
        path,
        displayedValue,
        sortedChildren
      },
      deps: {}
    });
    const bubbleStateKey = getSubSegCardRecallStateKey(key, pathKey);
    const activeBubbleIndex = getSubSegCardBubbleTargetIndex(bubbleStateKey, visibleChildren.length);
    traceSubSegLog("render:visible-children", {
      key,
      pathKey,
      displayedLength: displayedValue.length,
      lineCount: displayedValue.split("\n").length,
      childCount: sortedChildren.length,
      visibleChildrenCount: visibleChildren.length,
      activeBubbleIndex,
      visibleChildren: visibleChildren.map(function (item) {
        return {
          pathKey: item.childPathKey,
          value: item.childDisplayedValue,
          order: item.order,
          resolvedSelection: item.resolvedSelection
        };
      })
    });
    const hasFollowingContent = Boolean(Boolean(hasFollowingBranch) || visibleChildren.length > 0);
    card.dataset.subsegHasFollowingContent = hasFollowingContent ? "1" : "0";
    card.classList.toggle("has-following-content", hasFollowingContent);
    if (hasFollowingContent) {
      const tail = document.createElement("span");
      tail.className = "subseg-value-card-tail";
      card.appendChild(tail);
    }
    const displayedHtml = getSubSegCardDisplayedHtml(entry, sourceHtml, visibleChildren, activeBubbleIndex);
    if (String(entry.html || "") !== String(displayedHtml || "")) {
      entry.html = String(displayedHtml || "");
    }
    if (String(editor.innerHTML || "") !== String(displayedHtml || "")) {
      editor.innerHTML = displayedHtml;
    }
    appendSubSegCommentBubble(card, key, pathKey, entry);
    subSegValueList.appendChild(card);
    visibleChildren.forEach(function (item, visibleIndex) {
      const childHasFollowingBranch = Boolean((visibleIndex < (visibleChildren.length - 1)) || hasFollowingBranch);
      renderSubSegValueCardNode(
        key,
        item.childEntry,
        item.childPath,
        depth + 1,
        visibleIndex === (visibleChildren.length - 1),
        nextAncestorGuideDepths,
        visibleIndex + 1,
        childHasFollowingBranch,
        visibleIndex === activeBubbleIndex
      );
    });
  }

  function getSubSegCardVisibleChildren(ctx) {
    const { data } = ctx || {};
    const entry = data && data.entry ? data.entry : null;
    const path = Array.isArray(data && data.path) ? data.path : [];
    const displayedValue = String(data && data.displayedValue ? data.displayedValue : "");
    const sortedChildren = Array.isArray(data && data.sortedChildren)
      ? data.sortedChildren
      : getSortedChildEntries(entry && entry.children ? entry.children : []);
    if (!entry || !displayedValue || sortedChildren.length <= 0) {
      return [];
    }
    const visibleChildren = [];
    sortedChildren.forEach(function (childEntry, childIndex) {
      const childPath = path.concat(childIndex);
      const childPathKey = getSubSegValuePathKey(childPath);
      const childDisplayedValue = String(childEntry && childEntry.value ? childEntry.value : "").trim();
      if (!childDisplayedValue) {
        return;
      }
      const resolvedSelection = resolveSubSegCardSelectionRange(displayedValue, childEntry);
      if (!resolvedSelection) {
        return;
      }
      if (String(displayedValue || "").indexOf(childDisplayedValue) < 0) {
        return;
      }
      visibleChildren.push({
        childEntry,
        childPath,
        childPathKey,
        childDisplayedValue,
        resolvedSelection,
        order: visibleChildren.length + 1
      });
    });
    return visibleChildren;
  }

  function resolveSubSegCardSelectionRange(displayedValue, childEntry) {
    const text = String(displayedValue || "");
    const entryValue = String(childEntry && childEntry.value != null ? childEntry.value : "").trim();
    const anchorStart = Number(childEntry && childEntry.anchorStart);
    const anchorEnd = Number(childEntry && childEntry.anchorEnd);
    if (Number.isFinite(anchorStart) && Number.isFinite(anchorEnd) && anchorEnd > anchorStart && anchorStart >= 0 && anchorEnd <= text.length) {
      const anchoredRange = trimSubSegSelectionRange(text, { start: Math.floor(anchorStart), end: Math.floor(anchorEnd) });
      if (anchoredRange) {
        const anchoredText = String(text.slice(anchoredRange.start, anchoredRange.end) || "").trim();
        if (anchoredText && anchoredText === entryValue) {
          return anchoredRange;
        }
        traceSubSegLog("selection:anchor-mismatch", {
          entryValue,
          anchorStart,
          anchorEnd,
          anchoredText,
          displayedLength: text.length
        });
      }
    }
    if (!entryValue) {
      return null;
    }
    const directRange = findBestSubSegTextMatchRange(text, entryValue, Number.isFinite(anchorStart) ? anchorStart : null, Number.isFinite(anchorEnd) ? anchorEnd : null);
    if (directRange) {
      return trimSubSegSelectionRange(text, directRange);
    }
    return null;
  }

  function findBestSubSegTextMatchRange(text, needle, anchorStart, anchorEnd) {
    const source = String(text || "");
    const target = String(needle || "");
    if (!source || !target) {
      return null;
    }
    const matches = [];
    let index = source.indexOf(target);
    while (index >= 0) {
      matches.push(index);
      index = source.indexOf(target, index + 1);
    }
    if (!matches.length) {
      return null;
    }
    if (Number.isFinite(anchorStart) && Number.isFinite(anchorEnd)) {
      const targetCenter = (anchorStart + anchorEnd) / 2;
      let bestIndex = matches[0];
      let bestDistance = Math.abs((bestIndex + (target.length / 2)) - targetCenter);
      matches.slice(1).forEach(function (candidate) {
        const candidateDistance = Math.abs((candidate + (target.length / 2)) - targetCenter);
        if (candidateDistance < bestDistance) {
          bestDistance = candidateDistance;
          bestIndex = candidate;
        }
      });
      return { start: bestIndex, end: bestIndex + target.length };
    }
    const firstIndex = matches[0];
    return { start: firstIndex, end: firstIndex + target.length };
  }

  function trimSubSegSelectionRange(text, range) {
    const source = String(text || "");
    const resolved = range && Number.isFinite(range.start) && Number.isFinite(range.end)
      ? { start: Math.max(0, Math.floor(range.start)), end: Math.max(0, Math.floor(range.end)) }
      : null;
    if (!resolved || resolved.end <= resolved.start) {
      return null;
    }
    let start = resolved.start;
    let end = Math.min(source.length, resolved.end);
    while (start < end && /\s/.test(source.charAt(start))) {
      start += 1;
    }
    while (end > start && /\s/.test(source.charAt(end - 1))) {
      end -= 1;
    }
    if (end <= start) {
      return null;
    }
    return { start, end };
  }

  function renderSubSegCardSelectionBubbles(ctx) {
    const { ui, data } = ctx;
    const selectionLayer = ui && ui.selectionLayer ? ui.selectionLayer : null;
    const input = ui && ui.input ? ui.input : null;
    const inputShell = ui && ui.inputShell ? ui.inputShell : null;
    const displayedValue = String(data && data.displayedValue ? data.displayedValue : "");
    const visibleChildren = Array.isArray(data && data.visibleChildren) ? data.visibleChildren : [];
    const activeBubbleIndex = Number.isFinite(Number(data && data.activeBubbleIndex)) ? Math.floor(Number(data.activeBubbleIndex)) : -1;
    if (!selectionLayer || !input || !inputShell) {
      return;
    }
    traceSubSegLog("bubble:render-start", {
      key: String(input && input.dataset ? input.dataset.subSegValueKey || "" : ""),
      pathKey: String(input && input.dataset ? input.dataset.subSegValuePath || "" : ""),
      displayedLength: displayedValue.length,
      lineCount: displayedValue.split("\n").length,
      visibleChildrenCount: visibleChildren.length,
      activeBubbleIndex,
      inputHtml: String(input && input.innerHTML ? input.innerHTML : ""),
      inputText: getContentEditableDisplayText(input)
    });
    selectionLayer.innerHTML = "";
    if (!displayedValue || visibleChildren.length <= 0) {
      traceSubSegLog("bubble:render-skip", {
        key: String(input && input.dataset ? input.dataset.subSegValueKey || "" : ""),
        pathKey: String(input && input.dataset ? input.dataset.subSegValuePath || "" : ""),
        reason: !displayedValue ? "empty-display" : "no-visible-children"
      });
      return;
    }

    const style = window.getComputedStyle(input);

    visibleChildren.forEach(function (item, visibleIndex) {
      const range = item && item.resolvedSelection ? item.resolvedSelection : null;
      if (!range) {
        return;
      }
      const rawSelectedText = displayedValue.slice(range.start, range.end);
      const leadingTrim = rawSelectedText.match(/^\s*/);
      const trailingTrim = rawSelectedText.match(/\s*$/);
      const startOffset = leadingTrim ? leadingTrim[0].length : 0;
      const endOffset = trailingTrim ? trailingTrim[0].length : 0;
      const trimmedStart = range.start + startOffset;
      const trimmedEnd = range.end - endOffset;
      if (trimmedEnd <= trimmedStart) {
        return;
      }
      const mirror = document.createElement("div");
      mirror.className = "subseg-value-selection-mirror";
      mirror.style.font = [
        style ? style.fontStyle : "",
        style ? style.fontVariant : "",
        style ? style.fontWeight : "",
        style ? style.fontStretch : "",
        style ? style.fontSize : "",
        style ? style.fontFamily : ""
      ].filter(function (value) { return Boolean(String(value || "").trim()); }).join(" ") || "normal 0.78rem Segoe UI, Tahoma, sans-serif";
      mirror.style.paddingLeft = String(Number.parseFloat(style.paddingLeft) || 0) + "px";
      mirror.style.paddingTop = String(Number.parseFloat(style.paddingTop) || 0) + "px";
      mirror.style.paddingRight = String(Number.parseFloat(style.paddingRight) || 0) + "px";
      mirror.style.paddingBottom = String(Number.parseFloat(style.paddingBottom) || 0) + "px";

      const before = document.createElement("span");
      before.className = "subseg-value-selection-mirror-text";
      before.textContent = displayedValue.slice(0, trimmedStart);

      const selected = document.createElement("span");
      selected.className = "subseg-value-selection-mirror-selected";
      selected.textContent = displayedValue.slice(trimmedStart, trimmedEnd);

      const after = document.createElement("span");
      after.className = "subseg-value-selection-mirror-text";
      after.textContent = displayedValue.slice(trimmedEnd);

      mirror.appendChild(before);
      mirror.appendChild(selected);
      mirror.appendChild(after);
      selectionLayer.appendChild(mirror);

      const mirrorRect = mirror.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      const bubblePadX = 2;
      const bubblePadY = 1;
      const left = selectedRect.left - mirrorRect.left - bubblePadX;
      const top = Math.max(0, selectedRect.top - mirrorRect.top - bubblePadY);
      const width = Math.max(12, selectedRect.width + (bubblePadX * 2));
      const height = Math.max(16, selectedRect.height + (bubblePadY * 2));

      const bubble = document.createElement("span");
      bubble.className = "subseg-value-selection-bubble";
      bubble.style.left = String(left) + "px";
      bubble.style.top = String(top) + "px";
      bubble.style.width = String(width) + "px";
      bubble.style.height = String(height) + "px";
      bubble.style.setProperty("--subseg-bubble-order", String(item.order || 1));
      bubble.classList.toggle("is-target", visibleIndex === activeBubbleIndex);
      bubble.setAttribute("aria-hidden", "true");
      selectionLayer.appendChild(bubble);
      traceSubSegLog("bubble:render-item", {
        key: String(input && input.dataset ? input.dataset.subSegValueKey || "" : ""),
        pathKey: String(input && input.dataset ? input.dataset.subSegValuePath || "" : ""),
        order: item.order || 0,
        selectedValue: String(item.childDisplayedValue || ""),
        selectedText: String(displayedValue.slice(trimmedStart, trimmedEnd) || ""),
        range: range,
        left,
        top,
        width,
        height
      });
      selectionLayer.removeChild(mirror);
    });
  }

  function renderDeleteConfirmDialog() {
    if (!deleteConfirmDialog || !deleteConfirmText) {
      return;
    }
    const target = getActiveDeleteTarget();
    const isVisible = Boolean(state.deleteConfirmOpen && target);
    deleteConfirmDialog.classList.toggle("hidden", !isVisible);
    if (!isVisible) {
      return;
    }
    deleteConfirmText.textContent = "Delete " + target.summary + "? This cannot be undone.";
    syncPlayerTabTargets();
  }

  function handleSubSegCardInputChange(event) {
    const inputEl = event ? event.target : null;
    const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
    const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
    if (key && pathKey && consumeSubSegCardInternalChangeGuard(key, pathKey)) {
      return;
    }
    commitSubSegCardInputValue(inputEl, { rerender: false });
  }

  function handleSubSegCardInputBlur(event) {
    const inputEl = event ? event.target : null;
    const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
    const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
    commitSubSegCardInputValue(inputEl, { rerender: false, restoreFocus: false });
    if (key) {
      clearSubSegCardBubbleTargetsForKey(key);
      setSubSegCardBubbleTargetIndex(getSubSegCardBubbleTargetStateKey(key, pathKey), -1);
      refreshSubSegCardEditorDisplaysForKey(key);
    }
  }

  function handleSubSegCardBubbleInputLive(event) {
    return;
  }

  function handleSubSegCardBubbleInputChange(event) {
    return;
  }

  function handleSubSegCommentBubbleFocus(event) {
    const inputEl = event ? event.target : null;
    if (!inputEl || !inputEl.classList || !inputEl.classList.contains("subseg-value-comment-bubble")) {
      return;
    }
    const card = inputEl.closest ? inputEl.closest(".subseg-value-card") : null;
    if (card) {
      syncSubSegCommentBubbleReserve(card, inputEl);
    }
  }

  function handleSubSegCommentBubbleKeyDown(event) {
    const inputEl = event ? event.target : null;
    if (!inputEl || !inputEl.classList || !inputEl.classList.contains("subseg-value-comment-bubble")) {
      return false;
    }
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    const isArrowRight = keyCode === "ArrowRight" || keyValue === "ArrowRight" || keyValue === "Right";
    const isArrowLeft = keyCode === "ArrowLeft" || keyValue === "ArrowLeft" || keyValue === "Left";
    const isArrowUp = keyCode === "ArrowUp" || keyValue === "ArrowUp" || keyValue === "Up";
    const isArrowDown = keyCode === "ArrowDown" || keyValue === "ArrowDown" || keyValue === "Down";
    const isBackspaceKey = keyCode === "Backspace" || keyValue === "Backspace";
    const isSpaceKey = keyCode === "Space" || keyValue === " " || keyValue === "Spacebar";
    const isCtrl = Boolean(event.ctrlKey || event.metaKey);
    const key = String(inputEl.dataset && inputEl.dataset.subSegValueKey ? inputEl.dataset.subSegValueKey : "");
    const pathKey = String(inputEl.dataset && inputEl.dataset.subSegValuePath ? inputEl.dataset.subSegValuePath : "");
    traceSubSegLog("comment-bubble:keydown", {
      key,
      pathKey,
      code: keyCode,
      keyValue,
      ctrl: isCtrl,
      shift: Boolean(event.shiftKey),
      defaultPrevented: Boolean(event.defaultPrevented)
    });
    if (keyCode === "Tab" || keyValue === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      traceSubSegLog("comment-bubble:tab-to-card-input", {
        key,
        pathKey,
        target: pathKey ? "card-input" : "top-input"
      });
      if (pathKey) {
        focusSubSegCardInput(key, pathKey, false, { immediate: true });
      } else {
        focusTopSubSegInput();
      }
      return true;
    }
    if (event.shiftKey && isSpaceKey) {
      event.preventDefault();
      event.stopPropagation();
      traceSubSegLog("comment-bubble:shift-space-toggle", {
        key,
        pathKey,
        action: audio.paused ? "play" : "pause"
      });
      if (audio.paused) {
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
      return true;
    }
    if (isCtrl && isBackspaceKey) {
      event.preventDefault();
      event.stopPropagation();
      traceSubSegLog("comment-bubble:ctrl-backspace-return", {
        key,
        pathKey,
        action: pathKey ? "return-to-card-input" : "return-to-top-input"
      });
      returnSubSegCommentBubbleFocusToOwner(key, pathKey);
      return true;
    }
    traceSubSegLog("comment-bubble:keydown-pass-through", {
      key,
      pathKey,
      keyCode,
      keyValue,
      reason: isCtrl ? "unhandled-ctrl" : "native-editor-default"
    });
    event.stopPropagation();
    return false;
  }

  function handleSubSegCommentBubbleInputLive(event) {
    const inputEl = event ? event.target : null;
    const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
    const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
    const entry = getSubSegCommentBubbleEntry(key, pathKey);
    if (!entry) {
      return;
    }
    const nextHtml = String(inputEl && inputEl.innerHTML ? inputEl.innerHTML : "");
    const nextText = String(inputEl && inputEl.textContent ? inputEl.textContent : "").trim();
    const previousHtml = String(entry.commentHtml || "");
    const previousText = String(entry.commentValue || "").trim();
    logRuntimeAction("subseg-comment:input", {
      key,
      pathKey,
      previousHtml,
      nextHtml,
      previousText,
      nextText
    });
    entry.commentHtml = nextHtml;
    entry.commentValue = nextText;
    entry.commentUpdatedAt = new Date().toISOString();
    enqueueAutoSave();
    const card = inputEl && inputEl.closest ? inputEl.closest(".subseg-value-card") : null;
    if (card) {
      requestAnimationFrame(function () {
        syncSubSegCommentBubbleReserve(card, inputEl);
      });
    }
  }

  function handleSubSegCommentBubbleInputChange(event) {
    handleSubSegCommentBubbleInputLive(event);
  }

  function handleSubSegCommentBubbleInputBlur(event) {
    handleSubSegCommentBubbleInputLive(event);
  }

  function captureFocusedSubSegCommentBubbleSnapshot() {
    const active = document.activeElement;
    if (!active || !active.classList || !active.classList.contains("subseg-value-comment-bubble")) {
      return null;
    }
    const selection = window.getSelection ? window.getSelection() : null;
    const selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const key = String(active.dataset && active.dataset.subSegValueKey ? active.dataset.subSegValueKey : "");
    const pathKey = String(active.dataset && active.dataset.subSegValuePath ? active.dataset.subSegValuePath : "");
    const selectionOffsets = selectionRange && active.contains(selectionRange.startContainer) && active.contains(selectionRange.endContainer)
      ? getContentEditableSelectionOffsets(active, selectionRange)
      : null;
    return {
      key,
      pathKey,
      selectionOffsets
    };
  }

  function restoreFocusedSubSegCommentBubbleSnapshot(snapshot) {
    if (!snapshot || !snapshot.key || !snapshot.pathKey || !subSegValueList) {
      return;
    }
    const selector = ".subseg-value-comment-bubble[data-sub-seg-value-key=\"" + cssEscapeAttr(snapshot.key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(snapshot.pathKey) + "\"]";
    const bubble = subSegValueList.querySelector(selector);
    if (!bubble) {
      return;
    }
    requestAnimationFrame(function () {
      try {
        bubble.focus({ preventScroll: true });
      } catch {
        bubble.focus();
      }
      if (snapshot.selectionOffsets) {
        restoreContentEditableSelection(bubble, snapshot.selectionOffsets);
      }
    });
  }

  function returnSubSegCommentBubbleFocusToOwner(key, pathKey) {
    if (pathKey) {
      focusSubSegCardInput(key, pathKey, false, { immediate: true, preserveBubbleTarget: true });
      return;
    }
    focusTopSubSegInput();
  }

  function syncSubSegCommentBubbleReserve(card, bubble) {
    if (!card || !bubble) {
      return;
    }
    const height = bubble.getBoundingClientRect ? bubble.getBoundingClientRect().height : bubble.offsetHeight;
    const reserve = Math.max(6, Math.ceil(Number(height || 0) / 2));
    card.style.setProperty("--subseg-comment-bubble-reserve", String(reserve) + "px");
  }

  function syncSubSegCommentBubbleTabStops() {
    if (!subSegValueList) {
      return;
    }
    const bubbles = Array.from(subSegValueList.querySelectorAll(".subseg-value-comment-bubble"));
    bubbles.forEach(function (bubble) {
      if (!bubble || bubble.hidden || bubble.classList.contains("hidden")) {
        return;
      }
      bubble.setAttribute("tabindex", "0");
    });
  }

  function getSubSegCommentBubbleEntry(key, pathKey) {
    const directEntry = pathKey ? getSubSegValueEntry(key, pathKey) : null;
    if (directEntry) {
      return directEntry;
    }
    if (!key || !Array.isArray(state.subSegValueEntries[key])) {
      return null;
    }
    const starterEntry = state.subSegValueEntries[key][0];
    if (starterEntry && starterEntry.isStarter) {
      return starterEntry;
    }
    return null;
  }

  function getVisibleSubSegCommentBubblePathList(key) {
    if (!key || !subSegValueList) {
      return [];
    }
    const selector = ".subseg-value-comment-bubble[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path]";
    return Array.from(subSegValueList.querySelectorAll(selector))
      .map(function (node) {
        return String(node.dataset && node.dataset.subSegValuePath ? node.dataset.subSegValuePath : "").trim();
      })
      .filter(function (path) {
        return Boolean(path);
      });
  }

  function moveFocusFromSubSegCommentBubble(key, pathKey, delta) {
    const visiblePaths = getVisibleSubSegCommentBubblePathList(key);
    const total = visiblePaths.length;
    if (total <= 0) {
      return;
    }
    const currentIndex = visiblePaths.indexOf(pathKey);
    if (currentIndex < 0) {
      return;
    }
    const nextIndex = (currentIndex + delta + total) % total;
    focusSubSegCommentBubble(key, visiblePaths[nextIndex]);
  }

  function focusSubSegCommentBubble(key, pathKey) {
    if (!key || !subSegValueList) {
      return;
    }
    const selector = ".subseg-value-comment-bubble[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(pathKey) + "\"]";
    const bubble = subSegValueList.querySelector(selector);
    if (!bubble) {
      return;
    }
    requestAnimationFrame(function () {
      try {
        bubble.focus({ preventScroll: true });
      } catch {
        bubble.focus();
      }
    });
  }

  function handleSubSegCardInputLive(event) {
    const inputEl = event ? event.target : null;
    const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
    const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
    if (!key || !pathKey) {
      return;
    }
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    const html = String(inputEl && inputEl.innerHTML ? inputEl.innerHTML : "");
    const text = String(inputEl && inputEl.textContent ? inputEl.textContent : "").trim();
    const previousHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)
      ? String(state.subSegCardLiveValueOverrides[stateKey] || "")
      : getSubSegEntryHtml(getSubSegValueEntry(key, pathKey));
    const previousText = htmlToPlainText(previousHtml).trim();
    logRuntimeAction("subseg-card:input", {
      key,
      pathKey,
      previousHtml,
      nextHtml: html,
      previousText,
      nextText: text
    });
    state.subSegCardLiveValueOverrides[stateKey] = html;
    setSubSegCardInternalChangeGuard(key, pathKey);
    scheduleSubSegCardCommitDebounced(key, pathKey);
    requestAnimationFrame(function () {
      clearSubSegCardInternalChangeGuard(key, pathKey);
    });
  }

  function handleSubSegCardInputFocus(event) {
    const inputEl = event ? event.target : null;
    const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
    const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
    if (key) {
      syncSubSegCardFocusChain(key, pathKey);
    }
  }

  function clearSubSegCardBubbleCommitTimerByStateKey(stateKey) {
    return;
  }

  function clearAllSubSegCardBubbleCommitTimers() {
    return;
  }

  function scheduleSubSegCardBubbleCommitDebounced(key, pathKey) {
    return;
  }

  function ensureSubSegTextMeasureContext() {
    return null;
  }

  function ensureSubSegCardBubbleMeasureInput() {
    return null;
  }

  function syncSubSegCardBubbleWidth(inputEl) {
    return 0;
  }

  function commitSubSegCardInputValue(inputEl, options) {
    const key = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValueKey || "" : "");
    const pathKey = String(inputEl && inputEl.dataset ? inputEl.dataset.subSegValuePath || "" : "");
    const entry = getSubSegValueEntry(key, pathKey);
    if (!entry) {
      return { changed: false, key, pathKey };
    }
    clearSubSegCardCommitTimerByStateKey(getSubSegCardRecallStateKey(key, pathKey));
    const nextHtml = String(inputEl && inputEl.innerHTML ? inputEl.innerHTML : "");
    const nextText = String(inputEl && inputEl.textContent ? inputEl.textContent : "").trim();
    const previousHtml = getSubSegEntryHtml(entry);
    const previousText = getSubSegEntryText(entry);
    logRuntimeAction("subseg-card:commit-attempt", {
      key,
      pathKey,
      previousHtml,
      nextHtml,
      previousText,
      nextText
    });
    const result = applySubSegCardValueCommit(key, pathKey, {
      html: nextHtml,
      text: nextText
    }, {
      rerender: Boolean(options && options.rerender),
      restoreFocus: Boolean(options && options.restoreFocus)
    });
    if (inputEl && !result.changed) {
      setSubSegEditorHtml(inputEl, getSubSegEntryHtml(entry));
    }
    return result;
  }

  function applySubSegCardValueCommit(key, pathKey, nextValueRaw, options) {
    const entry = getSubSegValueEntry(key, pathKey);
    if (!entry) {
      return { changed: false, key, pathKey };
    }
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    const nextHtmlRaw = String(nextValueRaw && typeof nextValueRaw === "object" ? nextValueRaw.html || "" : "");
    const nextText = String(nextValueRaw && typeof nextValueRaw === "object" ? nextValueRaw.text || "" : "").trim();
    const nextHtml = nextHtmlRaw || textToSafeHtml(nextText);
    const nextValue = nextText || htmlToPlainText(nextHtml).trim();
    const prevHtml = String(entry.html || getSubSegEntryHtml(entry));
    const prevValue = String(entry.value || getSubSegEntryText(entry));
    const hasNextContent = Boolean(nextValue || String(nextHtml).trim());
    logRuntimeAction("subseg-card:commit", {
      key,
      pathKey,
      previousHtml: prevHtml,
      nextHtml,
      previousText: prevValue,
      nextText: nextValue,
      changed: hasNextContent && !(nextHtml === prevHtml && nextText === prevValue)
    });
    if (!hasNextContent || (nextHtml === prevHtml && nextText === prevValue)) {
      if (Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)) {
        delete state.subSegCardLiveValueOverrides[stateKey];
      }
      return { changed: false, key, pathKey };
    }
    entry.html = nextHtml;
    entry.value = nextValue;
    entry.createdAt = new Date().toISOString();
    if (Object.prototype.hasOwnProperty.call(entry, "seedDisplaySuppressed") && hasNextContent) {
      entry.seedDisplaySuppressed = false;
    }
    if (Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)) {
      delete state.subSegCardLiveValueOverrides[stateKey];
    }
    if (options && options.rerender) {
      renderSubSegValuePanel();
      if (options.restoreFocus) {
        focusSubSegCardInput(key, pathKey, false);
      }
    }
    enqueueAutoSave();
    return { changed: true, key, pathKey };
  }

  function clearSubSegCardCommitTimerByStateKey(stateKey) {
    const timerId = Number(state.subSegCardCommitTimerIds[stateKey]);
    if (Number.isFinite(timerId) && timerId > 0) {
      window.clearTimeout(timerId);
    }
    delete state.subSegCardCommitTimerIds[stateKey];
  }

  function setSubSegCardInternalChangeGuard(key, pathKey) {
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    logRuntimeAction("subseg-card:internal-guard:set", {
      key,
      pathKey,
      stateKey
    });
    state.subSegCardInternalChangeGuards[stateKey] = true;
  }

  function clearSubSegCardInternalChangeGuard(key, pathKey) {
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    logRuntimeAction("subseg-card:internal-guard:clear", {
      key,
      pathKey,
      stateKey
    });
    delete state.subSegCardInternalChangeGuards[stateKey];
  }

  function consumeSubSegCardInternalChangeGuard(key, pathKey) {
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    if (!state.subSegCardInternalChangeGuards[stateKey]) {
      return false;
    }
    logRuntimeAction("subseg-card:internal-guard:consume", {
      key,
      pathKey,
      stateKey
    });
    delete state.subSegCardInternalChangeGuards[stateKey];
    return true;
  }

  function clearAllSubSegCardCommitTimers() {
    const keys = Object.keys(state.subSegCardCommitTimerIds || {});
    keys.forEach(function (stateKey) {
      clearSubSegCardCommitTimerByStateKey(stateKey);
    });
  }

  function scheduleSubSegCardCommitDebounced(key, pathKey) {
    if (!key || !pathKey) {
      return;
    }
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    logRuntimeAction("subseg-card:commit-schedule", {
      key,
      pathKey,
      stateKey
    });
    clearSubSegCardCommitTimerByStateKey(stateKey);
    state.subSegCardCommitTimerIds[stateKey] = window.setTimeout(function () {
      clearSubSegCardCommitTimerByStateKey(stateKey);
      const nextHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)
        ? String(state.subSegCardLiveValueOverrides[stateKey] || "")
        : "";
      if (!String(nextHtml).trim()) {
        return;
      }
      const nextText = htmlToPlainText(nextHtml).trim();
      applySubSegCardValueCommit(key, pathKey, {
        html: nextHtml,
        text: nextText
      }, { rerender: false, restoreFocus: false });
    }, 2500);
  }

  function getSubSegValueEntry(key, index) {
    const path = getSubSegValuePathArray(index);
    if (!key || path.length <= 0) {
      return null;
    }
    const list = Array.isArray(state.subSegValueEntries[key]) ? state.subSegValueEntries[key] : null;
    if (!list) {
      return null;
    }
    let node = null;
    for (let i = 0; i < path.length; i += 1) {
      const idx = path[i];
      const source = i === 0
        ? list
        : (node && Array.isArray(node.children) ? node.children : null);
      if (!source || idx < 0 || idx >= source.length) {
        return null;
      }
      node = source[idx];
    }
    return node;
  }

  function getSubSegValuePathArray(pathLike) {
    if (Array.isArray(pathLike)) {
      return pathLike.filter(function (v) { return Number.isFinite(v) && v >= 0; }).map(function (v) { return Math.floor(v); });
    }
    if (typeof pathLike === "number" && Number.isFinite(pathLike)) {
      return [Math.floor(pathLike)];
    }
    const raw = String(pathLike || "").trim();
    if (!raw) {
      return [];
    }
    const mapped = raw.split(".")
      .map(function (part) {
        const idx = Number(part);
        return Number.isFinite(idx) && idx >= 0 ? Math.floor(idx) : NaN;
      });
    if (mapped.some(function (v) { return !Number.isFinite(v); })) {
      return [];
    }
    return mapped;
  }

  function getSubSegValuePathKey(pathLike) {
    return getSubSegValuePathArray(pathLike).join(".");
  }

  function getSubSegCardRecallStateKey(key, pathKey) {
    return key + "#" + String(pathKey || "");
  }

  function handleFocusedSubSegCardKeyDown(event) {
    const active = document.activeElement;
    if (!active || !active.classList || !active.classList.contains("subseg-value-card-input")) {
      return false;
    }
    const keyCode = String(event.code || "");
    const keyValue = String(event.key || "");
    const isEnter = keyCode === "Enter" || keyValue === "Enter";
    const isArrowRight = keyCode === "ArrowRight" || keyValue === "ArrowRight" || keyValue === "Right";
    const isArrowLeft = keyCode === "ArrowLeft" || keyValue === "ArrowLeft" || keyValue === "Left";
    const isArrowUp = keyCode === "ArrowUp" || keyValue === "ArrowUp" || keyValue === "Up";
    const isArrowDown = keyCode === "ArrowDown" || keyValue === "ArrowDown" || keyValue === "Down";
    const isBackspaceKey = keyCode === "Backspace" || keyValue === "Backspace";
    const isSpace = keyCode === "Space" || keyValue === " " || keyValue === "Spacebar";
    const isCtrl = Boolean(event.ctrlKey || event.metaKey);
    const isShift = Boolean(event.shiftKey);
    const key = String(active.dataset.subSegValueKey || "");
    const pathKey = String(active.dataset.subSegValuePath || "");
    const entry = getSubSegValueEntry(key, pathKey);
    if (!entry) {
      return false;
    }
    traceSubSegLog("keydown", {
      key,
      pathKey,
      code: keyCode,
      keyValue,
      ctrl: isCtrl,
      shift: isShift,
      alt: Boolean(event.altKey),
      isEnter,
      selectionText: window.getSelection && window.getSelection().rangeCount > 0 ? String(window.getSelection().toString() || "") : "",
      selectionHtml: window.getSelection && window.getSelection().rangeCount > 0 ? getContentEditableSelectionHtml(window.getSelection().getRangeAt(0)) : "",
      selectionOffsets: window.getSelection && window.getSelection().rangeCount > 0 ? getContentEditableSelectionOffsets(active, window.getSelection().getRangeAt(0)) : null,
      entryValue: String(entry.value || ""),
      entryHtml: String(entry.html || ""),
      childCount: Array.isArray(entry.children) ? entry.children.length : 0
    });
    logRuntimeAction("subseg-card:keydown", {
      key,
      pathKey,
      code: keyCode,
      keyValue,
      ctrl: isCtrl,
      shift: isShift,
      isEnter,
      childCount: Array.isArray(entry.children) ? entry.children.length : 0
    });

    if (isEnter) {
      event.preventDefault();
      event.stopPropagation();
      if (isCtrl) {
        const insertedPathKey = insertBlankSubSegValueCardAfter(key, pathKey);
        if (insertedPathKey) {
          logRuntimeAction("subseg-card:insert-blank-after", {
            key,
            pathKey,
            insertedPathKey
          });
          focusSubSegCardInput(key, insertedPathKey, false);
        }
        return true;
      }
      const childPathKey = createChildCardFromSelection(key, pathKey, active, entry);
      if (childPathKey) {
        setSubSegEnterChildSuppression(key, pathKey);
        renderSubSegValuePanel();
        focusSubSegCardInput(key, childPathKey, false, { immediate: true });
        enqueueAutoSave();
        traceSubSegLog("keydown:enter-child-success", {
          key,
          pathKey,
          childPathKey
        });
        logRuntimeAction("subseg-card:enter-child", {
          key,
          pathKey,
          childPathKey
        });
        return true;
      }
      traceSubSegLog("keydown:enter-child-miss", {
        key,
        pathKey,
        selectionText: window.getSelection && window.getSelection().rangeCount > 0 ? String(window.getSelection().toString() || "") : "",
        selectionHtml: window.getSelection && window.getSelection().rangeCount > 0 ? getContentEditableSelectionHtml(window.getSelection().getRangeAt(0)) : "",
        selectionOffsets: window.getSelection && window.getSelection().rangeCount > 0 ? getContentEditableSelectionOffsets(active, window.getSelection().getRangeAt(0)) : null
      });
      if (insertLineBreakInRichEditor(active)) {
        return true;
      }
      return true;
    }

    if (isSpace && isShift) {
      event.preventDefault();
      event.stopPropagation();
      if (audio.paused) {
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
      return true;
    }

    if (!isCtrl) {
      return false;
    }

    if (isBackspaceKey && isShift) {
      event.preventDefault();
      event.stopPropagation();
      toggleSubSegCardDeleteDialog(key, pathKey);
      return true;
    }

    if ((isArrowLeft || isArrowRight) && !isShift) {
      const displayedHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, getSubSegCardRecallStateKey(key, pathKey))
        ? String(state.subSegCardLiveValueOverrides[getSubSegCardRecallStateKey(key, pathKey)] || "")
        : getSubSegEntryHtml(entry);
      const visibleChildren = getSubSegCardVisibleChildren({
        data: {
          entry,
          path: getSubSegValuePathArray(pathKey),
          displayedValue: getContentEditableDisplayText(active, displayedHtml)
        },
        deps: {}
      });
      if (visibleChildren.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        cycleSubSegInlineChildSelection(active, visibleChildren, isArrowRight ? 1 : -1);
        return true;
      }
    }

    if (isBackspaceKey && isCtrl) {
      event.preventDefault();
      event.stopPropagation();
      exitSelectedSubSegValueSelection("audSeg subSeg value selection exited");
      return true;
    }

    if ((isArrowUp || isArrowDown) && !isShift) {
      event.preventDefault();
      event.stopPropagation();
      moveFocusFromSubSegCardInput(key, pathKey, isArrowDown ? 1 : -1);
      return true;
    }

    return false;
  }

  function getSubSegCardBubbleTargetStateKey(key, pathKey) {
    return getSubSegCardRecallStateKey(key, pathKey);
  }

  function cycleSubSegInlineChildSelection(inputEl, visibleChildren, delta) {
    if (!inputEl || !Array.isArray(visibleChildren) || visibleChildren.length <= 0) {
      return false;
    }
    const total = visibleChildren.length;
    const stateKey = getSubSegCardBubbleTargetStateKey(
      String(inputEl.dataset && inputEl.dataset.subSegValueKey ? inputEl.dataset.subSegValueKey : ""),
      String(inputEl.dataset && inputEl.dataset.subSegValuePath ? inputEl.dataset.subSegValuePath : "")
    );
    const selection = window.getSelection ? window.getSelection() : null;
    const currentRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const currentText = selection ? String(selection.toString() || "") : "";
    const currentOffsets = currentRange ? getContentEditableSelectionOffsets(inputEl, currentRange) : null;
    let currentIndex = visibleChildren.findIndex(function (item) {
      if (!item || !item.resolvedSelection) {
        return false;
      }
      const range = item.resolvedSelection;
      if (!currentOffsets || !currentRange || currentRange.isCollapsed) {
        return false;
      }
      return range.start === currentOffsets.start &&
        range.end === currentOffsets.end;
    });
    if (currentIndex < 0 && currentText) {
      currentIndex = visibleChildren.findIndex(function (item) {
        return item && item.childDisplayedValue === currentText.trim();
      });
    }
    if (currentIndex < 0) {
      currentIndex = getSubSegCardBubbleTargetIndex(stateKey, total);
    }
    const slotCount = total + 1;
    const currentSlot = currentIndex < 0 ? 0 : currentIndex + 1;
    const nextSlot = (currentSlot + delta + slotCount) % slotCount;
    const nextIndex = nextSlot === 0 ? -1 : nextSlot - 1;
    setSubSegCardBubbleTargetIndex(stateKey, nextIndex);
    if (nextIndex < 0) {
      try {
        inputEl.focus({ preventScroll: true });
      } catch {
        inputEl.focus();
      }
      if (selection) {
        selection.removeAllRanges();
      }
      return true;
    }
    const target = visibleChildren[nextIndex];
    if (!target || !target.resolvedSelection) {
      return false;
    }
    try {
      inputEl.focus({ preventScroll: true });
    } catch {
      inputEl.focus();
    }
    restoreContentEditableSelection(inputEl, target.resolvedSelection);
    return true;
  }

  function getSubSegCardBubbleTargetIndex(stateKey, visibleCount) {
    const raw = Number(state.subSegCardBubbleTargetIndexByKey[stateKey]);
    if (!Number.isFinite(raw)) {
      return -1;
    }
    const normalized = Math.floor(raw);
    if (normalized < -1) {
      return -1;
    }
    if (normalized === -1) {
      return -1;
    }
    const total = Number.isFinite(visibleCount) ? Math.floor(visibleCount) : 0;
    if (total <= 0) {
      return -1;
    }
    return normalized % total;
  }

  function setSubSegCardBubbleTargetIndex(stateKey, nextIndex) {
    const value = Number(nextIndex);
    if (!Number.isFinite(value)) {
      logRuntimeAction("subseg-card:bubble-target:set", {
        stateKey,
        nextIndex: null
      });
      delete state.subSegCardBubbleTargetIndexByKey[stateKey];
      return;
    }
    logRuntimeAction("subseg-card:bubble-target:set", {
      stateKey,
      nextIndex: Math.floor(value)
    });
    state.subSegCardBubbleTargetIndexByKey[stateKey] = Math.floor(value);
  }

  function cycleSubSegCardBubbleTarget(key, pathKey, delta, visibleCount) {
    const total = Number.isFinite(visibleCount) ? Math.floor(visibleCount) : 0;
    if (total <= 0) {
      return false;
    }
    const stateKey = getSubSegCardBubbleTargetStateKey(key, pathKey);
    const currentRaw = Number(state.subSegCardBubbleTargetIndexByKey[stateKey]);
    logRuntimeAction("subseg-card:bubble-target:cycle", {
      key,
      pathKey,
      delta,
      visibleCount: total,
      currentRaw
    });
    const slotCount = total + 1;
    let currentSlot = 0;
    if (Number.isFinite(currentRaw) && currentRaw >= 0 && currentRaw < total) {
      currentSlot = Math.floor(currentRaw) + 1;
    } else if (currentRaw === -1) {
      currentSlot = 0;
    } else {
      currentSlot = 0;
    }
    const nextSlot = (currentSlot + delta + slotCount) % slotCount;
    const nextIndex = nextSlot === 0 ? -1 : nextSlot - 1;
    setSubSegCardBubbleTargetIndex(stateKey, nextIndex);
    renderSubSegValuePanel();
    const activeEditor = subSegValueList ? subSegValueList.querySelector(".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(pathKey) + "\"]") : null;
    if (activeEditor) {
      try {
        activeEditor.focus({ preventScroll: true });
      } catch {
        activeEditor.focus();
      }
    }
    return true;
  }

  function getSubSegCardFocusTransferStack(key) {
    if (!key) {
      return [];
    }
    if (!Array.isArray(state.subSegCardFocusTransferStackByKey[key])) {
      state.subSegCardFocusTransferStackByKey[key] = [];
    }
    return state.subSegCardFocusTransferStackByKey[key];
  }

  function clearSubSegCardFocusTransferStack(key) {
    if (!key || !state.subSegCardFocusTransferStackByKey) {
      return;
    }
    delete state.subSegCardFocusTransferStackByKey[key];
  }

  function pushSubSegCardFocusTransfer(key, fromPathKey, toPathKey, bubbleTargetIndex, fromEntry, toEntry) {
    if (!key || !fromPathKey || !toPathKey || !fromEntry || !toEntry) {
      return null;
    }
    const stack = getSubSegCardFocusTransferStack(key);
    const record = {
      fromNodeId: String(fromEntry.nodeId || ""),
      fromPathKey: String(fromPathKey || ""),
      toNodeId: String(toEntry.nodeId || ""),
      toPathKey: String(toPathKey || ""),
      bubbleTargetIndex: Number.isFinite(Number(bubbleTargetIndex)) ? Math.floor(Number(bubbleTargetIndex)) : -1,
      createdAt: new Date().toISOString()
    };
    stack.push(record);
    return record;
  }

  function peekSubSegCardFocusTransfer(key) {
    const stack = key ? state.subSegCardFocusTransferStackByKey[key] : null;
    if (!Array.isArray(stack) || stack.length <= 0) {
      return null;
    }
    return stack[stack.length - 1] || null;
  }

  function popSubSegCardFocusTransfer(key) {
    const stack = key ? state.subSegCardFocusTransferStackByKey[key] : null;
    if (!Array.isArray(stack) || stack.length <= 0) {
      return null;
    }
    const record = stack.pop() || null;
    if (stack.length <= 0) {
      delete state.subSegCardFocusTransferStackByKey[key];
    }
    return record;
  }

  function transferSubSegCardFocusToBubbleTarget(key, pathKey, entry, inputEl) {
    if (!entry || !inputEl) {
      return false;
    }
    const displayedHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, getSubSegCardRecallStateKey(key, pathKey))
      ? String(state.subSegCardLiveValueOverrides[getSubSegCardRecallStateKey(key, pathKey)] || "")
      : getSubSegEntryHtml(entry);
    const visibleChildren = getSubSegCardVisibleChildren({
      data: {
        entry,
        path: getSubSegValuePathArray(pathKey),
        displayedValue: getContentEditableDisplayText(inputEl, displayedHtml)
      },
      deps: {}
    });
    const stateKey = getSubSegCardBubbleTargetStateKey(key, pathKey);
    const bubbleTargetIndex = getSubSegCardBubbleTargetIndex(stateKey, visibleChildren.length);
    if (bubbleTargetIndex < 0) {
      return false;
    }
    const target = visibleChildren[bubbleTargetIndex];
    if (!target || !target.childPathKey || !target.childEntry) {
      return false;
    }
    focusSubSegCardInput(key, target.childPathKey, false, { immediate: true });
    return true;
  }

  function restoreSubSegCardFocusTransfer(key, currentPathKey) {
    const record = peekSubSegCardFocusTransfer(key);
    if (!record || String(record.toPathKey || "") !== String(currentPathKey || "")) {
      return false;
    }
    popSubSegCardFocusTransfer(key);
    const fromPathKey = String(record.fromPathKey || "");
    if (!fromPathKey) {
      return false;
    }
    const targetNodeId = String(record.toNodeId || "");
    let bubbleTargetIndex = -1;
    const fromEntry = fromPathKey ? getSubSegValueEntry(key, fromPathKey) : null;
    const visibleChildren = fromEntry
      ? getSubSegCardVisibleChildren({
        data: {
          entry: fromEntry,
          path: getSubSegValuePathArray(fromPathKey),
          displayedValue: getContentEditableDisplayText(null, getSubSegCardDisplayedHtmlForFocus(key, fromPathKey, fromEntry))
        },
        deps: {}
      })
      : [];
    if (targetNodeId && visibleChildren.length > 0) {
      bubbleTargetIndex = visibleChildren.findIndex(function (item) {
        return item && item.childEntry && String(item.childEntry.nodeId || "") === targetNodeId;
      });
    }
    if (bubbleTargetIndex < 0) {
      bubbleTargetIndex = Number.isFinite(Number(record.bubbleTargetIndex)) ? Math.floor(Number(record.bubbleTargetIndex)) : -1;
    }
    if (fromPathKey && bubbleTargetIndex >= 0) {
      setSubSegCardBubbleTargetIndex(getSubSegCardBubbleTargetStateKey(key, fromPathKey), -1);
    }
    renderSubSegValuePanel();
    if (fromPathKey) {
      focusSubSegCardInput(key, fromPathKey, false, { immediate: true });
    } else {
      focusTopSubSegInput();
    }
    return true;
  }

  function exitSelectedSubSegValueSelection(statusMessage) {
    const hasActiveKey = Boolean(state.activeSubSegValueKey);
    const isStarterVisible = Boolean(subSegValueInput && !subSegValueInput.classList.contains("hidden"));
    if (!hasActiveKey && !isStarterVisible && state.subSegCardDeleteDialogKey === null) {
      return;
    }
    const activeKey = state.activeSubSegValueKey;
    logRuntimeAction("subseg-selection:exit", {
      activeKey,
      statusMessage: String(statusMessage || "audSeg subSeg value selection exited"),
      deleteDialogKey: state.subSegCardDeleteDialogKey
    });
    state.activeSubSegValueKey = null;
    state.subSegCardDeleteDialogKey = null;
    if (subSegValueInput) {
      subSegValueInput.innerHTML = "";
    }
    if (activeKey) {
      delete state.subSegDraftHtmlByKey[activeKey];
      clearSubSegCardFocusTransferStack(activeKey);
    }
    renderSubSegValuePanel();
    setSaveStatus(String(statusMessage || "audSeg subSeg value selection exited"));
  }

  function focusSubSegCardInput(key, pathKey, isRecalling, options) {
    const selector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(pathKey) + "\"]";
    logRuntimeAction("subseg-card:focus", {
      key,
      pathKey,
      isRecalling: Boolean(isRecalling),
      immediate: Boolean(options && options.immediate),
      selectAll: Boolean(options && options.selectAll)
    });
    const focusTarget = function () {
      const input = subSegValueList ? subSegValueList.querySelector(selector) : null;
      if (!input) {
        return;
      }
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
      if (options && options.selectAll) {
        if (input.isContentEditable) {
          const selection = window.getSelection ? window.getSelection() : null;
          const range = document.createRange ? document.createRange() : null;
          if (selection && range) {
            range.selectNodeContents(input);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else if (typeof input.select === "function") {
          input.select();
        }
      } else if (options && Number.isFinite(options.selectionStart) && Number.isFinite(options.selectionEnd)) {
        try {
          if (typeof input.setSelectionRange === "function") {
            input.setSelectionRange(options.selectionStart, options.selectionEnd);
          }
        } catch {
          // Ignore selection failures.
        }
      }
    };
    if (!(options && options.preserveBubbleTarget)) {
      syncSubSegCardFocusChain(key, pathKey);
    }
    if (options && options.immediate) {
      focusTarget();
      return;
    }
    requestAnimationFrame(focusTarget);
  }

  function clearSubSegCardBubbleTargetsForKey(key) {
    if (!key || !state.subSegCardBubbleTargetIndexByKey) {
      return false;
    }
    logRuntimeAction("subseg-card:bubble-target:clear-all", {
      key,
      existingCount: Object.keys(state.subSegCardBubbleTargetIndexByKey).length
    });
    let changed = false;
    Object.keys(state.subSegCardBubbleTargetIndexByKey).forEach(function (stateKey) {
      if (splitSubSegStateKey(stateKey).key !== key) {
        return;
      }
      delete state.subSegCardBubbleTargetIndexByKey[stateKey];
      changed = true;
    });
    return changed;
  }

  function clearSubSegCardBubbleTargetsForSubtree(key, pathKey) {
    if (!key || !state.subSegCardBubbleTargetIndexByKey) {
      return false;
    }
    const prefix = getSubSegCardRecallStateKey(key, pathKey);
    let changed = false;
    Object.keys(state.subSegCardBubbleTargetIndexByKey).forEach(function (stateKey) {
      if (stateKey === prefix || stateKey.startsWith(prefix + ".")) {
        delete state.subSegCardBubbleTargetIndexByKey[stateKey];
        changed = true;
      }
    });
    return changed;
  }

  function getSubSegCardDisplayedHtmlForFocus(key, pathKey, entry) {
    const stateKey = getSubSegCardRecallStateKey(key, pathKey);
    const sourceHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, stateKey)
      ? String(state.subSegCardLiveValueOverrides[stateKey] || "")
      : getSubSegEntryHtml(entry);
    const sourceText = getContentEditableDisplayText(null, sourceHtml);
    const visibleChildren = getSubSegCardVisibleChildren({
      data: {
        entry,
        path: getSubSegValuePathArray(pathKey),
        displayedValue: sourceText,
        sortedChildren: getSortedChildEntries(entry && entry.children ? entry.children : [])
      },
      deps: {}
    });
    const activeBubbleIndex = getSubSegCardBubbleTargetIndex(stateKey, visibleChildren.length);
    return getSubSegCardDisplayedHtml(entry, sourceHtml, visibleChildren, activeBubbleIndex);
  }

  function syncSubSegCardFocusChain(key, pathKey) {
    if (!key || !subSegValueList) {
      return false;
    }
    const path = getSubSegValuePathArray(pathKey);
    clearSubSegCardBubbleTargetsForKey(key);
    if (path.length > 1) {
      for (let depth = 1; depth < path.length; depth += 1) {
        const parentPath = path.slice(0, depth);
        const childPath = path.slice(0, depth + 1);
        const parentPathKey = getSubSegValuePathKey(parentPath);
        const childPathKey = getSubSegValuePathKey(childPath);
        const parentEntry = getSubSegValueEntry(key, parentPathKey);
        const childEntry = getSubSegValueEntry(key, childPathKey);
        if (!parentEntry || !childEntry) {
          break;
        }
        const parentStateKey = getSubSegCardBubbleTargetStateKey(key, parentPathKey);
        const parentSelector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(parentPathKey) + "\"]";
        const parentEditor = subSegValueList.querySelector(parentSelector);
        const parentDisplayedHtml = Object.prototype.hasOwnProperty.call(state.subSegCardLiveValueOverrides, parentStateKey)
          ? String(state.subSegCardLiveValueOverrides[parentStateKey] || "")
          : getSubSegEntryHtml(parentEntry);
        const parentDisplayedValue = getContentEditableDisplayText(parentEditor, parentDisplayedHtml);
        const visibleChildren = getSubSegCardVisibleChildren({
          data: {
            entry: parentEntry,
            path: parentPath,
            displayedValue: parentDisplayedValue,
            sortedChildren: getSortedChildEntries(parentEntry.children || [])
          },
          deps: {}
        });
        const focusedIndex = visibleChildren.findIndex(function (item) {
          return item && String(item.childPathKey || "") === String(childPathKey || "");
        });
        if (focusedIndex < 0) {
          break;
        }
        setSubSegCardBubbleTargetIndex(parentStateKey, focusedIndex);
      }
    }
    refreshSubSegCardEditorDisplaysForKey(key);
    return true;
  }

  function focusTopSubSegInput() {
    if (!subSegValueInput) {
      return;
    }
    requestAnimationFrame(function () {
      try {
        subSegValueInput.focus({ preventScroll: true });
      } catch {
        subSegValueInput.focus();
      }
    });
  }

  function moveFocusFromTopSubSegInput(delta) {
    const key = state.activeSubSegValueKey;
    const visiblePaths = getVisibleSubSegCardPathList(key);
    const totalCards = visiblePaths.length;
    if (totalCards <= 0) {
      return;
    }
    const totalSlots = totalCards + 1;
    const currentSlot = 0;
    const nextSlot = (currentSlot + delta + totalSlots) % totalSlots;
    if (nextSlot === 0) {
      focusTopSubSegInput();
      return;
    }
    const nextPathKey = visiblePaths[nextSlot - 1];
    if (!nextPathKey) {
      return;
    }
    const nextEntry = getSubSegValueEntry(key, nextPathKey);
    if (!nextEntry) {
      return;
    }
    syncSubSegCardFocusChain(key, nextPathKey);
    renderSubSegValuePanel();
    focusSubSegCardInput(key, nextPathKey, false);
  }

  function moveFocusFromSubSegCardInput(key, pathKey, delta) {
    const visiblePaths = getVisibleSubSegCardPathList(key);
    const totalCards = visiblePaths.length;
    if (totalCards <= 0) {
      return;
    }
    logRuntimeAction("subseg-card:move-focus", {
      key,
      pathKey,
      delta,
      visibleCount: totalCards
    });
    const currentIndex = visiblePaths.indexOf(pathKey);
    if (currentIndex < 0) {
      return;
    }
    const nextIndex = (currentIndex + delta + totalCards) % totalCards;
    const nextPathKey = visiblePaths[nextIndex];
    syncSubSegCardFocusChain(key, nextPathKey);
    renderSubSegValuePanel();
    focusSubSegCardInput(key, nextPathKey, false, { immediate: true });
  }

  function insertBlankSubSegValueCardAfter(key, pathKey) {
    const path = getSubSegValuePathArray(pathKey);
    if (!key || path.length <= 0) {
      return "";
    }
    logRuntimeAction("subseg-card:insert-blank", {
      key,
      pathKey,
      path: path.slice()
    });
    const list = Array.isArray(state.subSegValueEntries[key]) ? state.subSegValueEntries[key] : null;
    if (!list) {
      return "";
    }
    const beforePathByNodeId = collectSubSegValueNodePathMap(list, [], {});
    const lastIndex = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    const parentNode = parentPath.length > 0 ? getSubSegValueEntry(key, parentPath) : null;
    const sourceList = parentNode
      ? (Array.isArray(parentNode.children) ? parentNode.children : null)
      : list;
    if (!sourceList || lastIndex < 0 || lastIndex >= sourceList.length) {
      return "";
    }
    const createdAt = new Date().toISOString();
    const insertedEntry = {
      nodeId: createSubSegValueNodeId(),
      value: "",
      html: "",
      commentHtml: "",
      createdAt,
      children: [],
      anchorStart: null,
      anchorEnd: null,
      isStarter: true
    };
    sourceList.splice(lastIndex + 1, 0, insertedEntry);
    const afterPathByNodeId = collectSubSegValueNodePathMap(list, [], {});
    remapSubSegPathStateAfterTreeMutation({
      data: {
        key,
        beforePathByNodeId,
        afterPathByNodeId
      },
      deps: {}
    });
    renderSubSegValuePanel();
    enqueueAutoSave();
    return getSubSegValuePathKey(parentPath.concat(lastIndex + 1));
  }

  function getVisibleSubSegCardPathList(key) {
    if (!key || !subSegValueList) {
      return [];
    }
    const selector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path]";
    const nodes = Array.from(subSegValueList.querySelectorAll(selector));
    return nodes
      .map(function (node) {
        return String(node.dataset && node.dataset.subSegValuePath ? node.dataset.subSegValuePath : "").trim();
      })
      .filter(function (path) { return Boolean(path); });
  }

  function cssEscapeAttr(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

  function toggleSubSegCardDeleteDialog(key, pathKey) {
    const dialogKey = getSubSegCardRecallStateKey(key, pathKey);
    logRuntimeAction("subseg-card:toggle-delete-dialog", {
      key,
      pathKey,
      open: state.subSegCardDeleteDialogKey !== dialogKey
    });
    if (state.subSegCardDeleteDialogKey === dialogKey) {
      state.subSegCardDeleteDialogKey = null;
      renderSubSegValuePanel();
      focusSubSegCardInput(key, pathKey, false);
      return;
    }
    state.subSegCardDeleteDialogKey = dialogKey;
    renderSubSegValuePanel();
    focusSubSegDeleteCancel(key, pathKey);
  }

  function focusSubSegDeleteCancel(key, pathKey) {
    requestAnimationFrame(function () {
      const selector = "button[data-sub-seg-value-delete-cancel=\"1\"][data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(pathKey) + "\"]";
      const btn = subSegValueList ? subSegValueList.querySelector(selector) : null;
      if (!btn) {
        return;
      }
      try {
        btn.focus({ preventScroll: true });
      } catch {
        btn.focus();
      }
    });
  }

  function deleteSubSegValueCard(key, pathKey) {
    const path = getSubSegValuePathArray(pathKey);
    const list = Array.isArray(state.subSegValueEntries[key]) ? state.subSegValueEntries[key] : null;
    if (!list || path.length <= 0) {
      return;
    }
    logRuntimeAction("subseg-card:delete", {
      key,
      pathKey,
      visibleIndex: getVisibleSubSegCardPathList(key).indexOf(pathKey),
      childCount: list.length
    });
    const beforePathByNodeId = collectSubSegValueNodePathMap(list, [], {});
    const lastIndex = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    const parentNode = parentPath.length > 0 ? getSubSegValueEntry(key, parentPath) : null;
    const sourceList = parentNode
      ? (Array.isArray(parentNode.children) ? parentNode.children : null)
      : list;
    if (!sourceList || lastIndex < 0 || lastIndex >= sourceList.length) {
      return;
    }
    const visiblePathsBeforeDelete = getVisibleSubSegCardPathList(key);
    const currentVisibleIndex = visiblePathsBeforeDelete.indexOf(pathKey);
    const nextFocusPathKey = currentVisibleIndex > 0
      ? visiblePathsBeforeDelete[currentVisibleIndex - 1]
      : "";
    sourceList.splice(lastIndex, 1);
    if (!list.length) {
      delete state.subSegValueEntries[key];
    }
    state.subSegCardDeleteDialogKey = null;
    const targetPrefix = key + "#" + getSubSegValuePathKey(path);
    const liveKeys = Object.keys(state.subSegCardLiveValueOverrides);
    liveKeys.forEach(function (k) {
      if (k === targetPrefix || k.startsWith(targetPrefix + ".")) {
        delete state.subSegCardLiveValueOverrides[k];
      }
    });
    const guardKeys = Object.keys(state.subSegCardInternalChangeGuards);
    guardKeys.forEach(function (k) {
      if (k === targetPrefix || k.startsWith(targetPrefix + ".")) {
        delete state.subSegCardInternalChangeGuards[k];
      }
    });
    const timerKeys = Object.keys(state.subSegCardCommitTimerIds);
    timerKeys.forEach(function (k) {
      if (k === targetPrefix || k.startsWith(targetPrefix + ".")) {
        clearSubSegCardCommitTimerByStateKey(k);
      }
    });
    const afterPathByNodeId = collectSubSegValueNodePathMap(list, [], {});
    remapSubSegPathStateAfterTreeMutation({
      data: {
        key,
        beforePathByNodeId,
        afterPathByNodeId
      },
      deps: {}
    });
    renderSubSegValuePanel();
    if (nextFocusPathKey) {
      focusSubSegCardInput(key, nextFocusPathKey, false, { immediate: true });
    } else {
      focusTopSubSegInput();
    }
    enqueueAutoSave();
  }

  function createSubSegValueNodeId() {
    state.subSegValueNodeIdCounter += 1;
    return "card-" + Date.now().toString(36) + "-" + state.subSegValueNodeIdCounter.toString(36);
  }

  function createChildCardFromSelection(key, parentPathKey, inputEl, parentEntry) {
    if (!key || !parentEntry || !inputEl) {
      return "";
    }
    logRuntimeAction("subseg-card:create-child:start", {
      key,
      parentPathKey,
      isRichEditor: Boolean(inputEl.isContentEditable)
    });
    const isRichEditor = Boolean(inputEl.isContentEditable);
    const selection = isRichEditor && window.getSelection ? window.getSelection() : null;
    const selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    traceSubSegLog("createChild:start", {
      key,
      parentPathKey,
      isRichEditor,
      inputHtml: String(inputEl && inputEl.innerHTML ? inputEl.innerHTML : ""),
      inputText: getContentEditableDisplayText(inputEl),
      selectionText: selectionRange ? String(selection.toString() || "") : "",
      selectionHtml: selectionRange ? getContentEditableSelectionHtml(selectionRange) : "",
      selectionOffsets: selectionRange ? getContentEditableSelectionOffsets(inputEl, selectionRange) : null,
      entryValue: String(parentEntry.value || ""),
      entryHtml: String(parentEntry.html || "")
    });
    let selectionStart = null;
    let selectionEnd = null;
    let selectedValue = "";
    let selectedHtml = "";
    if (isRichEditor) {
      if (!selection || selection.rangeCount <= 0 || selection.isCollapsed) {
        traceSubSegLog("createChild:rich-no-selection", {
          key,
          parentPathKey,
          selectionCount: selection ? selection.rangeCount : 0,
          isCollapsed: selection ? selection.isCollapsed : null
        });
        return "";
      }
      const range = selectionRange;
      if (!range || !inputEl.contains(range.startContainer) || !inputEl.contains(range.endContainer)) {
        traceSubSegLog("createChild:rich-range-outside", {
          key,
          parentPathKey,
          selectionText: String(selection.toString() || "")
        });
        return "";
      }
      selectedValue = String(range.toString() || "").trim();
      if (!selectedValue) {
        traceSubSegLog("createChild:rich-empty-selection", {
          key,
          parentPathKey,
          selectionText: String(selection.toString() || "")
        });
        return "";
      }
      const offsets = getContentEditableSelectionOffsets(inputEl, range);
      if (!offsets) {
        traceSubSegLog("createChild:rich-offsets-failed", {
          key,
          parentPathKey,
          selectionText: String(selection.toString() || "")
        });
        return "";
      }
      selectionStart = offsets.start;
      selectionEnd = offsets.end;
      selectedHtml = getContentEditableSelectionHtml(range);
    } else {
      selectionStart = Number(inputEl.selectionStart);
      selectionEnd = Number(inputEl.selectionEnd);
      if (!Number.isFinite(selectionStart) || !Number.isFinite(selectionEnd) || selectionEnd <= selectionStart) {
        return "";
      }
      const sourceValue = String(inputEl.value || "");
      selectedValue = sourceValue.slice(selectionStart, selectionEnd).trim();
      selectedHtml = textToSafeHtml(selectedValue);
    }
    if (!selectedValue) {
      return "";
    }
    if (!Array.isArray(parentEntry.children)) {
      parentEntry.children = [];
    }
    const parentPathArray = getSubSegValuePathArray(parentPathKey);
    parentEntry.children = getSortedChildEntries(parentEntry.children);
    const beforePathByNodeId = collectSubSegValueNodePathMap(parentEntry.children, parentPathArray, {});
    const movedEntries = [];
    const retainedEntries = [];
    parentEntry.children.forEach(function (child, index) {
      if (shouldReparentSubSegChildIntoSelection(child, selectionStart, selectionEnd, selectedValue)) {
        movedEntries.push({
          entry: child,
          oldPathKey: getSubSegValuePathKey(parentPathArray.concat(index))
        });
        return;
      }
      retainedEntries.push(child);
    });
    parentEntry.children = retainedEntries;
    movedEntries.forEach(function (item) {
      rebaseSubSegEntryAnchorsToSelection(item.entry, selectionStart);
    });
    traceSubSegLog("createChild:reparent-candidates", {
      key,
      parentPathKey,
      movedCount: movedEntries.length,
      movedPaths: movedEntries.map(function (item) { return item.oldPathKey; })
    });
    traceSubSegLog("createChild:before-push", {
      key,
      parentPathKey,
      selectedValue,
      selectedHtml,
      selectionStart,
      selectionEnd,
      childCountBefore: parentEntry.children.length
    });
    const createdAt = new Date().toISOString();
    const childNode = {
      nodeId: createSubSegValueNodeId(),
      value: selectedValue,
      html: String(selectedHtml || textToSafeHtml(selectedValue)),
      commentHtml: "",
      createdAt,
      children: [],
      anchorStart: selectionStart,
      anchorEnd: selectionEnd,
      seedDisplaySuppressed: true
    };
    childNode.children = getSortedChildEntries(movedEntries.map(function (item) { return item.entry; }));
    parentEntry.children.push(childNode);
    parentEntry.children = getSortedChildEntries(parentEntry.children);
    const childIndex = parentEntry.children.findIndex(function (child) {
      return child && child.nodeId === childNode.nodeId;
    });
    if (childIndex < 0) {
      traceSubSegLog("createChild:index-missing", {
        key,
        parentPathKey,
        selectedValue
      });
      return "";
    }
    const childPathKey = getSubSegValuePathKey(parentPathKey + "." + String(childIndex));
    const afterPathByNodeId = collectSubSegValueNodePathMap(parentEntry.children, parentPathArray, {});
    remapSubSegPathStateAfterTreeMutation({
      data: {
        key,
        beforePathByNodeId,
        afterPathByNodeId
      },
      deps: {}
    });
    traceSubSegLog("createChild:after-push", {
      key,
      parentPathKey,
      childIndex,
      childPathKey,
      childCountAfter: parentEntry.children.length,
      selectedValue,
      selectedHtml,
      selectionStart,
      selectionEnd
    });
    logRuntimeAction("subseg-card:create-child:success", {
      key,
      parentPathKey,
      childPathKey,
      childIndex,
      selectedValue
    });
    return childPathKey;
  }

  function shouldReparentSubSegChildIntoSelection(entry, selectionStart, selectionEnd, selectedValue) {
    if (!entry || !Number.isFinite(selectionStart) || !Number.isFinite(selectionEnd) || selectionEnd <= selectionStart) {
      return false;
    }
    const childStart = Number(entry.anchorStart);
    const childEnd = Number(entry.anchorEnd);
    if (Number.isFinite(childStart) && Number.isFinite(childEnd) && childEnd > childStart) {
      return childStart >= selectionStart && childEnd <= selectionEnd;
    }
    const childText = String(entry.value || "").trim();
    const selectedText = String(selectedValue || "").trim();
    return Boolean(childText && selectedText && childText === selectedText);
  }

  function rebaseSubSegEntryAnchorsToSelection(entry, selectionStart) {
    if (!entry || !Number.isFinite(selectionStart)) {
      return;
    }
    const childStart = Number(entry.anchorStart);
    const childEnd = Number(entry.anchorEnd);
    if (!Number.isFinite(childStart) || !Number.isFinite(childEnd)) {
      return;
    }
    entry.anchorStart = Math.max(0, Math.floor(childStart - selectionStart));
    entry.anchorEnd = Math.max(0, Math.floor(childEnd - selectionStart));
  }

  function collectSubSegValueNodePathMap(nodes, pathPrefix, map) {
    const target = map && typeof map === "object" ? map : {};
    const list = Array.isArray(nodes) ? nodes : [];
    const basePath = Array.isArray(pathPrefix) ? pathPrefix.slice() : [];
    list.forEach(function (entry, index) {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const path = basePath.concat(index);
      if (typeof entry.nodeId === "string" && entry.nodeId) {
        target[entry.nodeId] = getSubSegValuePathKey(path);
      }
      if (Array.isArray(entry.children) && entry.children.length > 0) {
        collectSubSegValueNodePathMap(entry.children, path, target);
      }
    });
    return target;
  }

  function remapSubSegPathStateAfterTreeMutation(ctx) {
    const { data } = ctx || {};
    const key = String(data && data.key ? data.key : "");
    const beforePathByNodeId = data && data.beforePathByNodeId && typeof data.beforePathByNodeId === "object"
      ? data.beforePathByNodeId
      : {};
    const afterPathByNodeId = data && data.afterPathByNodeId && typeof data.afterPathByNodeId === "object"
      ? data.afterPathByNodeId
      : {};
    if (!key || !Object.keys(beforePathByNodeId).length) {
      return;
    }
    logRuntimeAction("subseg-tree:remap-start", {
      key,
      beforeNodeCount: Object.keys(beforePathByNodeId).length,
      afterNodeCount: Object.keys(afterPathByNodeId).length
    });
    const beforeNodeIdByPath = {};
    Object.keys(beforePathByNodeId).forEach(function (nodeId) {
      const pathKey = String(beforePathByNodeId[nodeId] || "");
      if (pathKey) {
        beforeNodeIdByPath[pathKey] = nodeId;
      }
    });

    const nextBubbleTargets = {};
    const nextLiveOverrides = {};
    const nextInternalGuards = {};
    const nextCommitTimers = {};
    const nextTransferStacks = {};
    const movedTimerKeys = [];
    const currentBubbleTargetEntries = Object.entries(state.subSegCardBubbleTargetIndexByKey || {});
    const currentLiveOverrideEntries = Object.entries(state.subSegCardLiveValueOverrides || {});
    const currentInternalGuardEntries = Object.entries(state.subSegCardInternalChangeGuards || {});
    const currentCommitTimerEntries = Object.entries(state.subSegCardCommitTimerIds || {});
    const currentTransferStackEntries = Object.entries(state.subSegCardFocusTransferStackByKey || {});
    const oldDeleteDialogKey = String(state.subSegCardDeleteDialogKey || "");
    const oldSuppressionKey = String(state.subSegEnterChildSuppressionKey || "");

    function remapExactStateKey(stateKey, value) {
      const parts = splitSubSegStateKey(stateKey);
      if (parts.key !== key) {
        return { stateKey, changed: false, value };
      }
      const nodeId = beforeNodeIdByPath[parts.pathKey];
      const nextPathKey = nodeId ? String(afterPathByNodeId[nodeId] || "") : "";
      if (!nodeId || !nextPathKey || nextPathKey === parts.pathKey) {
        return { stateKey, changed: false, value };
      }
      return {
        stateKey: getSubSegCardRecallStateKey(key, nextPathKey),
        changed: true,
        value,
        nextPathKey
      };
    }

    currentBubbleTargetEntries.forEach(function (entry) {
      const stateKey = String(entry[0] || "");
      const value = entry[1];
      const remapped = remapExactStateKey(stateKey, value);
      nextBubbleTargets[remapped.stateKey] = remapped.value;
    });

    currentLiveOverrideEntries.forEach(function (entry) {
      const stateKey = String(entry[0] || "");
      const value = entry[1];
      const remapped = remapExactStateKey(stateKey, value);
      nextLiveOverrides[remapped.stateKey] = remapped.value;
    });

    currentInternalGuardEntries.forEach(function (entry) {
      const stateKey = String(entry[0] || "");
      const value = entry[1];
      const remapped = remapExactStateKey(stateKey, value);
      nextInternalGuards[remapped.stateKey] = remapped.value;
    });

    currentCommitTimerEntries.forEach(function (entry) {
      const stateKey = String(entry[0] || "");
      const timerId = Number(entry[1]);
      const remapped = remapExactStateKey(stateKey, timerId);
      if (remapped.changed) {
        if (Number.isFinite(timerId) && timerId > 0) {
          window.clearTimeout(timerId);
        }
        movedTimerKeys.push(remapped.stateKey);
      } else {
        nextCommitTimers[remapped.stateKey] = remapped.value;
      }
    });

    currentTransferStackEntries.forEach(function (entry) {
      const stateKey = String(entry[0] || "");
      const stack = Array.isArray(entry[1]) ? entry[1] : [];
      const parts = splitSubSegStateKey(stateKey);
      if (parts.key !== key) {
        if (stack.length > 0) {
          nextTransferStacks[stateKey] = stack.slice();
        }
        return;
      }
      const nextStack = [];
      stack.forEach(function (record) {
        if (!record || typeof record !== "object") {
          return;
        }
        const fromNodeId = String(record.fromNodeId || "");
        const toNodeId = String(record.toNodeId || "");
        const nextFromPathKey = fromNodeId && afterPathByNodeId[fromNodeId] ? String(afterPathByNodeId[fromNodeId] || "") : "";
        const nextToPathKey = toNodeId && afterPathByNodeId[toNodeId] ? String(afterPathByNodeId[toNodeId] || "") : "";
        if (!nextFromPathKey || !nextToPathKey) {
          return;
        }
        nextStack.push({
          fromNodeId,
          fromPathKey: nextFromPathKey,
          toNodeId,
          toPathKey: nextToPathKey,
          bubbleTargetIndex: Number.isFinite(Number(record.bubbleTargetIndex)) ? Math.floor(Number(record.bubbleTargetIndex)) : -1,
          createdAt: String(record.createdAt || "")
        });
      });
      if (nextStack.length > 0) {
        nextTransferStacks[stateKey] = nextStack;
      }
    });

    state.subSegCardBubbleTargetIndexByKey = nextBubbleTargets;
    state.subSegCardLiveValueOverrides = nextLiveOverrides;
    state.subSegCardInternalChangeGuards = nextInternalGuards;
    state.subSegCardCommitTimerIds = nextCommitTimers;
    state.subSegCardFocusTransferStackByKey = nextTransferStacks;
    logRuntimeAction("subseg-tree:remap-complete", {
      key,
      bubbleTargetCount: Object.keys(nextBubbleTargets).length,
      liveOverrideCount: Object.keys(nextLiveOverrides).length,
      internalGuardCount: Object.keys(nextInternalGuards).length,
      commitTimerCount: Object.keys(nextCommitTimers).length,
      transferStackCount: Object.keys(nextTransferStacks).length,
      movedTimerKeys: movedTimerKeys.slice()
    });

    if (oldDeleteDialogKey) {
      const deleteParts = splitSubSegStateKey(oldDeleteDialogKey);
      const deleteNodeId = deleteParts.key === key ? beforeNodeIdByPath[deleteParts.pathKey] : "";
      if (deleteNodeId && afterPathByNodeId[deleteNodeId]) {
        state.subSegCardDeleteDialogKey = getSubSegCardRecallStateKey(key, afterPathByNodeId[deleteNodeId]);
      }
    }

    if (oldSuppressionKey) {
      const suppressionParts = splitSubSegStateKey(oldSuppressionKey);
      const suppressionNodeId = suppressionParts.key === key ? beforeNodeIdByPath[suppressionParts.pathKey] : "";
      if (suppressionNodeId && afterPathByNodeId[suppressionNodeId]) {
        state.subSegEnterChildSuppressionKey = getSubSegCardRecallStateKey(key, afterPathByNodeId[suppressionNodeId]);
      }
    }

    movedTimerKeys.forEach(function (stateKey) {
      const html = String(state.subSegCardLiveValueOverrides[stateKey] || "");
      if (html && String(html).trim()) {
        const remappedParts = splitSubSegStateKey(stateKey);
        scheduleSubSegCardCommitDebounced(remappedParts.key, remappedParts.pathKey);
      }
    });
  }

  function focusStarterSubSegInput() {
    if (!subSegValueInput) {
      return false;
    }
    try {
      subSegValueInput.focus({ preventScroll: true });
      if (typeof subSegValueInput.select === "function") {
        subSegValueInput.select();
      }
    } catch {
      subSegValueInput.focus();
    }
    return true;
  }

  function focusFirstRealSubSegCardInput(key) {
    if (!subSegValueList || !key) {
      return false;
    }
    const selector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path]:not([data-sub-seg-value-path=\"\"])";
    const firstCardInput = subSegValueList.querySelector(selector);
    if (!firstCardInput) {
      return false;
    }
    try {
      firstCardInput.focus({ preventScroll: true });
    } catch {
      firstCardInput.focus();
    }
    return true;
  }

  function splitSubSegStateKey(stateKey) {
    const raw = String(stateKey || "");
    const index = raw.lastIndexOf("#");
    if (index < 0) {
      return { key: raw, pathKey: "" };
    }
    return {
      key: raw.slice(0, index),
      pathKey: raw.slice(index + 1)
    };
  }

  function getContentEditableSelectionHtml(range) {
    if (!range) {
      return "";
    }
    const fragment = range.cloneContents();
    const container = document.createElement("div");
    container.appendChild(fragment);
    return String(container.innerHTML || "");
  }

  function getContentEditableSelectionOffsets(root, range) {
    if (!root || !range) {
      return null;
    }
    try {
      const startRange = document.createRange();
      startRange.selectNodeContents(root);
      startRange.setEnd(range.startContainer, range.startOffset);
      const endRange = document.createRange();
      endRange.selectNodeContents(root);
      endRange.setEnd(range.endContainer, range.endOffset);
      return {
        start: startRange.toString().length,
        end: endRange.toString().length
      };
    } catch {
      return null;
    }
  }

  function getSortedChildEntries(children) {
    const list = Array.isArray(children) ? children.slice() : [];
    list.sort(function (a, b) {
      const aStart = Number.isFinite(Number(a && a.anchorStart)) ? Number(a.anchorStart) : Number.MAX_SAFE_INTEGER;
      const bStart = Number.isFinite(Number(b && b.anchorStart)) ? Number(b.anchorStart) : Number.MAX_SAFE_INTEGER;
      if (aStart !== bStart) {
        return aStart - bStart;
      }
      const aEnd = Number.isFinite(Number(a && a.anchorEnd)) ? Number(a.anchorEnd) : Number.MAX_SAFE_INTEGER;
      const bEnd = Number.isFinite(Number(b && b.anchorEnd)) ? Number(b.anchorEnd) : Number.MAX_SAFE_INTEGER;
      if (aEnd !== bEnd) {
        return aEnd - bEnd;
      }
      const aCreated = String(a && a.createdAt ? a.createdAt : "");
      const bCreated = String(b && b.createdAt ? b.createdAt : "");
      if (aCreated !== bCreated) {
        return aCreated < bCreated ? -1 : 1;
      }
      const aId = String(a && a.nodeId ? a.nodeId : "");
      const bId = String(b && b.nodeId ? b.nodeId : "");
      if (aId === bId) {
        return 0;
      }
      return aId < bId ? -1 : 1;
    });
    return list;
  }

  function getFlattenedSubSegCardList(key) {
    const roots = key && Array.isArray(state.subSegValueEntries[key]) ? state.subSegValueEntries[key] : [];
    const flattened = [];
    function visit(nodes, pathPrefix) {
      const list = Array.isArray(nodes) ? nodes : [];
      list.forEach(function (entry, index) {
        const path = pathPrefix.concat(index);
        flattened.push({
          pathKey: getSubSegValuePathKey(path),
          entry
        });
        if (entry && Array.isArray(entry.children) && entry.children.length > 0) {
          visit(entry.children, path);
        }
      });
    }
    visit(roots, []);
    return flattened;
  }

  function seekBy(deltaSeconds) {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const activeRange = getActiveLoopRange();
    debugLog("seekBy:start", {
      deltaSeconds,
      current,
      duration,
      selectedSpanIndex: state.selectedSpanIndex,
      targetSpanIndex: state.targetSpanIndex,
      activeRange
    });

    if (activeRange) {
      const spanStart = activeRange.start;
      const spanEnd = activeRange.end;
      const spanLength = spanEnd - spanStart;

      if (spanLength > 0) {
        let offset = (current + deltaSeconds) - spanStart;
        offset = ((offset % spanLength) + spanLength) % spanLength;
        audio.currentTime = spanStart + offset;
      }
    } else {
      const next = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, current + deltaSeconds));
      audio.currentTime = next;
    }

    updateUi();
    debugLog("seekBy:end", {
      deltaSeconds,
      nextCurrent: Number.isFinite(audio.currentTime) ? audio.currentTime : null,
      selectedSpanIndex: state.selectedSpanIndex,
      targetSpanIndex: state.targetSpanIndex
    });
  }

  function updateUi() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = clampCurrentTimeWithinSelectedSpan({ data: { duration }, deps: {} });

    progress.value = duration > 0
      ? Math.min(1000, Math.round((current / duration) * 1000))
      : 0;

    const percent = duration > 0 ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0;
    progress.style.setProperty("--progress-pct", String(percent) + "%");
    playhead.style.left = String(percent) + "%";
    playheadTime.textContent = formatTime(current);

    renderMainSubSegOverlays();
    renderCheckpointMarkers();
    renderSelectedSpanOverlay();
    renderTargetProgress();
    renderAudSegNotePanel();
    syncSubSegValueSelectionToCurrentTarget();
    if (!isFocusedSubSegEditor() && !isFocusedSubSegCommentBubble()) {
      renderSubSegValuePanel();
    }
    renderDeleteConfirmDialog();

    if (isPlayerActive() && duration > 0 && !state.hasAutoFocusedProgress) {
      state.hasAutoFocusedProgress = true;
      focusProgressControl();
    }
    scheduleGuideStepRender({ deps: {} });
    syncPlayerTabTargets();
  }

  function clampCurrentTimeWithinSelectedSpan(ctx) {
    const { data } = ctx;
    const { duration } = data;
    let current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

    const activeRange = getActiveLoopRange();
    if (activeRange) {
      const spanStart = activeRange.start;
      const spanEnd = activeRange.end;
      if (spanEnd > spanStart && (current < spanStart || current >= spanEnd)) {
        const epsilon = Math.min(0.02, (spanEnd - spanStart) / 4);
        const loopTime = current < spanStart ? Math.max(spanStart, spanEnd - epsilon) : spanStart;
        debugLog("clampCurrentTimeWithinSelectedSpan:loopClamp", {
          before: current,
          spanStart,
          spanEnd,
          loopTime,
          selectedSpanIndex: state.selectedSpanIndex,
          targetSpanIndex: state.targetSpanIndex
        });
        audio.currentTime = loopTime;
        current = loopTime;
      }
    }

    if (duration <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(duration, current));
  }

  function renderCheckpointMarkers() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const cycleSelectMode = isCheckpointCycleSelectMode();
    const targetSig = hasTargetSpan()
      ? String(state.targetStart.toFixed(3)) + "-" + String(state.targetEnd.toFixed(3))
      : "none";
    const signature = duration.toFixed(3) +
      "|" + state.checkpoints.map(function (v) { return v.toFixed(3); }).join(",") +
      "|" + String(Boolean(state.checkpointDrag)) +
      "|" + String(state.selectedSpanIndex) +
      "|" + targetSig;

    if (signature === state.markerSignature) {
      return;
    }

    state.markerSignature = signature;
    checkpointMarkers.innerHTML = "";

    if (duration <= 0) {
      return;
    }

    const selectedRange = hasTargetSpan() ? getTargetSpanBounds() : getSpanBoundsByIndex(state.selectedSpanIndex);
    const hasLockedTarget = hasTargetSpan();
    function classifyBoundary(seconds) {
      if (!selectedRange) {
        return "";
      }
      if (Math.abs(seconds - selectedRange.start) <= 0.01) {
        return "start";
      }
      if (Math.abs(seconds - selectedRange.end) <= 0.01) {
        return "end";
      }
      return "";
    }

    [0, duration].forEach(function (seconds) {
      const marker = document.createElement("span");
      marker.className = "checkpoint-marker";
      const percent = Math.max(0, Math.min(100, (seconds / duration) * 100));
      marker.style.left = String(percent) + "%";
      const boundaryRole = classifyBoundary(seconds);
      const hideBoundaryTag = Boolean((cycleSelectMode || hasLockedTarget) && boundaryRole);
      if (boundaryRole) {
        marker.classList.add("is-cycle-target-" + boundaryRole);
        if (!cycleSelectMode) {
          marker.classList.add("is-tag-target");
        }
      }

      if (!hideBoundaryTag) {
        const tag = document.createElement("span");
        tag.className = "checkpoint-tag";
        if (boundaryRole) {
          tag.classList.add("cycle-target-tag", "cycle-target-tag-" + boundaryRole);
          if (hasLockedTarget && boundaryRole === "start") {
            tag.classList.add("checkpoint-tag-target-start");
          }
        }
        tag.textContent = formatTime(seconds);
        marker.appendChild(tag);
      }

      checkpointMarkers.appendChild(marker);
    });

    const dragEnabled = !hasTargetSpan();
    state.checkpoints.forEach(function (seconds, checkpointIndex) {
      const marker = document.createElement("span");
      marker.className = "checkpoint-marker" + (dragEnabled ? " is-draggable" : "");
      if (state.checkpointDrag && state.checkpointDrag.index === checkpointIndex) {
        marker.classList.add("is-dragging");
      }
      const boundaryRole = classifyBoundary(seconds);
      if (boundaryRole) {
        marker.classList.add("is-cycle-target-" + boundaryRole);
        if (!cycleSelectMode) {
          marker.classList.add("is-tag-target");
        }
      }
      const percent = Math.max(0, Math.min(100, (seconds / duration) * 100));
      marker.style.left = String(percent) + "%";
      marker.dataset.checkpointIndex = String(checkpointIndex);
      if (dragEnabled) {
        marker.addEventListener("mousedown", function (event) {
          beginCheckpointDrag(event, checkpointIndex);
        });
      }

      const hideBoundaryTag = Boolean((cycleSelectMode || hasLockedTarget) && boundaryRole);
      if (!hideBoundaryTag) {
        const tag = document.createElement("span");
        tag.className = "checkpoint-tag";
        const isDeleteTarget = !hasTargetSpan() &&
          state.deleteTargetType === "checkpoint" &&
          state.deleteTargetIndex === checkpointIndex;
        if (isDeleteTarget) {
          tag.classList.add("is-delete-target");
          marker.classList.add("is-tag-target");
        }
        if (boundaryRole) {
          tag.classList.add("cycle-target-tag", "cycle-target-tag-" + boundaryRole);
          if (hasLockedTarget && boundaryRole === "start") {
            tag.classList.add("checkpoint-tag-target-start");
          }
        }
        tag.textContent = formatTime(seconds);
        marker.appendChild(tag);
      }

      checkpointMarkers.appendChild(marker);
    });
  }

  function renderMainSubSegOverlays() {
    if (!subSegOverlays) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const sig = duration.toFixed(3) + "|" + state.subSegs.map(function (seg, idx) {
      return String(idx) + ":" + seg.start.toFixed(3) + "-" + seg.end.toFixed(3);
    }).join(",");

    if (sig === state.subSegSignature) {
      return;
    }
    state.subSegSignature = sig;
    subSegOverlays.innerHTML = "";

    if (duration <= 0) {
      return;
    }

    state.subSegs.forEach(function (seg) {
      const start = Math.max(0, Math.min(duration, seg.start));
      const end = Math.max(0, Math.min(duration, seg.end));
      if (end <= start) {
        return;
      }
      const startPct = Math.max(0, Math.min(100, (start / duration) * 100));
      const endPct = Math.max(0, Math.min(100, (end / duration) * 100));
      const widthPct = Math.max(0.3, endPct - startPct);
      const span = document.createElement("span");
      span.className = "subseg-main-span";
      span.style.left = String(startPct) + "%";
      span.style.width = String(widthPct) + "%";
      subSegOverlays.appendChild(span);
    });
  }

  function isCheckpointCycleSelectMode() {
    return !hasTargetSpan() && state.selectedSpanIndex >= 0;
  }

  function renderSelectedSpanOverlay() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const allCheckpoints = getCheckpointSeries();
    const spanCount = allCheckpoints.length - 1;
    const cycleSelectMode = isCheckpointCycleSelectMode();
    const hasLockedTarget = hasTargetSpan();
    if (playhead) {
      playhead.classList.toggle("is-target-focus", cycleSelectMode || hasLockedTarget);
    }
    selectedSpanOverlay.classList.toggle("is-cycle-select", cycleSelectMode);
    if (duration <= 0 || state.selectedSpanIndex < 0 || state.selectedSpanIndex >= spanCount) {
      selectedSpanOverlay.style.display = "none";
      selectedSpanOverlay.style.pointerEvents = "none";
      selectedSpanOverlay.style.zIndex = "3";
      setSelectedSpanOverlayTag("");
      return;
    }

    const start = allCheckpoints[state.selectedSpanIndex];
    const end = allCheckpoints[state.selectedSpanIndex + 1];
    const startPercent = Math.max(0, Math.min(100, (start / duration) * 100));
    const endPercent = Math.max(0, Math.min(100, (end / duration) * 100));
    const hasTag = Boolean(cycleSelectMode || hasLockedTarget);

    selectedSpanOverlay.style.display = "block";
    selectedSpanOverlay.style.pointerEvents = hasTag ? "auto" : "none";
    selectedSpanOverlay.style.zIndex = hasTag ? "12" : "3";
    selectedSpanOverlay.style.left = String(startPercent) + "%";
    selectedSpanOverlay.style.width = String(Math.max(0, endPercent - startPercent)) + "%";
    setSelectedSpanOverlayTag(hasTag ? formatCompactedRange(start, end) : "");
  }

  function renderTargetProgress() {
    if (!targetProgressWrap) {
      return;
    }
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const target = getTargetSpanBounds();
    if (!target || duration <= 0) {
      targetProgressWrap.classList.add("hidden");
      targetSpanOverlay.style.display = "none";
      if (targetSubSegActiveFill) {
        targetSubSegActiveFill.style.display = "none";
      }
      return;
    }

    targetProgressWrap.classList.remove("hidden");

    const current = Math.max(target.start, Math.min(target.end, Number.isFinite(audio.currentTime) ? audio.currentTime : target.start));
    const spanLength = Math.max(0, target.end - target.start);
    const spanPercent = spanLength > 0 ? Math.max(0, Math.min(100, ((current - target.start) / spanLength) * 100)) : 0;

    const selectedSubSeg = getTargetSubSegBoundsByIndex(state.selectedTargetSubSegIndex);
    const hasSelectedSubSeg = Boolean(selectedSubSeg && spanLength > 0);
    if (hasSelectedSubSeg) {
      targetProgress.value = 0;
      targetProgress.style.setProperty("--progress-pct", "0%");
    } else {
      targetProgress.value = Math.min(1000, Math.max(0, Math.round((spanPercent / 100) * 1000)));
      targetProgress.style.setProperty("--progress-pct", String(spanPercent) + "%");
    }
    targetPlayhead.style.left = String(spanPercent) + "%";
    targetPlayheadTime.textContent = formatTime(current);

    if (hasSelectedSubSeg && targetSubSegActiveFill) {
      const subSegStartPct = Math.max(0, Math.min(100, ((selectedSubSeg.start - target.start) / spanLength) * 100));
      const subSegCurrent = Math.max(selectedSubSeg.start, Math.min(selectedSubSeg.end, current));
      const subSegCurrentPct = Math.max(0, Math.min(100, ((subSegCurrent - target.start) / spanLength) * 100));
      const fillWidthPct = Math.max(0, subSegCurrentPct - subSegStartPct);
      targetSubSegActiveFill.style.display = "block";
      targetSubSegActiveFill.style.left = String(subSegStartPct) + "%";
      targetSubSegActiveFill.style.width = String(fillWidthPct) + "%";
    } else if (targetSubSegActiveFill) {
      targetSubSegActiveFill.style.display = "none";
    }

    targetSpanOverlay.style.display = "block";
    targetSpanOverlay.style.left = "0%";
    targetSpanOverlay.style.width = "100%";
    renderTargetMarkers(target);
  }

  function renderTargetMarkers(target) {
    const subSegSig = state.targetSubSegs.map(function (seg, idx) {
      return String(idx) + ":" + seg.start.toFixed(3) + "-" + seg.end.toFixed(3);
    }).join(",");
    const signature = [target.start, target.end, state.selectedTargetSubSegIndex, subSegSig]
      .map(function (v) { return String(v); })
      .join("|");
    if (state.targetMarkerSignature === signature) {
      return;
    }
    state.targetMarkerSignature = signature;
    targetCheckpointMarkers.innerHTML = "";

    [target.start, target.end].forEach(function (seconds, idx) {
      const marker = document.createElement("span");
      marker.className = "checkpoint-marker";
      marker.style.left = idx === 0 ? "0%" : "100%";

      const tag = document.createElement("span");
      tag.className = "checkpoint-tag";
      tag.textContent = formatTime(seconds);
      marker.appendChild(tag);

      targetCheckpointMarkers.appendChild(marker);
    });

    const spanLength = Math.max(0, target.end - target.start);
    if (spanLength <= 0) {
      return;
    }
    state.targetSubSegs.forEach(function (seg, idx) {
      const startPct = Math.max(0, Math.min(100, ((seg.start - target.start) / spanLength) * 100));
      const endPct = Math.max(0, Math.min(100, ((seg.end - target.start) / spanLength) * 100));
      const widthPct = Math.max(0.8, endPct - startPct);

      const span = document.createElement("span");
      span.className = "target-subseg-span" + (idx === state.selectedTargetSubSegIndex ? " selected" : "");
      if (idx === state.selectedTargetSubSegIndex || (state.deleteTargetType === "subseg" && state.deleteTargetIndex === idx)) {
        span.classList.add("is-tag-target");
      }
      span.style.left = String(startPct) + "%";
      span.style.width = String(widthPct) + "%";

      const tag = document.createElement("span");
      tag.className = "checkpoint-tag target-subseg-tag";
      if (state.deleteTargetType === "subseg" && state.deleteTargetIndex === idx) {
        tag.classList.add("is-delete-target");
      }
      tag.textContent = formatCompactedRange(seg.start, seg.end);
      span.appendChild(tag);

      targetCheckpointMarkers.appendChild(span);
    });
  }

  function getCheckpointSeries() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (duration <= 0) {
      return [];
    }

    const points = [0].concat(state.checkpoints).concat([duration]).sort(function (a, b) { return a - b; });
    const deduped = [];
    points.forEach(function (point) {
      if (!deduped.length || Math.abs(point - deduped[deduped.length - 1]) > 0.01) {
        deduped.push(point);
      }
    });
    return deduped;
  }

  function normalizeSubSegValueEntries(rawEntries) {
    const source = rawEntries && typeof rawEntries === "object" ? rawEntries : {};
    const normalized = {};
    const nowIso = new Date().toISOString();
    Object.keys(source).forEach(function (key) {
      const values = Array.isArray(source[key]) ? source[key] : [];
      const cleaned = values
        .map(function (entry) {
          return normalizeSubSegValueEntryNode(entry, nowIso);
        })
        .filter(function (v) { return Boolean(v); })
        .slice(0, 200);
      if (cleaned.length > 0) {
        normalized[key] = cleaned;
      }
    });
    return normalized;
  }

  function normalizeAudSegNoteEntries(rawEntries) {
    const source = rawEntries && typeof rawEntries === "object" ? rawEntries : {};
    const normalized = {};
    Object.keys(source).forEach(function (key) {
      const html = String(source[key] || "");
      if (html) {
        normalized[key] = html.slice(0, 20000);
      }
    });
    return normalized;
  }

  function normalizeSubSegTimelines(rawTimelines, subSegValueEntries) {
    return {};
  }

  function normalizeSubSegValueEntryNode(entry, nowIso) {
    if (entry && typeof entry === "object") {
      const rawValue = String(entry.value || "").trim();
      const html = typeof entry.html === "string" && entry.html ? String(entry.html) : textToSafeHtml(rawValue);
      const value = rawValue || htmlToPlainText(html).trim();
      const isStarter = Boolean(entry.isStarter);
      if (!String(html).trim() && !value && !isStarter) {
        return null;
      }
      const createdAt = String(entry.createdAt || nowIso);
      const childrenRaw = Array.isArray(entry.children) ? entry.children : [];
      const children = getSortedChildEntries(
        childrenRaw
          .map(function (child) { return normalizeSubSegValueEntryNode(child, nowIso); })
          .filter(function (child) { return Boolean(child); })
      );
      const anchorStartRaw = Number(entry.anchorStart);
      const anchorEndRaw = Number(entry.anchorEnd);
      const anchorStart = Number.isFinite(anchorStartRaw) && anchorStartRaw >= 0 ? Math.floor(anchorStartRaw) : null;
      const anchorEnd = Number.isFinite(anchorEndRaw) && anchorEndRaw >= 0 ? Math.floor(anchorEndRaw) : null;
      return {
        nodeId: typeof entry.nodeId === "string" && entry.nodeId ? entry.nodeId : createSubSegValueNodeId(),
        value,
        html,
        commentHtml: typeof entry.commentHtml === "string" ? String(entry.commentHtml) : "",
        createdAt,
        children,
        anchorStart,
        anchorEnd,
        isStarter
      };
    }
    const value = String(entry || "").trim();
    if (!value) {
      return null;
    }
    return {
      nodeId: createSubSegValueNodeId(),
      value,
      html: textToSafeHtml(value),
      commentHtml: "",
      createdAt: nowIso,
      children: [],
      anchorStart: null,
      anchorEnd: null,
      isStarter: false
    };
  }

  function getSubSegsForBounds(bounds) {
    if (!bounds) {
      return [];
    }
    return state.subSegs.filter(function (seg) {
      return seg.start >= bounds.start - 0.01 && seg.end <= bounds.end + 0.01;
    });
  }

  function syncTargetSubSegsFromCurrentBounds(ctx) {
    const data = ctx || {};
    const selectedStart = Number(data.selectedStart);
    const selectedEnd = Number(data.selectedEnd);
    const bounds = getTargetSpanBounds();
    state.targetSubSegs = getSubSegsForBounds(bounds);
    if (!state.targetSubSegs.length) {
      state.selectedTargetSubSegIndex = -1;
      return;
    }

    if (Number.isFinite(selectedStart) && Number.isFinite(selectedEnd)) {
      const idx = state.targetSubSegs.findIndex(function (seg) {
        return Math.abs(seg.start - selectedStart) <= 0.01 && Math.abs(seg.end - selectedEnd) <= 0.01;
      });
      if (idx >= 0) {
        state.selectedTargetSubSegIndex = idx;
        return;
      }
    }

    if (state.selectedTargetSubSegIndex < 0 || state.selectedTargetSubSegIndex >= state.targetSubSegs.length) {
      state.selectedTargetSubSegIndex = -1;
    }
  }

  function getSpanBoundsByIndex(index) {
    const allCheckpoints = getCheckpointSeries();
    const spanCount = allCheckpoints.length - 1;
    if (index < 0 || index >= spanCount) {
      return null;
    }
    const start = allCheckpoints[index];
    const end = allCheckpoints[index + 1];
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return null;
    }
    return { start, end, index };
  }

  function hasTargetSpan() {
    return Number.isFinite(state.targetStart) && Number.isFinite(state.targetEnd) && state.targetEnd > state.targetStart;
  }

  function getTargetSpanBounds() {
    if (!hasTargetSpan()) {
      return null;
    }
    return {
      start: state.targetStart,
      end: state.targetEnd,
      index: Number.isFinite(state.targetSpanIndex) ? state.targetSpanIndex : -1
    };
  }

  function getTargetSubSegBoundsByIndex(index) {
    if (index < 0 || index >= state.targetSubSegs.length) {
      return null;
    }
    const seg = state.targetSubSegs[index];
    if (!seg || !Number.isFinite(seg.start) || !Number.isFinite(seg.end) || seg.end <= seg.start) {
      return null;
    }
    return { start: seg.start, end: seg.end, index };
  }

  function getActiveLoopRange() {
    if (state.checkpointDrag) {
      return null;
    }
    const subSeg = getTargetSubSegBoundsByIndex(state.selectedTargetSubSegIndex);
    if (subSeg) {
      return subSeg;
    }
    const target = getTargetSpanBounds();
    if (target) {
      return target;
    }
    return getSpanBoundsByIndex(state.selectedSpanIndex);
  }

  function clearTargetSpanLock(ctx) {
    const data = ctx || {};
    const preserveSelection = Boolean(data.preserveSelection);
    const priorIndex = Number.isFinite(state.targetSpanIndex) ? state.targetSpanIndex : -1;
    logRuntimeAction("audseg:unlock-target", {
      preserveSelection,
      priorIndex
    });
    state.targetSpanIndex = -1;
    state.targetStart = null;
    state.targetEnd = null;
    state.targetSubSegs = [];
    state.selectedTargetSubSegIndex = -1;
    state.subSegCardInternalChangeGuards = {};
    state.subSegCardDeleteDialogKey = null;
    state.activeSubSegValueKey = null;
    resetSubSegTimelineUiState();
    state.shiftHoldTss = null;
    state.targetMarkerSignature = "";
    state.audSegNoteEditorVisible = false;
    syncAudSegEditorFocusState();
    if (state.deleteTargetType === "subseg" || state.deleteConfirmOpen) {
      clearDeleteTarget({ silent: true });
    }
    if (preserveSelection && priorIndex >= 0) {
      state.selectedSpanIndex = priorIndex;
    }
    renderAudSegNotePanel();
    debugLog("target:cleared", { preserveSelection, priorIndex, selectedSpanIndex: state.selectedSpanIndex });
  }

  function lockSelectedSpanAsTarget() {
    const span = getSpanBoundsByIndex(state.selectedSpanIndex);
    if (!span) {
      setSaveStatus("Select an audSeg first (Ctrl+Left/Right)");
      return;
    }
    logRuntimeAction("audseg:lock-target", {
      selectedSpanIndex: state.selectedSpanIndex,
      spanIndex: span.index,
      start: span.start,
      end: span.end
    });
    if (!audio.paused) {
      audio.pause();
    }
    state.targetSpanIndex = span.index;
    state.targetStart = span.start;
    state.targetEnd = span.end;
    state.shiftHoldTss = null;
    syncTargetSubSegsFromCurrentBounds();
    state.selectedTargetSubSegIndex = -1;
    state.targetMarkerSignature = "";
    const spanLength = span.end - span.start;
    const epsilon = Math.min(0.02, Math.max(0.003, spanLength / 20));
    audio.currentTime = Math.min(span.end - 0.001, span.start + epsilon);
    updateUi();
    renderAudSegNotePanel();
    debugLog("target:locked", { index: span.index, start: span.start, end: span.end });
    setSaveStatus("audSeg target locked (playback reset to start)");
  }

  function enqueueAutoSave() {
    if (!state.currentFile || !audio.src) {
      return state.saveQueue;
    }

    logRuntimeAction("session:auto-save", {
      currentFile: state.currentFile ? state.currentFile.name : "",
      activeSessionId: state.activeSessionId,
      activeRevision: state.activeRevision,
      checkpoints: state.checkpoints.length,
      subSegs: state.subSegs.length,
      targetSpanIndex: state.targetSpanIndex,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
      activeSubSegValueKey: state.activeSubSegValueKey
    });
    state.isPersisting = true;
    setSaveStatus("Saving...");
    refreshCardInteractivity();
    renderAudioCards(state.sessionsCache);
    state.saveQueue = state.saveQueue
      .then(function () {
        return saveSessionState();
      })
      .then(function () {
        state.isPersisting = false;
        setSaveStatus("Saved");
        refreshCardInteractivity();
        renderAudioCards(state.sessionsCache);
      })
      .catch(function (error) {
        state.isPersisting = false;
        if (state.pendingUpload) {
          state.pendingUpload.phase = "failed";
        }
        setSaveStatus("Save failed: " + normalizeErrorMessage(error), true);
        refreshCardInteractivity();
        renderAudioCards(state.sessionsCache);
      });

    return state.saveQueue;
  }

  function refreshCardInteractivity() {
    const cardButtons = cards.querySelectorAll(".audio-card");
    cardButtons.forEach(function (button) {
      if (button.tagName === "BUTTON") {
        button.disabled = state.isPersisting;
      }
      button.classList.toggle("is-disabled", state.isPersisting);
    });
  }

  async function deleteSession(sessionId) {
    return sessionRuntime.deleteSession({
      data: { state, sessionId },
      deps: {
        fetch: boundFetch,
        buildAuthHeaders,
        clearLoginState,
        renderAudioCards,
        setSaveStatus,
        loadPersistedAudioCards,
        normalizeErrorMessage: function (ctx) {
          return sessionRuntime.normalizeErrorMessage(ctx);
        }
      }
    });
  }

  function setSaveStatus(text, isError) {
    logRuntimeAction("ui:save-status", {
      text: String(text || ""),
      isError: Boolean(isError),
      workspacePhase: state.workspacePhase,
      targetSpanIndex: state.targetSpanIndex,
      selectedSpanIndex: state.selectedSpanIndex,
      selectedTargetSubSegIndex: state.selectedTargetSubSegIndex,
      activeSubSegValueKey: state.activeSubSegValueKey
    });
    saveStatus.textContent = text;
    saveStatus.classList.toggle("error", Boolean(isError));
  }

  function setLoginStatus(text, isError) {
    if (!loginStatus) {
      return;
    }
    logRuntimeAction("ui:login-status", {
      text: String(text || ""),
      isError: Boolean(isError),
      authUser: state.authUser,
      isGuideMode: state.isGuideMode
    });
    loginStatus.textContent = text;
    loginStatus.classList.toggle("error", Boolean(isError));
  }

  function normalizeErrorMessage(error) {
    return sessionRuntime.normalizeErrorMessage({ data: { error }, deps: {} });
  }

  function persistLogin(record) {
    if (window.audioTestAuthStorage && typeof window.audioTestAuthStorage.persistLogin === "function") {
      window.audioTestAuthStorage.persistLogin({
        data: {
          username: record && record.username,
          token: record && record.token,
          loggedInAt: record && record.loggedInAt,
          ttlMs: record && record.ttlMs,
          lastActivityAt: record && record.lastActivityAt
        },
        deps: {}
      });
      return;
    }
    try {
      const ttlMs = Number(record.ttlMs);
      const safe = {
        username: String(record.username || "").toLowerCase(),
        token: String(record.token || ""),
        loggedInAt: Number(record.loggedInAt || Date.now()),
        ttlMs: Number.isFinite(ttlMs) ? ttlMs : LOGIN_TTL_MS,
        lastActivityAt: Number(record.lastActivityAt || Date.now())
      };
      window.localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(safe));
    } catch {
      // Ignore storage failures.
    }
  }

  function restoreLoginFromStorage() {
    if (window.audioTestAuthStorage && typeof window.audioTestAuthStorage.restoreLogin === "function") {
      return window.audioTestAuthStorage.restoreLogin({
        data: {
          allowedUsers: ALLOWED_USERS,
          fallbackTtlMs: LOGIN_TTL_MS
        },
        deps: {}
      });
    }
    try {
      const raw = window.localStorage.getItem(LOGIN_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      const username = String(parsed && parsed.username ? parsed.username : "").toLowerCase();
      const token = String(parsed && parsed.token ? parsed.token : "");
      const loggedInAt = Number(parsed && parsed.loggedInAt);
      const ttlMsValue = Number(parsed && parsed.ttlMs);
      const ttlMs = Number.isFinite(ttlMsValue) ? ttlMsValue : LOGIN_TTL_MS;
      const lastActivityAt = Number(parsed && parsed.lastActivityAt ? parsed.lastActivityAt : loggedInAt);
      if (
        ALLOWED_USERS.indexOf(username) < 0 ||
        !token ||
        !Number.isFinite(loggedInAt) ||
        !Number.isFinite(ttlMs) ||
        !Number.isFinite(lastActivityAt)
      ) {
        return null;
      }
      if (ttlMs > 0 && (Date.now() - lastActivityAt) > ttlMs) {
        window.localStorage.removeItem(LOGIN_STORAGE_KEY);
        return null;
      }
      return { username, token, loggedInAt, ttlMs, lastActivityAt };
    } catch {
      return null;
    }
  }

  function readGuideSeenVersionMap() {
    try {
      const raw = window.localStorage.getItem(GUIDE_SEEN_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return parsed;
    } catch {
      return {};
    }
  }

  function writeGuideSeenVersionMap(map) {
    try {
      window.localStorage.setItem(GUIDE_SEEN_STORAGE_KEY, JSON.stringify(map || {}));
    } catch {
      // Ignore storage failures.
    }
  }

  function hasUnseenGuideFeatureForUser(username) {
    const user = String(username || "").trim().toLowerCase();
    if (!user) {
      return false;
    }
    const map = readGuideSeenVersionMap();
    return String(map[user] || "") !== GUIDE_FEATURE_VERSION;
  }

  function markGuideFeatureSeenForCurrentUser() {
    const user = String(state.authUser || "").trim().toLowerCase();
    if (!user) {
      return;
    }
    const map = readGuideSeenVersionMap();
    map[user] = GUIDE_FEATURE_VERSION;
    writeGuideSeenVersionMap(map);
  }

  function renderGuideFeatureBadge() {
    const showBadge = hasUnseenGuideFeatureForUser(state.authUser);
    const wasVisible = Boolean(state.guideFeatureBadgeVisible);
    state.guideFeatureBadgeVisible = showBadge;
    [guideButtonList, guideButtonPlayer].forEach(function (btn) {
      if (!btn) {
        return;
      }
      btn.classList.toggle("has-new-guide-feature", showBadge);
      btn.setAttribute("aria-label", showBadge ? "Start guide mode (new feature added)" : "Start guide mode");
    });
    if (!showBadge) {
      hideGuideFeatureSpotlightNudge();
      return;
    }
    if (!wasVisible) {
      showGuideFeatureSpotlightNudge();
    }
  }

  function getGuideFeatureSpotlightTargetButton() {
    if (state.isPlayerVisible && guideButtonPlayer && !playerView.classList.contains("hidden")) {
      return guideButtonPlayer;
    }
    if (guideButtonList && !libraryView.classList.contains("hidden")) {
      return guideButtonList;
    }
    return guideButtonList || guideButtonPlayer || null;
  }

  function ensureGuideFeatureNudgeElement() {
    let el = document.getElementById("guide-feature-nudge");
    if (el) {
      return el;
    }
    el = document.createElement("div");
    el.id = "guide-feature-nudge";
    el.className = "guide-feature-nudge";
    el.textContent = "New guide features added";
    document.body.appendChild(el);
    return el;
  }

  function positionGuideFeatureNudge(targetButton, nudgeEl) {
    if (!targetButton || !nudgeEl) {
      return;
    }
    const rect = targetButton.getBoundingClientRect();
    const top = Math.max(8, rect.top - 2);
    const preferredLeft = rect.right + 10;
    nudgeEl.style.top = String(Math.round(top)) + "px";
    nudgeEl.style.left = String(Math.round(preferredLeft)) + "px";
    const nudgeRect = nudgeEl.getBoundingClientRect();
    if ((nudgeRect.right + 8) > window.innerWidth) {
      const fallbackLeft = Math.max(8, rect.left - nudgeRect.width - 10);
      nudgeEl.style.left = String(Math.round(fallbackLeft)) + "px";
    }
  }

  function showGuideFeatureSpotlightNudge() {
    if (!state.guideFeatureBadgeVisible) {
      return;
    }
    const targetButton = getGuideFeatureSpotlightTargetButton();
    if (!targetButton) {
      return;
    }
    [guideButtonList, guideButtonPlayer].forEach(function (btn) {
      if (btn) {
        btn.classList.remove("new-feature-spotlight");
      }
    });
    targetButton.classList.add("new-feature-spotlight");
    const nudgeEl = ensureGuideFeatureNudgeElement();
    nudgeEl.classList.add("is-visible");
    positionGuideFeatureNudge(targetButton, nudgeEl);
    if (state.guideFeatureSpotlightTimerId) {
      window.clearTimeout(state.guideFeatureSpotlightTimerId);
      state.guideFeatureSpotlightTimerId = null;
    }
    state.guideFeatureSpotlightTimerId = window.setTimeout(function () {
      hideGuideFeatureSpotlightNudge();
    }, 4500);
  }

  function hideGuideFeatureSpotlightNudge() {
    [guideButtonList, guideButtonPlayer].forEach(function (btn) {
      if (btn) {
        btn.classList.remove("new-feature-spotlight");
      }
    });
    const nudgeEl = document.getElementById("guide-feature-nudge");
    if (nudgeEl) {
      nudgeEl.classList.remove("is-visible");
    }
    if (state.guideFeatureSpotlightTimerId) {
      window.clearTimeout(state.guideFeatureSpotlightTimerId);
      state.guideFeatureSpotlightTimerId = null;
    }
  }

  function persistCurrentLoginActivity() {
    if (!state.authUser || !state.authToken) {
      return;
    }
    persistLogin({
      username: state.authUser,
      token: state.authToken,
      loggedInAt: Date.now(),
      ttlMs: state.authIdleLogoutEnabled ? state.authIdleTtlMs : 0,
      lastActivityAt: state.lastActivityAt || Date.now()
    });
  }

  function scheduleAuthKeepAlive() {
    if (state.authKeepAliveTimerId) {
      window.clearInterval(state.authKeepAliveTimerId);
      state.authKeepAliveTimerId = null;
    }
    if (!state.authUser || !state.authToken || state.authIdleLogoutEnabled) {
      return;
    }
    state.authKeepAliveTimerId = window.setInterval(function () {
      if (!state.authUser || !state.authToken || state.authIdleLogoutEnabled) {
        return;
      }
      state.lastActivityAt = Date.now();
      persistCurrentLoginActivity();
      maybePingAuthActivity();
    }, AUTH_PING_MIN_INTERVAL_MS);
  }

  function scheduleInactivityLogout() {
    if (state.authInactivityTimerId) {
      window.clearTimeout(state.authInactivityTimerId);
      state.authInactivityTimerId = null;
    }
    if (!state.authUser || !state.authToken) {
      return;
    }
    if (!state.authIdleLogoutEnabled) {
      return;
    }
    if (!Number.isFinite(state.authIdleTtlMs) || state.authIdleTtlMs <= 0) {
      return;
    }
    const last = Number.isFinite(state.lastActivityAt) && state.lastActivityAt > 0 ? state.lastActivityAt : Date.now();
    const remaining = Math.max(0, state.authIdleTtlMs - (Date.now() - last));
    state.authInactivityTimerId = window.setTimeout(function () {
      clearLoginState("Logged out due to inactivity.");
    }, remaining);
  }

  function scheduleAuthActivityTimers() {
    if (state.authIdleLogoutEnabled) {
      if (state.authKeepAliveTimerId) {
        window.clearInterval(state.authKeepAliveTimerId);
        state.authKeepAliveTimerId = null;
      }
      scheduleInactivityLogout();
      return;
    }
    if (state.authInactivityTimerId) {
      window.clearTimeout(state.authInactivityTimerId);
      state.authInactivityTimerId = null;
    }
    scheduleAuthKeepAlive();
  }

  function maybePingAuthActivity() {
    if (!state.authUser || !state.authToken) {
      return;
    }
    const now = Date.now();
    if ((now - state.lastAuthPingAt) < AUTH_PING_MIN_INTERVAL_MS) {
      return;
    }
    state.lastAuthPingAt = now;
    boundFetch("/api/auth/ping", {
      method: "POST",
      cache: "no-store",
      headers: buildAuthHeaders()
    }).catch(function () {
      // Ignore ping failure; normal auth checks still apply on real requests.
    });
  }

  function handleAuthActivity() {
    if (!state.authUser || !state.authToken) {
      return;
    }
    state.lastActivityAt = Date.now();
    persistCurrentLoginActivity();
    scheduleResumeContextPersist();
    scheduleAuthActivityTimers();
    maybePingAuthActivity();
  }

  function buildAuthHeaders() {
    if (window.audioTestAuthStorage && typeof window.audioTestAuthStorage.buildAuthHeaders === "function") {
      return window.audioTestAuthStorage.buildAuthHeaders({
        data: {
          username: state.authUser,
          token: state.authToken
        },
        deps: {}
      });
    }
    if (!state.authUser || !state.authToken) {
      return {};
    }
    return {
      "x-audio-user": state.authUser,
      "x-audio-auth": state.authToken
    };
  }

  function buildAuthenticatedAudioUrl(audioId) {
    return sessionRuntime.buildAuthenticatedAudioUrl({ data: { state, audioId }, deps: {} });
  }

  function normalizeRevision(value) {
    return sessionRuntime.normalizeRevision({ data: { value, fallback: 0 }, deps: {} });
  }

  async function reloadActiveSessionFromServer(ctx) {
    const data = ctx || {};
    return sessionRuntime.reloadActiveSessionFromServer({
      data: { state, sessionId: data.sessionId || state.activeSessionId || "", statusText: data.statusText },
      deps: {
        fetch: boundFetch,
        buildAuthHeaders,
        clearLoginState,
        showLibraryView,
        loadPersistedAudioCards,
        setSaveStatus,
        applySavedSession,
        normalizeRevision: function (ctx2) {
          return sessionRuntime.normalizeRevision(ctx2);
        }
      }
    });
  }

  function clearLoginState(message) {
    logRuntimeAction("auth:clear-login-state", {
      message: String(message || ""),
      authUser: state.authUser,
      workspacePhase: state.workspacePhase,
      currentFile: state.currentFile ? state.currentFile.name : ""
    });
    persistResumeContextSnapshot();
    if (state.resumeContextPersistTimerId) {
      window.clearTimeout(state.resumeContextPersistTimerId);
      state.resumeContextPersistTimerId = null;
    }
    state.resumeContextRestoreInFlight = false;
    if (audio) {
      try {
        audio.pause();
      } catch {
        // Ignore pause failures.
      }
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // Ignore source reset failures.
      }
    }
    revokeObjectUrl();
    state.authUser = null;
    state.authToken = null;
    state.authIdleTtlMs = LOGIN_TTL_MS;
    state.activeSessionId = null;
    state.activeRevision = 0;
    state.activeAudioId = null;
    state.activeAudioUrl = null;
    state.sessionsCache = [];
    state.openMenuSessionId = null;
    state.lastActivityAt = 0;
    state.lastAuthPingAt = 0;
    state.currentFile = null;
    state.pendingUpload = null;
    state.checkpoints = [];
    state.subSegs = [];
    state.subSegValueEntries = {};
    state.subSegDraftHtmlByKey = {};
    state.subSegCardLiveValueOverrides = {};
    state.subSegCardBubbleTargetIndexByKey = {};
    state.subSegCardFocusTransferStackByKey = {};
    state.subSegCardDeleteDialogKey = null;
    state.audSegNoteEntries = {};
    state.audSegNoteEditorVisible = false;
    state.selectedSpanIndex = -1;
    state.targetSpanIndex = -1;
    state.targetStart = null;
    state.targetEnd = null;
    state.targetSubSegs = [];
    state.selectedTargetSubSegIndex = -1;
    state.activeSubSegValueKey = null;
    state.deleteTargetType = "";
    state.deleteTargetIndex = -1;
    state.deleteConfirmOpen = false;
    state.workspacePhase = "login";
    state.moduleCardIndex = 0;
    state.ingestCardIndex = 0;
    if (state.authInactivityTimerId) {
      window.clearTimeout(state.authInactivityTimerId);
      state.authInactivityTimerId = null;
    }
    if (state.authKeepAliveTimerId) {
      window.clearInterval(state.authKeepAliveTimerId);
      state.authKeepAliveTimerId = null;
    }
    try {
      window.localStorage.removeItem(LOGIN_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
    if (subSegValueInput) {
      subSegValueInput.innerHTML = "";
      subSegValueInput.classList.add("hidden");
    }
    showLoginView();
    renderAudioCards([]);
    renderGuideFeatureBadge();
    setLoginStatus(message || "Log in to continue.", true);
  }

  async function saveSessionState() {
    return sessionRuntime.saveSessionState({
      data: { state, audio },
      deps: {
        fetch,
        buildAuthHeaders,
        clearLoginState,
        reloadActiveSessionFromServer,
        loadPersistedAudioCards,
        ensureAudioUploaded,
        normalizeRevision: function (ctx2) {
          return sessionRuntime.normalizeRevision(ctx2);
        }
      }
    });
  }

  async function applySavedSession(saved, resumeSnapshot) {
    const savedFile = saved.file || {};
    const savedPlayback = saved.playback || {};
    state.activeRevision = normalizeRevision(saved && saved.revision);
    debugLog("applySavedSession:start", {
      id: saved && saved.id,
      revision: state.activeRevision,
      audioId: saved && saved.audioId,
      hasAudioUrl: Boolean(saved && saved.audioUrl),
      hasAudioBase64: Boolean(saved && saved.audioBase64),
      savedCurrentTime: savedPlayback.currentTime,
      savedSelectedSpanIndex: savedPlayback.selectedSpanIndex
    });
    if (saved && typeof saved.audioId === "string" && saved.audioId) {
      setAudioSourceFromRemoteUrl({
        data: {
          url: buildAuthenticatedAudioUrl(saved.audioId),
          displayName: savedFile.name || "Restored audio",
          fileMeta: savedFile
        },
        deps: {}
      });
    } else if (saved && typeof saved.audioUrl === "string" && saved.audioUrl) {
      setAudioSourceFromRemoteUrl({
        data: {
          url: saved.audioUrl,
          displayName: savedFile.name || "Restored audio",
          fileMeta: savedFile
        },
        deps: {}
      });
    } else {
      const audioBlob = await fetchSavedAudioBlob(saved);
      const blobType = savedFile.type || audioBlob.type || "audio/*";

      setAudioSource({ data: { file: audioBlob, displayName: savedFile.name || "Restored audio" }, deps: {} });

      state.currentFile = new File([audioBlob], savedFile.name || "restored-audio", {
        type: blobType,
        lastModified: savedFile.lastModified || Date.now()
      });
    }

    state.checkpoints = Array.isArray(savedPlayback.checkpoints)
      ? savedPlayback.checkpoints.filter(function (v) { return Number.isFinite(v) && v >= 0; }).sort(function (a, b) { return a - b; })
      : [];
    state.subSegs = normalizeSubSegs(savedPlayback.subSegs);
    state.subSegValueEntries = normalizeSubSegValueEntries(savedPlayback.subSegValueEntries);
    state.subSegDraftHtmlByKey = {};
    state.subSegCardFocusTransferStackByKey = {};
    state.audSegNoteEntries = normalizeAudSegNoteEntries(savedPlayback.audSegNoteEntries);
    state.audSegNoteEditorVisible = false;
    state.activeSubSegValueKey = null;

    clearTargetSpanLock({ preserveSelection: false });
    const restoredSelectedSpanIndex = Number.isInteger(savedPlayback.selectedSpanIndex)
      ? savedPlayback.selectedSpanIndex
      : -1;
    const restoredSpanCount = Math.max(0, state.checkpoints.length - 1);
    state.selectedSpanIndex = restoredSelectedSpanIndex >= 0 && restoredSelectedSpanIndex < restoredSpanCount
      ? restoredSelectedSpanIndex
      : -1;
    state.markerSignature = "";
    state.subSegSignature = "";
    state.targetMarkerSignature = "";

    const resumeTime = Number.isFinite(savedPlayback.currentTime) ? savedPlayback.currentTime : 0;
    await waitForAudioReady();
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const safeResume = Math.max(0, Math.min(duration || resumeTime, resumeTime));
    debugLog("applySavedSession:loadedmetadata", { duration, current, safeResume });
    if (duration <= 0 || state.selectedSpanIndex < 0 || state.selectedSpanIndex >= Math.max(0, state.checkpoints.length - 1)) {
      state.selectedSpanIndex = -1;
    }
    if (safeResume > 0.05 && current <= 0.05) {
      audio.currentTime = safeResume;
      debugLog("applySavedSession:resumeApplied", { safeResume });
    }
    updateUi();
    const shouldPlay = resumeSnapshot ? false : Boolean(savedPlayback.wasPlaying);
    if (shouldPlay) {
      audio.play().catch(function () {});
    }
  }

  function applyResumeContextOverlay(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return;
    }

    const nextWorkspacePhase = String(snapshot.workspacePhase || state.workspacePhase || "dashboard");
    state.workspacePhase = nextWorkspacePhase;
    if (Number.isInteger(snapshot.moduleCardIndex)) {
      state.moduleCardIndex = Math.max(0, snapshot.moduleCardIndex);
    }
    if (Number.isInteger(snapshot.ingestCardIndex)) {
      state.ingestCardIndex = Math.max(0, snapshot.ingestCardIndex);
    }

    if (Array.isArray(snapshot.checkpoints)) {
      state.checkpoints = snapshot.checkpoints
        .filter(function (v) { return Number.isFinite(v) && v >= 0; })
        .slice()
        .sort(function (a, b) { return a - b; });
    }
    if (Array.isArray(snapshot.subSegs)) {
      state.subSegs = normalizeSubSegs(snapshot.subSegs);
    }
    if (snapshot.subSegValueEntries && typeof snapshot.subSegValueEntries === "object") {
      state.subSegValueEntries = normalizeSubSegValueEntries(snapshot.subSegValueEntries);
    }
    if (snapshot.subSegDraftHtmlByKey && typeof snapshot.subSegDraftHtmlByKey === "object") {
      state.subSegDraftHtmlByKey = safeClone(snapshot.subSegDraftHtmlByKey);
    }
    if (snapshot.subSegCardLiveValueOverrides && typeof snapshot.subSegCardLiveValueOverrides === "object") {
      state.subSegCardLiveValueOverrides = safeClone(snapshot.subSegCardLiveValueOverrides);
    }
    if (snapshot.subSegCardBubbleTargetIndexByKey && typeof snapshot.subSegCardBubbleTargetIndexByKey === "object") {
      state.subSegCardBubbleTargetIndexByKey = safeClone(snapshot.subSegCardBubbleTargetIndexByKey);
    }
    if (snapshot.subSegCardFocusTransferStackByKey && typeof snapshot.subSegCardFocusTransferStackByKey === "object") {
      state.subSegCardFocusTransferStackByKey = safeClone(snapshot.subSegCardFocusTransferStackByKey);
    }
    state.subSegCardDeleteDialogKey = snapshot.subSegCardDeleteDialogKey ? String(snapshot.subSegCardDeleteDialogKey) : null;
    if (snapshot.audSegNoteEntries && typeof snapshot.audSegNoteEntries === "object") {
      state.audSegNoteEntries = normalizeAudSegNoteEntries(snapshot.audSegNoteEntries);
    }
    state.audSegNoteEditorVisible = Boolean(snapshot.audSegNoteEditorVisible);

    if (Number.isInteger(snapshot.selectedSpanIndex)) {
      state.selectedSpanIndex = snapshot.selectedSpanIndex;
    }
    if (Number.isInteger(snapshot.targetSpanIndex)) {
      state.targetSpanIndex = snapshot.targetSpanIndex;
    }
    state.targetStart = Number.isFinite(snapshot.targetStart) ? snapshot.targetStart : state.targetStart;
    state.targetEnd = Number.isFinite(snapshot.targetEnd) ? snapshot.targetEnd : state.targetEnd;
    if (Array.isArray(snapshot.targetSubSegs)) {
      state.targetSubSegs = safeClone(snapshot.targetSubSegs);
    }
    if (Number.isInteger(snapshot.selectedTargetSubSegIndex)) {
      state.selectedTargetSubSegIndex = snapshot.selectedTargetSubSegIndex;
    }
    state.activeSubSegValueKey = String(snapshot.activeSubSegValueKey || "");
    if (
      state.activeSubSegValueKey &&
      Array.isArray(state.targetSubSegs) &&
      state.targetSubSegs.length > 0 &&
      (!Number.isInteger(state.selectedTargetSubSegIndex) || state.selectedTargetSubSegIndex < 0)
    ) {
      const matchedTargetIndex = state.targetSubSegs.findIndex(function (seg) {
        return getSubSegValueKey(seg) === state.activeSubSegValueKey;
      });
      if (matchedTargetIndex >= 0) {
        state.selectedTargetSubSegIndex = matchedTargetIndex;
      }
    }

    state.deleteTargetType = String(snapshot.deleteTargetType || "");
    state.deleteTargetIndex = Number.isInteger(snapshot.deleteTargetIndex) ? snapshot.deleteTargetIndex : -1;
    state.deleteConfirmOpen = Boolean(snapshot.deleteConfirmOpen);

    state.activeSessionId = String(snapshot.activeSessionId || state.activeSessionId || "");
    state.activeRevision = normalizeRevision(snapshot.activeRevision);
    state.activeAudioId = String(snapshot.activeAudioId || state.activeAudioId || "");
    state.activeAudioUrl = String(snapshot.activeAudioUrl || state.activeAudioUrl || "");

    state.isGuideMode = Boolean(snapshot.isGuideMode);
    state.guideStepIndex = Number.isInteger(snapshot.guideStepIndex) ? snapshot.guideStepIndex : state.guideStepIndex;
    state.guideLanguage = String(snapshot.guideLanguage || state.guideLanguage || "en");
    state.guidePhase = String(snapshot.guidePhase || state.guidePhase || "list-language");

    if (Number.isFinite(snapshot.audioCurrentTime)) {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const safeTime = duration > 0 ? Math.max(0, Math.min(duration, snapshot.audioCurrentTime)) : Math.max(0, snapshot.audioCurrentTime);
      if (Number.isFinite(safeTime)) {
        audio.currentTime = safeTime;
      }
    }

    updateUi();
    restoreResumeContextFocus(snapshot);

    if (snapshot.audioWasPlaying) {
      audio.play().catch(function () {});
    }
  }

  function restoreResumeContextFocus(snapshot) {
    const editor = snapshot && snapshot.focusedSubSegEditor ? snapshot.focusedSubSegEditor : {};
    const key = String(editor.key || state.activeSubSegValueKey || "");
    const pathKey = String(editor.pathKey || "");
    const selectionOffsets = editor && editor.selectionOffsets && Number.isFinite(Number(editor.selectionOffsets.start)) && Number.isFinite(Number(editor.selectionOffsets.end))
      ? {
        start: Math.max(0, Math.floor(Number(editor.selectionOffsets.start))),
        end: Math.max(0, Math.floor(Number(editor.selectionOffsets.end)))
      }
      : null;

    const focusStarter = function () {
      if (!subSegValueInput || subSegValueInput.classList.contains("hidden")) {
        return false;
      }
      try {
        subSegValueInput.focus({ preventScroll: true });
      } catch {
        subSegValueInput.focus();
      }
      if (selectionOffsets) {
        restoreContentEditableSelection(subSegValueInput, selectionOffsets);
      } else if (typeof subSegValueInput.select === "function") {
        subSegValueInput.select();
      }
      return true;
    };

    const focusCard = function () {
      if (!key || !pathKey) {
        return false;
      }
      const selector = ".subseg-value-card-input[data-sub-seg-value-key=\"" + cssEscapeAttr(key) + "\"][data-sub-seg-value-path=\"" + cssEscapeAttr(pathKey) + "\"]";
      const input = subSegValueList ? subSegValueList.querySelector(selector) : null;
      if (!input) {
        return false;
      }
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
      if (selectionOffsets) {
        restoreContentEditableSelection(input, selectionOffsets);
      }
      return true;
    };

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (editor.kind === "starter" || (!editor.kind && state.activeSubSegValueKey && !pathKey)) {
          if (focusStarter()) {
            return;
          }
        }
        if (focusCard()) {
          return;
        }
        if (editor.kind === "starter") {
          focusStarter();
        }
      });
    });
  }

  function restoreContentEditableSelection(root, offsets) {
    if (!root || !offsets || !Number.isFinite(offsets.start) || !Number.isFinite(offsets.end)) {
      return false;
    }
    const start = Math.max(0, Math.floor(offsets.start));
    const end = Math.max(start, Math.floor(offsets.end));
    const selection = window.getSelection ? window.getSelection() : null;
    const range = document.createRange ? document.createRange() : null;
    if (!selection || !range) {
      return false;
    }

    function locateOffset(targetOffset) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      let remaining = targetOffset;
      let node = walker.nextNode();
      while (node) {
        const textLength = String(node.nodeValue || "").length;
        if (remaining <= textLength) {
          return { node, offset: remaining };
        }
        remaining -= textLength;
        node = walker.nextNode();
      }
      return null;
    }

    const startPos = locateOffset(start);
    const endPos = locateOffset(end);
    if (!startPos || !endPos) {
      return false;
    }

    try {
      range.setStart(startPos.node, Math.min(startPos.offset, String(startPos.node.nodeValue || "").length));
      range.setEnd(endPos.node, Math.min(endPos.offset, String(endPos.node.nodeValue || "").length));
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch {
      return false;
    }
  }

  function getResumeStorageApi() {
    if (window.audioTestAuthStorage && typeof window.audioTestAuthStorage.persistResumeContext === "function") {
      return window.audioTestAuthStorage;
    }
    return null;
  }

  function buildResumeContextStorageKey(username) {
    const user = String(username || "").trim().toLowerCase();
    if (!user) {
      return "";
    }
    const api = getResumeStorageApi();
    if (api && typeof api.buildResumeContextStorageKey === "function") {
      return api.buildResumeContextStorageKey({ data: { username: user }, deps: {} });
    }
    return "audioTest.resumeContext:" + user;
  }

  function safeClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function captureFocusedSubSegEditorSnapshot() {
    const active = document.activeElement;
    if (!active) {
      return null;
    }

    const selection = window.getSelection ? window.getSelection() : null;
    const selectionRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const selectionOffsets = active === subSegValueInput && selectionRange
      ? getContentEditableSelectionOffsets(subSegValueInput, selectionRange)
      : active && active.classList && active.classList.contains("subseg-value-card-input") && selectionRange && active.contains(selectionRange.startContainer) && active.contains(selectionRange.endContainer)
        ? getContentEditableSelectionOffsets(active, selectionRange)
        : null;

    if (active === subSegValueInput) {
      return {
        kind: "starter",
        key: String(state.activeSubSegValueKey || ""),
        pathKey: "",
        selectionOffsets
      };
    }

    if (active.classList && active.classList.contains("subseg-value-card-input")) {
      return {
        kind: "card",
        key: String(active.dataset && active.dataset.subSegValueKey ? active.dataset.subSegValueKey : ""),
        pathKey: String(active.dataset && active.dataset.subSegValuePath ? active.dataset.subSegValuePath : ""),
        selectionOffsets
      };
    }

    return null;
  }

  function captureResumeContextSnapshot() {
    const username = String(state.authUser || "").trim().toLowerCase();
    if (!username || !state.authToken) {
      return null;
    }

    return {
      version: 1,
      username,
      capturedAt: new Date().toISOString(),
      workspacePhase: String(state.workspacePhase || "dashboard"),
      moduleCardIndex: Number.isFinite(state.moduleCardIndex) ? state.moduleCardIndex : 0,
      ingestCardIndex: Number.isFinite(state.ingestCardIndex) ? state.ingestCardIndex : 0,
      activeSessionId: String(state.activeSessionId || ""),
      activeRevision: Number.isFinite(state.activeRevision) ? state.activeRevision : 0,
      activeAudioId: String(state.activeAudioId || ""),
      activeAudioUrl: String(state.activeAudioUrl || ""),
      checkpoints: safeClone(state.checkpoints || []),
      subSegs: safeClone(state.subSegs || []),
      subSegValueEntries: safeClone(state.subSegValueEntries || {}),
      subSegDraftHtmlByKey: safeClone(state.subSegDraftHtmlByKey || {}),
      subSegCardLiveValueOverrides: safeClone(state.subSegCardLiveValueOverrides || {}),
      subSegCardBubbleTargetIndexByKey: safeClone(state.subSegCardBubbleTargetIndexByKey || {}),
      subSegCardFocusTransferStackByKey: safeClone(state.subSegCardFocusTransferStackByKey || {}),
      subSegCardDeleteDialogKey: state.subSegCardDeleteDialogKey || null,
      audSegNoteEntries: safeClone(state.audSegNoteEntries || {}),
      audSegNoteEditorVisible: Boolean(state.audSegNoteEditorVisible),
      selectedSpanIndex: Number.isInteger(state.selectedSpanIndex) ? state.selectedSpanIndex : -1,
      targetSpanIndex: Number.isInteger(state.targetSpanIndex) ? state.targetSpanIndex : -1,
      targetStart: Number.isFinite(state.targetStart) ? state.targetStart : null,
      targetEnd: Number.isFinite(state.targetEnd) ? state.targetEnd : null,
      targetSubSegs: safeClone(state.targetSubSegs || []),
      selectedTargetSubSegIndex: Number.isInteger(state.selectedTargetSubSegIndex) ? state.selectedTargetSubSegIndex : -1,
      activeSubSegValueKey: String(state.activeSubSegValueKey || ""),
      deleteTargetType: String(state.deleteTargetType || ""),
      deleteTargetIndex: Number.isInteger(state.deleteTargetIndex) ? state.deleteTargetIndex : -1,
      deleteConfirmOpen: Boolean(state.deleteConfirmOpen),
      audioCurrentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      audioWasPlaying: !audio.paused,
      focusedSubSegEditor: captureFocusedSubSegEditorSnapshot(),
      isGuideMode: Boolean(state.isGuideMode),
      guideStepIndex: Number.isInteger(state.guideStepIndex) ? state.guideStepIndex : -1,
      guideLanguage: String(state.guideLanguage || "en"),
      guidePhase: String(state.guidePhase || "list-language")
    };
  }

  function persistResumeContextSnapshot() {
    const snapshot = captureResumeContextSnapshot();
    if (!snapshot) {
      return;
    }

    const api = getResumeStorageApi();
    if (api) {
      api.persistResumeContext({
        data: {
          username: snapshot.username,
          snapshot,
          capturedAt: snapshot.capturedAt
        },
        deps: {}
      });
      return;
    }

    try {
      const storageKey = buildResumeContextStorageKey(snapshot.username);
      if (!storageKey) {
        return;
      }
      const payload = {
        version: snapshot.version,
        username: snapshot.username,
        capturedAt: snapshot.capturedAt,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
        snapshot
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures.
    }
  }

  function scheduleResumeContextPersist() {
    if (state.resumeContextRestoreInFlight || !state.authUser || !state.authToken) {
      return;
    }
    if (state.resumeContextPersistTimerId) {
      window.clearTimeout(state.resumeContextPersistTimerId);
      state.resumeContextPersistTimerId = null;
    }
    state.resumeContextPersistTimerId = window.setTimeout(function () {
      state.resumeContextPersistTimerId = null;
      persistResumeContextSnapshot();
    }, RESUME_CONTEXT_PERSIST_DELAY_MS);
  }

  function clearResumeContextSnapshot(username) {
    const user = String(username || state.authUser || "").trim().toLowerCase();
    if (!user) {
      return;
    }
    const api = getResumeStorageApi();
    if (api && typeof api.clearResumeContext === "function") {
      api.clearResumeContext({ data: { username: user }, deps: {} });
      return;
    }
    const storageKey = buildResumeContextStorageKey(user);
    if (!storageKey) {
      return;
    }
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures.
    }
  }

  function restoreResumeContextSnapshot(username) {
    const user = String(username || "").trim().toLowerCase();
    if (!user) {
      return null;
    }

    const api = getResumeStorageApi();
    if (api && typeof api.restoreResumeContext === "function") {
      const payload = api.restoreResumeContext({
        data: { username: user },
        deps: {}
      });
      return payload && payload.snapshot ? payload.snapshot : null;
    }

    try {
      const storageKey = buildResumeContextStorageKey(user);
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        String(parsed.username || "").trim().toLowerCase() !== user ||
        !parsed.snapshot ||
        typeof parsed.snapshot !== "object"
      ) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      const expiresAt = Date.parse(String(parsed.expiresAt || ""));
      if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      return parsed.snapshot;
    } catch {
      return null;
    }
  }

  function applyResumeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }

    if (snapshot.workspacePhase === "dashboard") {
      showLibraryView();
      state.moduleCardIndex = Number.isInteger(snapshot.moduleCardIndex) ? snapshot.moduleCardIndex : state.moduleCardIndex;
      renderAudioCards(state.sessionsCache);
      return true;
    }

    if (snapshot.workspacePhase === "ingest") {
      showIngestView();
      state.moduleCardIndex = Number.isInteger(snapshot.moduleCardIndex) ? snapshot.moduleCardIndex : state.moduleCardIndex;
      state.ingestCardIndex = Number.isInteger(snapshot.ingestCardIndex) ? snapshot.ingestCardIndex : state.ingestCardIndex;
      renderAudioCards(state.sessionsCache);
      return true;
    }

    if (snapshot.activeSessionId) {
      return openPersistedSession(snapshot.activeSessionId, {
        resumeSnapshot: snapshot
      });
    }

    return false;
  }

  async function restoreResumeContextAfterLogin(username) {
    const user = String(username || "").trim().toLowerCase();
    if (!user) {
      return false;
    }

    const snapshot = restoreResumeContextSnapshot(user);
    if (!snapshot) {
      return false;
    }

    state.resumeContextRestoreInFlight = true;
    try {
      const restored = await applyResumeSnapshot(snapshot);
      if (restored) {
        setLoginStatus("Resumed your last editing state.");
      }
      return restored;
    } catch (error) {
      setLoginStatus("Resume failed: " + normalizeErrorMessage(error), true);
      return false;
    } finally {
      state.resumeContextRestoreInFlight = false;
    }
  }

  function setAudioSource(ctx) {
    const { data } = ctx;
    const { file, displayName } = data;

    revokeObjectUrl();

    state.currentFile = file instanceof File
      ? file
      : new File([file], String(displayName || "audio.bin"), { type: file.type || "application/octet-stream", lastModified: Date.now() });

    state.objectUrl = URL.createObjectURL(state.currentFile);
    audio.src = state.objectUrl;
    fileName.textContent = displayName || state.currentFile.name || "";
    state.hasAutoFocusedProgress = false;
    clearTargetSpanLock({ preserveSelection: false });
    state.markerSignature = "";
    state.subSegSignature = "";
    state.targetMarkerSignature = "";
  }

  function setAudioSourceFromRemoteUrl(ctx) {
    const { data } = ctx;
    const { url, displayName, fileMeta } = data;
    revokeObjectUrl();
    state.currentFile = {
      name: (fileMeta && fileMeta.name) || displayName || "audio",
      type: (fileMeta && fileMeta.type) || "audio/*",
      size: (fileMeta && fileMeta.size) || 0,
      lastModified: (fileMeta && fileMeta.lastModified) || Date.now()
    };
    audio.src = String(url || "");
    debugLog("setAudioSourceFromRemoteUrl", { url: audio.src, file: state.currentFile });
    fileName.textContent = displayName || state.currentFile.name || "";
    state.hasAutoFocusedProgress = false;
    clearTargetSpanLock({ preserveSelection: false });
    state.markerSignature = "";
    state.subSegSignature = "";
    state.targetMarkerSignature = "";
  }

  function focusProgressControl() {
    requestAnimationFrame(function () {
      try {
        progress.focus({ preventScroll: true });
      } catch {
        try {
          progress.focus();
        } catch {
          // Ignore focus failures.
        }
      }
    });
  }

  function waitForAudioReady() {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      let settled = false;
      function done() {
        if (settled) {
          return;
        }
        settled = true;
        audio.removeEventListener("loadedmetadata", done);
        audio.removeEventListener("canplay", done);
        resolve();
      }
      audio.addEventListener("loadedmetadata", done, { once: true });
      audio.addEventListener("canplay", done, { once: true });
      window.setTimeout(done, 3000);
    });
  }

  function revokeObjectUrl() {
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = null;
    }
  }

  async function ensureAudioUploaded() {
    return sessionRuntime.ensureAudioUploaded({
      data: { state },
      deps: {
        setSaveStatus,
        renderAudioCards,
        uploadAudioWithProgress,
        buildAuthenticatedAudioUrl: function (ctx2) {
          return sessionRuntime.buildAuthenticatedAudioUrl(ctx2);
        }
      }
    });
  }

  function uploadAudioWithProgress(ctx) {
    return sessionRuntime.uploadAudioWithProgress({
      data: {
        state,
        file: ctx && ctx.data ? ctx.data.file : null,
        queryString: ctx && ctx.data ? ctx.data.queryString : ""
      },
      deps: {
        buildAuthHeaders,
        renderAudioCards
      }
    });
  }

  async function fetchSavedAudioBlob(saved) {
    return sessionRuntime.fetchSavedAudioBlob({
      data: { saved, state },
      deps: {
        fetch: boundFetch,
        buildAuthHeaders,
        base64ToBlob: function (ctx2) {
          return sessionRuntime.base64ToBlob(ctx2);
        }
      }
    });
  }

  function base64ToBlob(ctx) {
    return sessionRuntime.base64ToBlob(ctx);
  }

  window.addEventListener("beforeunload", function () {
    persistResumeContextSnapshot();
    revokeObjectUrl();
  });
})();


