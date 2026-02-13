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

type HighlightResult = {
  html: string;
  spellingCount: number;
  missingCount: number;
  extraCount: number;
  extraWords: string[];
};

export function buildReferenceHighlightHtml(
  referenceText: string,
  ops: DiffOp[]
): HighlightResult {
  let tokens: Array<{ type: 'word' | 'sep'; value: string }> = [];
  let regex = /[a-zA-Z0-9']+|[^a-zA-Z0-9']+/g;
  let match = regex.exec(referenceText);
  while (match) {
    let value = match[0];
    let type: 'word' | 'sep' =
      /[a-zA-Z0-9']+/.test(value) ? 'word' : 'sep';
    tokens.push({ type, value });
    match = regex.exec(referenceText);
  }

  let opIndex = 0;
  let spellingCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  let extraWords: string[] = [];
  let parts: string[] = [];

  function pushWordWithOp(word: string, op: DiffOp) {
    if (op.op === 'equal') {
      parts.push(escapeHtml(word));
      return;
    }
    if (op.op === 'replace') {
      spellingCount += 1;
      parts.push(`<span class="err spelling">${escapeHtml(word)}</span>`);
      return;
    }
    if (op.op === 'delete') {
      missingCount += 1;
      parts.push(`<span class="err missing">${escapeHtml(word)}</span>`);
      return;
    }
    parts.push(escapeHtml(word));
  }

  for (let item of tokens) {
    if (item.type === 'sep') {
      parts.push(escapeHtml(item.value));
      continue;
    }

    while (opIndex < ops.length && ops[opIndex].op === 'insert') {
      let insertOp = ops[opIndex] as { op: 'insert'; token: string };
      extraWords.push(insertOp.token);
      extraCount += 1;
      opIndex += 1;
    }

    let op = ops[opIndex];
    if (op && (op.op === 'equal' || op.op === 'replace' || op.op === 'delete')) {
      pushWordWithOp(item.value, op);
      opIndex += 1;
      continue;
    }

    parts.push(escapeHtml(item.value));
  }

  while (opIndex < ops.length && ops[opIndex].op === 'insert') {
    let insertOp = ops[opIndex] as { op: 'insert'; token: string };
    extraWords.push(insertOp.token);
    extraCount += 1;
    opIndex += 1;
  }

  if (extraWords.length > 0) {
    parts.push(
      ` <span class="err extra">+ ${escapeHtml(extraWords.join(' '))}</span>`
    );
  }

  return {
    html: parts.join(''),
    spellingCount,
    missingCount,
    extraCount,
    extraWords,
  };
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
