type DiffOp =
  | { op: 'equal'; token: string }
  | { op: 'replace'; from: string; to: string }
  | { op: 'insert'; token: string }
  | { op: 'delete'; token: string };

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string) {
  let normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

export function diffTokens(reference: string[], input: string[]) {
  let n = reference.length;
  let m = input.length;
  let dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i <= n; i += 1) dp[i][0] = i;
  for (let j = 0; j <= m; j += 1) dp[0][j] = j;

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (reference[i - 1] === input[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  let ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && reference[i - 1] === input[j - 1]) {
      ops.push({ op: 'equal', token: reference[i - 1] });
      i -= 1;
      j -= 1;
      continue;
    }
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push({ op: 'replace', from: reference[i - 1], to: input[j - 1] });
      i -= 1;
      j -= 1;
      continue;
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ op: 'delete', token: reference[i - 1] });
      i -= 1;
      continue;
    }
    if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.push({ op: 'insert', token: input[j - 1] });
      j -= 1;
      continue;
    }
    break;
  }

  return ops.reverse();
}

export function buildDiffHtml(ops: DiffOp[]) {
  let parts: string[] = [];
  for (let op of ops) {
    if (op.op === 'equal') {
      parts.push(op.token);
      continue;
    }
    if (op.op === 'replace') {
      parts.push(
        `<span class="err replace" data-user="${escapeHtml(op.to)}">${escapeHtml(op.from)}</span>`
      );
      continue;
    }
    if (op.op === 'delete') {
      parts.push(`<span class="err delete">${escapeHtml(op.token)}</span>`);
      continue;
    }
    parts.push(`<span class="err insert">${escapeHtml(op.token)}</span>`);
  }
  return parts.join(' ');
}

export function extractErrorWords(ops: DiffOp[]) {
  let set = new Set<string>();
  for (let op of ops) {
    if (op.op === 'replace') set.add(op.from);
    if (op.op === 'delete') set.add(op.token);
  }
  return Array.from(set);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
