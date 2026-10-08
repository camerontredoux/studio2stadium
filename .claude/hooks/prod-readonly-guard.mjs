#!/usr/bin/env node
//
// PreToolUse guard for the prod-readonly subagent (.claude/agents/*-prod-readonly.md).
//
// The agent's Bash may run exactly one thing: scripts/ro-psql.sh with SQL in a quoted
// heredoc (or -f <file>), plus psql output flags and an optional redirect into $TMPDIR. The
// SQL must be read-only: every statement starts with SELECT, WITH, VALUES, TABLE, EXPLAIN or
// SHOW, and no write keyword, write function or psql meta-command appears outside string
// literals and comments. Read and Grep may not open .env files, so credentials stay out of
// the transcript.
//
// This is a second fence. The first is the read-only transaction or role that
// scripts/ro-psql.sh sets up; this one stops a write before it reaches production at all.
// Anything the guard cannot parse is denied.
//
// Test it with sample hook input on stdin:
//   echo '{"tool_name":"Bash","tool_input":{"command":"scripts/ro-psql.sh --describe lead"}}' \
//     | node .claude/hooks/prod-readonly-guard.mjs

import { readFileSync } from "node:fs";
import path from "node:path";

const WRAPPERS = new Set([
  "scripts/ro-psql.sh",
  "./scripts/ro-psql.sh",
  '"$CLAUDE_PROJECT_DIR"/scripts/ro-psql.sh',
  '"$CLAUDE_PROJECT_DIR/scripts/ro-psql.sh"',
]);

// psql output flags that pass through the wrapper. Everything else is refused.
const OUTPUT_FLAGS = /^(-[Atxq]+|--csv|--no-align|--tuples-only|--expanded|--quiet)$/;

// A statement may start only with one of these.
const LEADING_WORDS = new Set(["SELECT", "WITH", "VALUES", "TABLE", "EXPLAIN", "SHOW"]);

// Refused anywhere outside literals and comments: data changes (including inside a CTE),
// DDL, privileges, transaction control, COPY, SELECT INTO, locks and maintenance.
const WRITE_WORDS = new Set([
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "UPSERT",
  "TRUNCATE",
  "ALTER",
  "DROP",
  "CREATE",
  "GRANT",
  "REVOKE",
  "COMMIT",
  "ROLLBACK",
  "ABORT",
  "SAVEPOINT",
  "TRANSACTION",
  "COPY",
  "INTO",
  "LOCK",
  "VACUUM",
  "REINDEX",
  "CLUSTER",
  "REFRESH",
  "NOTIFY",
  "LISTEN",
  "UNLISTEN",
  "DISCARD",
  "CHECKPOINT",
  "REASSIGN",
  "IMPORT",
  "CALL",
  "PREPARE",
  "EXECUTE",
  "DEALLOCATE",
]);

// Functions that write, run SQL passed as a string, signal backends or take locks.
const WRITE_FUNCTIONS =
  /^(set_config|nextval|setval|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|pg_promote|pg_switch_wal|pg_create_\w+|pg_drop_replication_slot|pg_replication_\w+|pg_advisory_\w+|pg_try_advisory_\w+|pg_notify|pg_file_\w+|pg_stat_reset\w*|lo_\w+|dblink\w*|query_to_xml\w*)$/i;

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `prod-readonly guard: ${reason}`,
      },
    }),
  );
  process.exit(0);
}

