const crypto = require("node:crypto");
const path = require("node:path");
const { LOGS_DIR } = require("./config");

function createRuntimeLogStore(ctx) {
  const { deps } = ctx || {};
  const fsp = deps && deps.fsp ? deps.fsp : require("node:fs/promises");
  const state = {
    targets: new Map(),
    writeQueues: new Map(),
    nextOrdinalByDate: new Map()
  };

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatDateKey(date) {
    const year = String(date.getFullYear() % 100).padStart(2, "0");
    return year + pad2(date.getMonth() + 1) + pad2(date.getDate());
  }

  function formatTimestamp(date) {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());
    const seconds = pad2(date.getSeconds());
    const millis = String(date.getMilliseconds()).padStart(3, "0");
    const offsetMinutes = -date.getTimezoneOffset();
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHours = pad2(Math.floor(Math.abs(offsetMinutes) / 60));
    const offsetMins = pad2(Math.abs(offsetMinutes) % 60);
    return year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + "." + millis + offsetSign + offsetHours + ":" + offsetMins;
  }

  function summarizeValue(value, depth) {
    const maxDepth = Number.isInteger(depth) ? depth : 2;
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === "string") {
      return value.length > 240 ? value.slice(0, 240) + "..." : value;
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
      const keys = Object.keys(value).slice(0, 20);
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

  function serializeEntry(entry) {
    const rawTs = entry.ts instanceof Date ? entry.ts : new Date(entry.ts || Date.now());
    const ts = Number.isNaN(rawTs.getTime()) ? new Date() : rawTs;
    const payload = {
      ts: formatTimestamp(ts),
      dateKey: entry.dateKey,
      runtimeId: entry.runtimeId,
      source: entry.source,
      level: entry.level || "info",
      kind: entry.kind || "log",
      label: entry.label || "",
      detail: summarizeValue(entry.detail, 3)
    };
    return JSON.stringify(payload);
  }

  async function ensureDateState(dateKey) {
    if (state.nextOrdinalByDate.has(dateKey)) {
      return state.nextOrdinalByDate.get(dateKey);
    }

    const dateDir = path.join(LOGS_DIR, dateKey);
    await fsp.mkdir(dateDir, { recursive: true });

    let nextOrdinal = 1;
    try {
      const entries = await fsp.readdir(dateDir, { withFileTypes: true });
      let maxOrdinal = 0;
      for (const entry of entries) {
        if (!entry.isFile() || !/^\d+\.txt$/i.test(entry.name)) {
          continue;
        }
        const ordinal = Number(entry.name.replace(/\.txt$/i, ""));
        if (Number.isInteger(ordinal) && ordinal > maxOrdinal) {
          maxOrdinal = ordinal;
        }
      }
      nextOrdinal = maxOrdinal + 1;
    } catch (error) {
      if (!error || error.code !== "ENOENT") {
        throw error;
      }
    }

    state.nextOrdinalByDate.set(dateKey, nextOrdinal);
    return nextOrdinal;
  }

  async function allocateRuntimeTarget(ctx2) {
    const { data = {} } = ctx2 || {};
    const runtimeId = String(data.runtimeId || crypto.randomUUID()).trim();
    const label = String(data.label || "runtime").trim() || "runtime";
    const date = data.date instanceof Date ? data.date : new Date();
    const dateKey = formatDateKey(date);

    if (state.targets.has(runtimeId)) {
      return state.targets.get(runtimeId);
    }

    const nextOrdinal = await ensureDateState(dateKey);
    const dateDir = path.join(LOGS_DIR, dateKey);
    const fileName = String(nextOrdinal) + ".txt";
    const filePath = path.join(dateDir, fileName);
    state.nextOrdinalByDate.set(dateKey, nextOrdinal + 1);

    const target = {
      runtimeId,
      label,
      dateKey,
      ordinal: nextOrdinal,
      fileName,
      filePath,
      createdAt: formatTimestamp(date)
    };

    state.targets.set(runtimeId, target);
    return target;
  }

  function enqueueWrite(filePath, task) {
    const current = state.writeQueues.get(filePath) || Promise.resolve();
    const next = current.then(task, task);
    state.writeQueues.set(filePath, next.catch(function () {}));
    return next;
  }

  async function appendLines(ctx2) {
    const { data = {} } = ctx2 || {};
    const runtimeId = String(data.runtimeId || "").trim();
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const target = state.targets.get(runtimeId);
    if (!target || !entries.length) {
      return target || null;
    }

    return enqueueWrite(target.filePath, async function () {
      const lines = entries.map(function (entry) {
        return serializeEntry({
          ...entry,
          runtimeId: runtimeId,
          dateKey: target.dateKey
        });
      }).join("\n") + "\n";
      await fsp.appendFile(target.filePath, lines, "utf8");
      return target;
    });
  }

  async function appendEntry(ctx2) {
    const { data = {} } = ctx2 || {};
    const runtimeId = String(data.runtimeId || "").trim();
    const target = state.targets.get(runtimeId);
    if (!target) {
      return null;
    }

    return enqueueWrite(target.filePath, async function () {
      const line = serializeEntry({
        ...data.entry,
        runtimeId: runtimeId,
        dateKey: target.dateKey
      }) + "\n";
      await fsp.appendFile(target.filePath, line, "utf8");
      return target;
    });
  }

  function createConsoleTee(ctx2) {
    const { data = {} } = ctx2 || {};
    const target = data.target;
    const consoleRef = data.consoleRef || console;
    const methods = ["log", "info", "warn", "error"];
    const originals = {};

    methods.forEach(function (method) {
      originals[method] = typeof consoleRef[method] === "function" ? consoleRef[method].bind(consoleRef) : console.log.bind(consoleRef);
    });

    function emit(method, args) {
      originals[method].apply(consoleRef, args);
      if (!target) {
        return;
      }
      void appendEntry({
        data: {
          runtimeId: target.runtimeId,
          entry: {
            ts: new Date(),
            source: "server-console",
            level: method,
            kind: "console",
            label: args.length > 0 ? String(args[0]) : "",
            detail: { args: Array.prototype.slice.call(args, 0, 20) }
          }
        },
        deps: {}
      });
    }

    methods.forEach(function (method) {
      consoleRef[method] = function () {
        emit(method, Array.prototype.slice.call(arguments));
      };
    });

    return {
      originals
    };
  }

  return {
    allocateRuntimeTarget,
    appendEntry,
    appendLines,
    createConsoleTee,
    summarizeValue,
    formatDateKey,
    formatTimestamp
  };
}

module.exports = {
  createRuntimeLogStore
};
