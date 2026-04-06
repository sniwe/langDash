(function (global) {
  const nativeConsole = {
    log: global.console.log.bind(global.console),
    info: global.console.info.bind(global.console),
    warn: global.console.warn.bind(global.console),
    error: global.console.error.bind(global.console)
  };
  const nativeFetch = global.fetch ? global.fetch.bind(global) : null;
  const nativeAddEventListener = global.addEventListener.bind(global);
  const nativeStorageSetItem = global.Storage && global.Storage.prototype && global.Storage.prototype.setItem;
  const nativeStorageRemoveItem = global.Storage && global.Storage.prototype && global.Storage.prototype.removeItem;
  const nativeStorageClear = global.Storage && global.Storage.prototype && global.Storage.prototype.clear;
  const nativeXhrOpen = global.XMLHttpRequest && global.XMLHttpRequest.prototype.open;
  const nativeXhrSend = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send;
  const nativeXhrSetRequestHeader = global.XMLHttpRequest && global.XMLHttpRequest.prototype.setRequestHeader;
  const listenerTypes = [
    "click",
    "submit",
    "change",
    "input",
    "beforeinput",
    "keydown",
    "keyup",
    "mousedown",
    "mouseup",
    "focus",
    "blur",
    "play",
    "pause",
    "seeking",
    "seeked"
  ];
  const stateProxyCache = new WeakMap();
  const stateProxyPaths = new WeakMap();
  const runtimeState = {
    installed: false,
    runtimeId: "",
    bootId: "",
    target: null,
    targetReadyPromise: null,
    pendingEntries: [],
    flushPromise: Promise.resolve(),
    suppressed: 0,
    enabled: true,
    originalConsole: nativeConsole,
    originalsRestored: false,
    wrappedRuntimeMethods: false
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function safeString(value, maxLength) {
    const text = String(value == null ? "" : value);
    const limit = Number.isInteger(maxLength) ? maxLength : 240;
    return text.length > limit ? text.slice(0, limit) + "..." : text;
  }

  function isReloadNavigation() {
    try {
      if (global.performance && typeof global.performance.getEntriesByType === "function") {
        const entries = global.performance.getEntriesByType("navigation");
        if (entries && entries.length) {
          const entry = entries[0];
          if (entry && entry.type === "reload") {
            return true;
          }
        }
      }
      if (global.performance && global.performance.navigation && global.performance.navigation.type === 1) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  function formatDateKey(date) {
    const current = date instanceof Date ? date : new Date();
    const year = String(current.getFullYear() % 100).padStart(2, "0");
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    return year + month + day;
  }

  function summarizeValue(value, depth) {
    const maxDepth = Number.isInteger(depth) ? depth : 2;
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === "string") {
      return safeString(value, 240);
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "function") {
      return "[Function " + (value.name || "anonymous") + "]";
    }
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value instanceof RegExp) {
      return String(value);
    }
    if (global.Element && value instanceof global.Element) {
      return summarizeElement(value);
    }
    if (global.Blob && value instanceof global.Blob) {
      return {
        type: value.type || "",
        size: value.size || 0,
        kind: "Blob"
      };
    }
    if (global.File && value instanceof global.File) {
      return {
        name: value.name,
        type: value.type || "",
        size: value.size || 0,
        lastModified: value.lastModified || 0,
        kind: "File"
      };
    }
    if (Array.isArray(value)) {
      if (maxDepth <= 0) {
        return "[Array(" + String(value.length) + ")]";
      }
      return value.slice(0, 12).map(function (item) {
        return summarizeValue(item, maxDepth - 1);
      });
    }
    if (typeof value === "object") {
      if (maxDepth <= 0) {
        return "[Object]";
      }
      const keys = Object.keys(value).slice(0, 24);
      const summary = {};
      keys.forEach(function (key) {
        try {
          summary[key] = summarizeValue(value[key], maxDepth - 1);
        } catch {
          summary[key] = "[Unserializable]";
        }
      });
      return summary;
    }
    return String(value);
  }

  function summarizeElement(element) {
    if (!element) {
      return null;
    }
    const summary = {
      tag: element.tagName || "",
      id: element.id || "",
      className: typeof element.className === "string" ? element.className : "",
      text: safeString(element.textContent || "", 120)
    };
    if (element.name) {
      summary.name = element.name;
    }
    if (element.type) {
      summary.type = element.type;
    }
    return summary;
  }

  function summarizeEvent(event) {
    if (!event) {
      return {};
    }
    const target = event.target || event.currentTarget || null;
    const detail = {
      type: event.type || "",
      target: summarizeElement(target),
      bubbles: Boolean(event.bubbles),
      cancelable: Boolean(event.cancelable)
    };
    if ("key" in event) {
      detail.key = event.key;
    }
    if ("code" in event) {
      detail.code = event.code;
    }
    if ("button" in event) {
      detail.button = event.button;
    }
    if (target && typeof target.value === "string") {
      detail.valueLength = target.value.length;
      if (target.type === "password") {
        detail.valueRedacted = true;
      } else if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        detail.valuePreview = safeString(target.value, 80);
        detail.value = safeString(target.value, 240);
      }
    }
    if (target && (target.isContentEditable || target.contentEditable === "true" || target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      const html = typeof target.innerHTML === "string" ? target.innerHTML : "";
      const text = typeof target.textContent === "string" ? target.textContent : "";
      detail.content = {
        htmlLength: html.length,
        textLength: text.trim().length,
        htmlPreview: safeString(html, 240),
        textPreview: safeString(text.trim(), 240)
      };
    }
    if (event.inputType) {
      detail.inputType = String(event.inputType);
    }
    if (event.data != null && typeof event.data !== "undefined") {
      detail.data = safeString(event.data, 80);
    }
    if (event.dataTransfer && typeof event.dataTransfer.getData === "function") {
      try {
        detail.dataTransferText = safeString(event.dataTransfer.getData("text/plain"), 240);
      } catch {
        detail.dataTransferText = "[unavailable]";
      }
    }
    if (event.target && (event.target.isContentEditable || event.target.contentEditable === "true")) {
      const selection = global.getSelection ? global.getSelection() : null;
      if (selection && selection.rangeCount > 0) {
        detail.selection = {
          text: safeString(selection.toString(), 240),
          rangeCount: selection.rangeCount,
          isCollapsed: Boolean(selection.isCollapsed)
        };
      }
    }
    return detail;
  }

  function summarizeDetail(detail) {
    return summarizeValue(detail, 3);
  }

  function createLogEntry(ctx) {
    const { data = {} } = ctx || {};
    return {
      ts: nowIso(),
      runtimeId: runtimeState.runtimeId || "",
      source: String(data.source || "frontend"),
      level: String(data.level || "info"),
      kind: String(data.kind || "log"),
      label: String(data.label || ""),
      detail: summarizeDetail(data.detail)
    };
  }

  function emitConsole(level, args) {
    if (!runtimeState.enabled) {
      return;
    }
    const method = level in nativeConsole ? level : "log";
    nativeConsole[method].apply(global.console, args);
    if (runtimeState.suppressed > 0) {
      return;
    }
    enqueueEntry(createLogEntry({
      data: {
        source: "frontend-console",
        level: method,
        kind: "console",
        label: args.length ? String(args[0]) : "",
        detail: { args: Array.prototype.slice.call(args, 0, 24) }
      }
    }));
  }

  function enqueueEntry(entry) {
    if (!entry || runtimeState.originalsRestored || !runtimeState.enabled) {
      return;
    }
    const todayKey = formatDateKey(new Date());
    if (runtimeState.target && runtimeState.target.dateKey && runtimeState.target.dateKey !== todayKey) {
      runtimeState.target = null;
      runtimeState.targetReadyPromise = null;
    }
    if (!runtimeState.target) {
      runtimeState.pendingEntries.push(entry);
      void ensureRuntimeTarget().then(function () {
        return scheduleFlush();
      });
      return;
    }
    runtimeState.pendingEntries.push(entry);
    scheduleFlush();
  }

  function scheduleFlush() {
    if (!runtimeState.target || !runtimeState.enabled) {
      if (!runtimeState.enabled && runtimeState.pendingEntries.length) {
        runtimeState.pendingEntries.length = 0;
      }
      return Promise.resolve();
    }

    const batch = runtimeState.pendingEntries.splice(0, runtimeState.pendingEntries.length);
    if (!batch.length) {
      return Promise.resolve();
    }

    const payload = {
      runtimeId: runtimeState.runtimeId,
      entries: batch
    };

    runtimeState.flushPromise = (async function () {
      if (!nativeFetch) {
        return;
      }
      try {
        runtimeState.suppressed += 1;
        await nativeFetch("/api/runtime-log/entry-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          keepalive: true
        });
      } catch (error) {
        runtimeState.pendingEntries.unshift.apply(runtimeState.pendingEntries, batch);
        nativeConsole.warn("[audioTest] runtime log flush failed", error && error.message ? error.message : error);
      } finally {
        runtimeState.suppressed = Math.max(0, runtimeState.suppressed - 1);
      }
    })();

    return runtimeState.flushPromise.then(function () {
      if (runtimeState.pendingEntries.length) {
        return scheduleFlush();
      }
      return null;
    });
  }

  function wrapConsole() {
    if (runtimeState.originalsRestored) {
      return;
    }
    ["log", "info", "warn", "error"].forEach(function (method) {
      global.console[method] = function () {
        emitConsole(method, Array.prototype.slice.call(arguments));
      };
    });
  }

  function unwrapConsole() {
    if (runtimeState.originalsRestored) {
      return;
    }
    runtimeState.originalsRestored = true;
    global.console.log = nativeConsole.log;
    global.console.info = nativeConsole.info;
    global.console.warn = nativeConsole.warn;
    global.console.error = nativeConsole.error;
  }

  async function ensureRuntimeTarget() {
    if (!runtimeState.enabled) {
      return runtimeState.target;
    }
    const todayKey = formatDateKey(new Date());
    if (runtimeState.target && runtimeState.target.dateKey && runtimeState.target.dateKey !== todayKey) {
      runtimeState.target = null;
    }
    if (runtimeState.target) {
      return runtimeState.target;
    }
    if (runtimeState.targetReadyPromise) {
      return runtimeState.targetReadyPromise;
    }

    runtimeState.targetReadyPromise = (async function () {
      if (!nativeFetch) {
        return null;
      }
      try {
        runtimeState.suppressed += 1;
        const response = await nativeFetch("/api/runtime-log/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            runtimeKind: "frontend",
            location: global.location ? global.location.href : "",
            userAgent: global.navigator ? global.navigator.userAgent : "",
            runtimeId: runtimeState.runtimeId,
            bootId: runtimeState.bootId,
            forceNewTarget: isReloadNavigation()
          }),
          keepalive: true
        });
        if (!response.ok) {
          throw new Error("runtime_log_start_failed status=" + String(response.status));
        }
        const payload = await response.json();
        runtimeState.runtimeId = String(payload.runtimeId || payload.target && payload.target.runtimeId || "").trim();
        runtimeState.target = payload.target || null;
        if (runtimeState.target && runtimeState.target.dateKey && runtimeState.target.dateKey !== todayKey) {
          runtimeState.target = null;
        }
        if (runtimeState.runtimeId) {
          nativeConsole.info("[audioTest] runtime log target ready", summarizeValue(runtimeState.target, 2));
        }
        if (runtimeState.pendingEntries.length) {
          await scheduleFlush();
        }
        return runtimeState.target;
      } catch (error) {
        nativeConsole.warn("[audioTest] runtime log target unavailable", error && error.message ? error.message : error);
        return null;
      } finally {
        runtimeState.suppressed = Math.max(0, runtimeState.suppressed - 1);
        runtimeState.targetReadyPromise = null;
      }
    })();

    return runtimeState.targetReadyPromise;
  }

  function patchFetch() {
    if (!nativeFetch || global.fetch.__audioTestRuntimePatched) {
      return;
    }

    const wrappedFetch = function () {
      const args = Array.prototype.slice.call(arguments);
      const input = args[0];
      const init = args[1] || {};
      const requestUrl = typeof input === "string" ? input : input && input.url ? input.url : "";
      const method = String(init.method || (input && input.method) || "GET").toUpperCase();
      const startedAt = Date.now();

      const result = nativeFetch.apply(global, args);
      if (!runtimeState.originalsRestored && runtimeState.enabled) {
        result.then(function (response) {
          enqueueEntry(createLogEntry({
            data: {
              source: "frontend-fetch",
              level: "info",
              kind: "network",
              label: method + " " + requestUrl,
              detail: {
                status: response.status,
                ok: response.ok,
                elapsedMs: Date.now() - startedAt
              }
            }
          }));
        }).catch(function (error) {
          enqueueEntry(createLogEntry({
            data: {
              source: "frontend-fetch",
              level: "error",
              kind: "network",
              label: method + " " + requestUrl,
              detail: {
                error: summarizeValue(error, 2),
                elapsedMs: Date.now() - startedAt
              }
            }
          }));
        });
      }

      return result;
    };
    wrappedFetch.__audioTestRuntimePatched = true;
    global.fetch = wrappedFetch;
  }

  function patchXhr() {
    if (!global.XMLHttpRequest || global.XMLHttpRequest.prototype.open.__audioTestRuntimePatched) {
      return;
    }

    global.XMLHttpRequest.prototype.open = function (method, url) {
      this.__audioTestRuntimeInfo = {
        method: String(method || "GET").toUpperCase(),
        url: String(url || ""),
        startedAt: Date.now()
      };
      return nativeXhrOpen.apply(this, arguments);
    };
    global.XMLHttpRequest.prototype.open.__audioTestRuntimePatched = true;

    global.XMLHttpRequest.prototype.send = function (body) {
      const info = this.__audioTestRuntimeInfo || {};
      const xhr = this;
      const onLoadEnd = function () {
        if (!runtimeState.enabled) {
          xhr.removeEventListener("loadend", onLoadEnd);
          return;
        }
        enqueueEntry(createLogEntry({
          data: {
            source: "frontend-xhr",
            level: xhr.status >= 400 ? "error" : "info",
            kind: "network",
            label: (info.method || "GET") + " " + (info.url || ""),
            detail: {
              status: xhr.status,
              elapsedMs: info.startedAt ? Date.now() - info.startedAt : null,
              bodyType: body && body.constructor ? body.constructor.name : typeof body
            }
          }
        }));
        xhr.removeEventListener("loadend", onLoadEnd);
      };
      xhr.addEventListener("loadend", onLoadEnd);
      return nativeXhrSend.apply(this, arguments);
    };
    global.XMLHttpRequest.prototype.send.__audioTestRuntimePatched = true;

    if (nativeXhrSetRequestHeader) {
      global.XMLHttpRequest.prototype.setRequestHeader = function () {
        return nativeXhrSetRequestHeader.apply(this, arguments);
      };
    }
  }

  function patchStorage() {
    if (!global.Storage || !nativeStorageSetItem || nativeStorageSetItem.__audioTestRuntimePatched) {
      return;
    }

    global.Storage.prototype.setItem = function (key, value) {
      const result = nativeStorageSetItem.apply(this, arguments);
      if (!runtimeState.enabled) {
        return result;
      }
      enqueueEntry(createLogEntry({
        data: {
          source: "frontend-storage",
          level: "info",
          kind: "state",
          label: "storage.setItem:" + String(key || ""),
          detail: {
            key: String(key || ""),
            valuePreview: safeString(value, 120)
          }
        }
      }));
      return result;
    };
    global.Storage.prototype.setItem.__audioTestRuntimePatched = true;

    global.Storage.prototype.removeItem = function (key) {
      const result = nativeStorageRemoveItem.apply(this, arguments);
      if (!runtimeState.enabled) {
        return result;
      }
      enqueueEntry(createLogEntry({
        data: {
          source: "frontend-storage",
          level: "info",
          kind: "state",
          label: "storage.removeItem:" + String(key || ""),
          detail: {
            key: String(key || "")
          }
        }
      }));
      return result;
    };
    global.Storage.prototype.removeItem.__audioTestRuntimePatched = true;

    global.Storage.prototype.clear = function () {
      const result = nativeStorageClear.apply(this, arguments);
      if (!runtimeState.enabled) {
        return result;
      }
      enqueueEntry(createLogEntry({
        data: {
          source: "frontend-storage",
          level: "warn",
          kind: "state",
          label: "storage.clear",
          detail: {}
        }
      }));
      return result;
    };
    global.Storage.prototype.clear.__audioTestRuntimePatched = true;
  }

  function patchGlobalEvents() {
    listenerTypes.forEach(function (type) {
      nativeAddEventListener(type, function (event) {
        if (!runtimeState.enabled) {
          return;
        }
        enqueueEntry(createLogEntry({
          data: {
            source: "frontend-event",
            level: "info",
            kind: "action",
            label: type,
            detail: summarizeEvent(event)
          }
        }));
      }, true);
    });

    nativeAddEventListener("error", function (event) {
      if (!runtimeState.enabled) {
        return;
      }
      enqueueEntry(createLogEntry({
        data: {
          source: "frontend-event",
          level: "error",
          kind: "error",
          label: "window.error",
          detail: {
            message: event && event.message ? event.message : "",
            filename: event && event.filename ? event.filename : "",
            lineno: event && event.lineno ? event.lineno : null,
            colno: event && event.colno ? event.colno : null
          }
        }
      }));
    }, true);

    nativeAddEventListener("unhandledrejection", function (event) {
      if (!runtimeState.enabled) {
        return;
      }
      enqueueEntry(createLogEntry({
        data: {
          source: "frontend-event",
          level: "error",
          kind: "error",
          label: "window.unhandledrejection",
          detail: {
            reason: summarizeValue(event && event.reason ? event.reason : null, 2)
          }
        }
      }));
    }, true);
  }

  function createStateProxy(value, ctx) {
    const pathName = String(ctx && ctx.data && ctx.data.path ? ctx.data.path : "state");

    function wrap(currentValue, currentPath) {
      if (!currentValue || typeof currentValue !== "object") {
        return currentValue;
      }
      if (currentValue instanceof Date || currentValue instanceof RegExp || currentValue instanceof Error || currentValue instanceof Promise || (global.Blob && currentValue instanceof global.Blob) || (global.File && currentValue instanceof global.File)) {
        return currentValue;
      }
      if (stateProxyCache.has(currentValue)) {
        return stateProxyCache.get(currentValue);
      }

      const proxy = new Proxy(currentValue, {
        get(target, key, receiver) {
          const nested = Reflect.get(target, key, receiver);
          return wrap(nested, currentPath + "." + String(key));
        },
        set(target, key, nextValue, receiver) {
          const nextWrapped = wrap(nextValue, currentPath + "." + String(key));
          const previous = target[key];
          const result = Reflect.set(target, key, nextWrapped, receiver);
          if (runtimeState.enabled && previous !== nextValue) {
            enqueueEntry(createLogEntry({
              data: {
                source: "frontend-state",
                level: "info",
                kind: "state",
                label: currentPath + "." + String(key),
                detail: {
                  previous: summarizeValue(previous, 2),
                  next: summarizeValue(nextValue, 2)
                }
              }
            }));
          }
          return result;
        },
        deleteProperty(target, key) {
          const previous = target[key];
          const result = Reflect.deleteProperty(target, key);
          if (!runtimeState.enabled) {
            return result;
          }
          enqueueEntry(createLogEntry({
            data: {
              source: "frontend-state",
              level: "warn",
              kind: "state",
              label: currentPath + "." + String(key),
              detail: {
                deleted: true,
                previous: summarizeValue(previous, 2)
              }
            }
          }));
          return result;
        }
      });

      stateProxyCache.set(currentValue, proxy);
      stateProxyPaths.set(proxy, currentPath);
      return proxy;
    }

    return wrap(value, pathName);
  }

  function wrapSessionRuntime(sessionRuntime) {
    if (!sessionRuntime || runtimeState.wrappedRuntimeMethods) {
      return;
    }
    Object.keys(sessionRuntime).forEach(function (key) {
      if (typeof sessionRuntime[key] !== "function") {
        return;
      }
      const original = sessionRuntime[key].bind(sessionRuntime);
      sessionRuntime[key] = function () {
        const args = Array.prototype.slice.call(arguments);
        if (runtimeState.enabled) {
          enqueueEntry(createLogEntry({
            data: {
              source: "frontend-runtime",
              level: "info",
              kind: "action",
              label: key,
              detail: {
                args: args.map(function (arg) {
                  return summarizeValue(arg, 2);
                })
              }
            }
          }));
        }
        const result = original.apply(sessionRuntime, args);
        if (result && typeof result.then === "function") {
          return result.then(function (value) {
            if (runtimeState.enabled) {
              enqueueEntry(createLogEntry({
                data: {
                  source: "frontend-runtime",
                  level: "info",
                  kind: "action",
                  label: key + ":resolved",
                  detail: summarizeValue(value, 2)
                }
              }));
            }
            return value;
          }).catch(function (error) {
            if (runtimeState.enabled) {
              enqueueEntry(createLogEntry({
                data: {
                  source: "frontend-runtime",
                  level: "error",
                  kind: "error",
                  label: key + ":rejected",
                  detail: summarizeValue(error, 2)
                }
              }));
            }
            throw error;
          });
        }
        if (runtimeState.enabled) {
          enqueueEntry(createLogEntry({
            data: {
              source: "frontend-runtime",
              level: "info",
              kind: "action",
              label: key + ":return",
              detail: summarizeValue(result, 2)
            }
          }));
        }
        return result;
      };
    });
    runtimeState.wrappedRuntimeMethods = true;
  }

  async function install(ctx) {
    if (runtimeState.installed) {
      return runtimeState;
    }
    const { data = {} } = ctx || {};
    runtimeState.installed = true;
    runtimeState.enabled = data.enabled !== false;
    runtimeState.bootId = global.crypto && typeof global.crypto.randomUUID === "function"
      ? global.crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(16).slice(2);
    const generatedRuntimeId = global.crypto && typeof global.crypto.randomUUID === "function"
      ? global.crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(16).slice(2);
    runtimeState.runtimeId = String(data.runtimeId || generatedRuntimeId).trim();
    wrapConsole();
    patchFetch();
    patchXhr();
    patchStorage();
    patchGlobalEvents();
    wrapSessionRuntime(data.sessionRuntime || global.audioTestSessionRuntime || {});
    if (runtimeState.enabled) {
      enqueueEntry(createLogEntry({
        data: {
          source: "frontend-runtime",
          level: "info",
          kind: "action",
          label: "runtime:install",
          detail: {
            location: global.location ? global.location.href : "",
            title: global.document ? global.document.title : ""
          }
        }
      }));
      await ensureRuntimeTarget();
    }
    return runtimeState;
  }

  function logAction(label, detail) {
    if (!runtimeState.enabled) {
      return;
    }
    enqueueEntry(createLogEntry({
      data: {
        source: "frontend-runtime",
        level: "info",
        kind: "action",
        label: String(label || ""),
        detail: detail || {}
      }
    }));
  }

  function logStateChange(label, previous, next) {
    if (!runtimeState.enabled) {
      return;
    }
    enqueueEntry(createLogEntry({
      data: {
        source: "frontend-state",
        level: "info",
        kind: "state",
        label: String(label || ""),
        detail: {
          previous,
          next
        }
      }
    }));
  }

  async function setEnabled(ctx) {
    const { data = {} } = ctx || {};
    const nextEnabled = data.enabled !== false;
    if (runtimeState.enabled === nextEnabled) {
      return runtimeState;
    }
    runtimeState.enabled = nextEnabled;
    if (!nextEnabled) {
      runtimeState.pendingEntries.length = 0;
      runtimeState.flushPromise = Promise.resolve();
      return runtimeState;
    }
    await ensureRuntimeTarget();
    if (runtimeState.pendingEntries.length) {
      await scheduleFlush();
    }
    return runtimeState;
  }

  global.audioTestRuntimeLogger = {
    install,
    logAction,
    logStateChange,
    createStateProxy,
    summarizeValue,
    summarizeEvent,
    flush: scheduleFlush,
    enqueueEntry,
    unwrapConsole,
    setEnabled,
    getEnabled: function () {
      return runtimeState.enabled;
    },
    getRuntimeState: function () {
      return runtimeState;
    }
  };
})(window);