// Replace comments, string literals and quoted identifiers with blanks so that only SQL
// keywords and identifiers remain. Throws on an unterminated literal or comment.
function stripSql(sql) {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const next = sql[i + 1];
    if (c === "-" && next === "-") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end;
      out += " ";
    } else if (c === "/" && next === "*") {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth > 0) {
        if (sql[i] === "/" && sql[i + 1] === "*") {
          depth++;
          i += 2;
        } else if (sql[i] === "*" && sql[i + 1] === "/") {
          depth--;
          i += 2;
        } else i++;
      }
      if (depth > 0) throw new Error("an unterminated /* comment");
      out += " ";
    } else if (c === "'") {
      // E'...' allows backslash escapes; a plain literal only doubles quotes.
      const escapes = /[eE]$/.test(out) && !/[A-Za-z0-9_]$/.test(out.slice(0, -1));
      i++;
      let closed = false;
      while (i < sql.length) {
        if (escapes && sql[i] === "\\") i += 2;
        else if (sql[i] === "'" && sql[i + 1] === "'") i += 2;
        else if (sql[i] === "'") {
          i++;
          closed = true;
          break;
        } else i++;
      }
      if (!closed) throw new Error("an unterminated string literal");
      out += " '' ";
    } else if (c === '"') {
      const end = sql.indexOf('"', i + 1);
      if (end === -1) throw new Error("an unterminated quoted identifier");
      i = end + 1;
      out += " quoted_identifier ";
    } else if (c === "$" && !/[A-Za-z0-9_]$/.test(out)) {
      const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (tag) {
        const end = sql.indexOf(tag[0], i + tag[0].length);
        if (end === -1) throw new Error(`an unterminated ${tag[0]} literal`);
        i = end + tag[0].length;
        out += " '' ";
      } else {
        out += c;
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// Returns a reason the SQL is refused, or null when it is read-only.
function checkSql(sql) {
  let code;
  try {
    code = stripSql(sql);
  } catch (error) {
    return `the SQL has ${error.message}.`;
  }
  if (code.includes("\\")) {
    return "psql meta-commands (backslash commands) are refused. Pass psql output flags on the command line instead.";
  }
  if (code.includes("`")) return "backticks are refused.";
  if (/\bFOR\s+(NO\s+KEY\s+UPDATE|KEY\s+SHARE|SHARE)\b/i.test(code)) {
    return "row locks (FOR SHARE / FOR UPDATE) are refused.";
  }
  for (const statement of code.split(";")) {
    const words = statement.match(/[A-Za-z_][A-Za-z0-9_$]*/g) ?? [];
    if (words.length === 0) continue;
    const leading = words[0].toUpperCase();
    if (!LEADING_WORDS.has(leading)) {
      return `a statement starts with ${leading}. Only SELECT, WITH, VALUES, TABLE, EXPLAIN and SHOW may run.`;
    }
    for (const word of words) {
      if (WRITE_WORDS.has(word.toUpperCase())) {
        return `the SQL contains ${word.toUpperCase()}. Report the change as proposed repair SQL instead of running it.`;
      }
    }
  }
  for (const match of code.matchAll(/([A-Za-z_][A-Za-z0-9_$.]*)\s*\(/g)) {
    const name = match[1].split(".").pop();
    if (WRITE_FUNCTIONS.test(name)) return `the SQL calls ${name}(), which writes or runs SQL.`;
  }
  return null;
}

// Split the first line of a shell command into words, keeping quotes in place. Returns
// null when it holds anything that is not a plain word: command separators, substitution,
// globbing or here-strings.
function shellWords(line) {
  const words = line.trim().split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (/[;&|`(){}*?[\]!]/.test(word) || word.includes("<<<")) return null;
  }
  return words;
}

const TMP_TARGET = /^"?\$TMPDIR\/[A-Za-z0-9_.\-/]+"?$/;

function readSqlFile(file, cwd) {
  const unquoted = file.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  let resolved;
  const tmp = /^\$TMPDIR\/(.+)$/.exec(unquoted);
  if (tmp) {
    if (!process.env.TMPDIR)
      deny("-f $TMPDIR/... needs TMPDIR set for the guard to read the file.");
    resolved = path.join(process.env.TMPDIR, tmp[1]);
  } else if (/^[A-Za-z0-9_.\-/]+\.sql$/.test(unquoted) && !unquoted.startsWith("/")) {
    resolved = path.join(cwd, unquoted);
  } else {
    deny(`-f ${file} is refused. Use a repo-relative .sql path, a $TMPDIR path, or a heredoc.`);
  }
  if (resolved.split(path.sep).includes("..")) deny("-f paths may not contain '..'.");
  try {
    return readFileSync(resolved, "utf8");
  } catch {
    return deny(`cannot read ${file} to check it.`);
  }
}

function checkBash(command, cwd) {
  const newline = command.indexOf("\n");
  const firstLine = newline === -1 ? command : command.slice(0, newline);
  const rest = newline === -1 ? "" : command.slice(newline + 1);
  const words = shellWords(firstLine);
  if (!words || words.length === 0) {
    deny(
      "Bash runs only scripts/ro-psql.sh, as one command. Pipes, chains and substitutions are refused.",
    );
  }
  if (!WRAPPERS.has(words[0])) {
    deny(`Bash runs only scripts/ro-psql.sh, not ${words[0]}. Use Read, Grep and Glob for files.`);
  }

  let heredocTag = null;
  let sqlFile = null;
  let special = null;
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (OUTPUT_FLAGS.test(word)) continue;
    if (word === "--describe") {
      const table = words[++i];
      if (!table || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(table)) {
        deny("--describe takes one table name.");
      }
      special = word;
    } else if (word === "--whoami") {
      special = word;
    } else if (word === "-f" || word === "--file") {
      sqlFile = words[++i];
      if (!sqlFile) deny("-f needs a file.");
    } else if (word === ">" || word === "2>") {
      const target = words[++i];
      if (!target || !TMP_TARGET.test(target) || target.includes("..")) {
        deny('output may be redirected only into "$TMPDIR/<name>".');
      }
    } else if (/^2?>/.test(word)) {
      const target = word.replace(/^2?>/, "");
      if (!TMP_TARGET.test(target) || target.includes("..")) {
        deny('output may be redirected only into "$TMPDIR/<name>".');
      }
    } else if (word === "<<" || word.startsWith("<<")) {
      const raw = word === "<<" ? words[++i] : word.slice(2);
      const quoted = /^'([A-Za-z_]+)'$/.exec(raw ?? "") ?? /^"([A-Za-z_]+)"$/.exec(raw ?? "");
      if (!quoted)
        deny("the heredoc delimiter must be quoted, as <<'SQL', so the shell expands nothing.");
      heredocTag = quoted[1];
    } else {
      deny(
        `${word} is refused. Allowed: SQL in a <<'SQL' heredoc or -f <file>, --describe <table>, --whoami, output flags (-A -t -x -q --csv) and > "$TMPDIR/<name>".`,
      );
    }
  }

  const inputs = [heredocTag, sqlFile, special].filter(Boolean).length;
  if (inputs !== 1) {
    deny("give exactly one of: a <<'SQL' heredoc, -f <file>, --describe <table>, --whoami.");
  }

  let sql = "";
  if (heredocTag) {
    const lines = rest.split("\n");
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    if (lines.length === 0 || lines[lines.length - 1] !== heredocTag) {
      deny(`the command must end at the ${heredocTag} heredoc terminator, with nothing after it.`);
    }
    lines.pop();
    if (lines.includes(heredocTag)) deny("the heredoc terminator appears twice.");
    sql = lines.join("\n");
  } else {
    if (rest.trim() !== "") deny("the command must be a single line unless it carries a heredoc.");
    if (sqlFile) sql = readSqlFile(sqlFile, cwd);
  }

  if (sql) {
    const reason = checkSql(sql);
    if (reason) deny(reason);
  }
}

function checkFileTool(input) {
  for (const key of ["file_path", "path", "glob"]) {
    const value = input?.[key];
    if (typeof value !== "string") continue;
    const base = path.basename(value);
    if (/^\.env(\.|$)/.test(base) && !/\.example$/.test(base)) {
      deny(`${base} holds credentials and stays closed. scripts/ro-psql.sh loads what it needs.`);
    }
  }
}

function main() {
  let event;
  try {
    event = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    deny("the hook input was not JSON.");
  }
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (event.tool_name === "Bash") {
    const command = event.tool_input?.command;
    if (typeof command !== "string") deny("the Bash command was missing.");
    checkBash(command, cwd);
  } else if (event.tool_name === "Read" || event.tool_name === "Grep") {
    checkFileTool(event.tool_input);
  }
  process.exit(0);
}

main();
