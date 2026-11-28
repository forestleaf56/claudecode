/* Cirrus Linux — language runners: real compilers via an online sandbox (Wandbox), real Python via Pyodide,
   and an offline "lite" translator for simple programs. Also provides gcc/g++/javac/java/go/rustc/... commands. */
(function () {
  'use strict';
  const { def, C } = OS.shell;
  const R = (OS.runners = {});
  const EXT = { c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', java: 'java', cs: 'csharp', go: 'go', rs: 'rust', php: 'php', rb: 'ruby', lua: 'lua', kt: 'kotlin', kts: 'kotlin', swift: 'swift', pl: 'perl', sql: 'sql', py: 'python', js: 'javascript', mjs: 'javascript', ts: 'typescript', sh: 'shell' };
  const NAMES = { c: 'C', cpp: 'C++', java: 'Java', csharp: 'C#', go: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby', lua: 'Lua', kotlin: 'Kotlin', swift: 'Swift', perl: 'Perl', sql: 'SQL', python: 'Python' };
  R.langOf = (name) => EXT[OS.ext(name)] || null;
  R.needsInput = (src) => /\b(scanf|getchar|fgets|gets|cin\s*>>|getline\s*\(|Scanner\s*\(|BufferedReader|Console\.ReadLine|readLine\s*\(|readln|bufio\.NewReader|fmt\.Scan|read_line|stdin\(\)|io\.read|gets\b|STDIN|fgets\(STDIN|<STDIN>|input\s*\()/.test(src);

  /* ---------- online compilers (wandbox.org) ---------- */
  let listP = null;
  const LANGMATCH = { c: ['C'], cpp: ['C++'], java: ['Java'], csharp: ['C#'], go: ['Go'], rust: ['Rust'], php: ['PHP'], ruby: ['Ruby'], lua: ['Lua'], kotlin: ['Kotlin'], swift: ['Swift'], perl: ['Perl'], sql: ['SQL'], python: ['Python'] };
  async function compilers() {
    if (!listP) listP = (async () => { const c = OS.store.get('wandbox-list'); if (c && Date.now() - c.at < 7 * 864e5) return c.list; const r = await fetch('https://wandbox.org/api/list.json'); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); const list = j.map((x) => ({ name: x.name, language: x.language, version: x.version })); OS.store.set('wandbox-list', { at: Date.now(), list }); return list; })().catch((e) => { listP = null; throw e; });
    return listP;
  }
  R.pickCompiler = async (lang) => {
    const list = await compilers(); const langs = LANGMATCH[lang] || []; const cands = list.filter((x) => langs.includes(x.language));
    if (lang === 'c' || lang === 'cpp') { const g = cands.find((x) => /^gcc-\d/.test(x.name)) || cands.find((x) => /^clang-\d/.test(x.name)); if (g) return g; }
    if (lang === 'python') { const p = cands.find((x) => /^cpython-3/.test(x.name)); if (p) return p; }
    return cands.find((x) => !/head|dev|snapshot/i.test(x.name)) || cands[0] || null;
  };
  R.remote = async (lang, code, stdin = '') => {
    const cc = await R.pickCompiler(lang); if (!cc) throw new Error(`no ${NAMES[lang] || lang} compiler available online`);
    if (lang === 'java') code = code.replace(/\bpublic\s+((?:final\s+|abstract\s+)*class\b)/g, '$1');
    const body = { compiler: cc.name, code, stdin, save: false };
    if (lang === 'cpp') body['compiler-option-raw'] = '-std=c++17'; if (lang === 'c') body['compiler-option-raw'] = '-lm';
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
    try { const r = await fetch('https://wandbox.org/api/compile.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); return { compiler: `${cc.language} (${cc.name})`, status: +(j.status || 0), signal: j.signal, out: j.program_output || '', err: j.program_error || '', cerr: j.compiler_error || '' }; } finally { clearTimeout(to); }
  };

  /* ---------- offline lite translator: simple programs in many languages -> JavaScript ---------- */
  function fmtC(f, args) { let i = 0; return String(f).replace(/%([-+ 0#]*)(\d+)?(?:\.(\d+))?(l{0,2}|h|z)?([dioufFeEgGxXscpv%])/g, (m, fl, w, p, l, t) => { if (t === '%') return '%'; let v = args[i++], s; switch (t) { case 'd': case 'i': case 'u': s = String(Math.trunc(+v)); break; case 'f': case 'F': s = (+v).toFixed(p === undefined ? 6 : +p); break; case 'e': case 'E': s = (+v).toExponential(p === undefined ? 6 : +p); break; case 'g': case 'G': s = String(+(+v).toPrecision(p ? +p : 6)); break; case 'x': s = (+v >>> 0).toString(16); break; case 'X': s = (+v >>> 0).toString(16).toUpperCase(); break; case 'o': s = (+v >>> 0).toString(8); break; case 'c': s = typeof v === 'number' ? String.fromCharCode(v) : String(v)[0]; break; default: s = Array.isArray(v) ? '[' + v.join(' ') + ']' : String(v); } if (w && s.length < +w) s = fl.includes('-') ? s.padEnd(+w) : s.padStart(+w, fl.includes('0') && /[dfx]/i.test(t) ? '0' : ' '); return s; }); }
  function fmtRust(f, args) { let i = 0; return String(f).replace(/\{\{|\}\}|\{([a-zA-Z_]\w*)?(?::([^}]*))?\}/g, (m, name, spec) => { if (m === '{{') return '{'; if (m === '}}') return '}'; let v = name ? args.__named[name] : args[i++]; if (spec) { const pm = /\.(\d+)/.exec(spec); if (pm && typeof v === 'number') v = v.toFixed(+pm[1]); else if (spec.includes('?')) v = Array.isArray(v) ? '[' + v.map((x) => (typeof x === 'string' ? JSON.stringify(x) : x)).join(', ') + ']' : typeof v === 'string' ? JSON.stringify(v) : v; const wm = /^(.?)([<>^])?(\d+)$/.exec(spec.replace(/\.\d+|\?/g, '')); if (wm) { const w = +wm[3]; v = String(v); v = wm[2] === '<' ? v.padEnd(w) : v.padStart(w, wm[1] === '0' ? '0' : ' '); } } return Array.isArray(v) ? '[' + v.join(', ') + ']' : String(v); }); }
  const show = (v) => (Array.isArray(v) ? '[' + v.map(show).join(', ') + ']' : v === true ? 'true' : v === false ? 'false' : v == null ? 'null' : typeof v === 'number' && !Number.isInteger(v) ? String(+v.toFixed(10)) : String(v));
  const stripComments = (s, hash) => { let out = '', i = 0, q = null; while (i < s.length) { const c = s[i], n = s[i + 1]; if (q) { out += c; if (c === '\\') { out += n || ''; i += 2; continue; } if (c === q) q = null; i++; continue; } if (c === '"' || c === "'" || c === '`') { q = c; out += c; i++; continue; } if (c === '/' && n === '/' && !hash) { while (i < s.length && s[i] !== '\n') i++; continue; } if (c === '/' && n === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; } if (hash && c === '#' && !(hash === 'php' && n === '[')) { while (i < s.length && s[i] !== '\n') i++; continue; } if (hash === 'lua' && c === '-' && n === '-') { while (i < s.length && s[i] !== '\n') i++; continue; } out += c; i++; } return out; };
  const interp = (s, re) => s.replace(/"((?:[^"\\\n]|\\.)*)"/g, (m, body) => (re.test(body) ? '`' + body.replace(/`/g, '\\`').replace(re, (mm, a, b) => '${' + (a || b) + '}') + '`' : m));
  const TYPES = 'unsigned|signed|long long|long|short|int|double|float|char|bool|boolean|String|string|std::string|auto|var|size_t|byte|decimal|object|Integer|Double|Long|Boolean|Character|uint|ulong|int64_t|int32_t|uint64_t|uint32_t|const char\\s*\\*|char\\s*\\*';
  function clike(src, lang) {
    let s = stripComments(src);
    s = s.replace(/\bimport\s*\([^)]*\)/g, '').replace(/^\s*#.*$/gm, '').replace(/^\s*(import|package|using)\b[^;\n]*;?\s*$/gm, '').replace(/^\s*using namespace\s+\w+;/gm, '');
    if (lang === 'kotlin' || lang === 'swift') s = interp(s, lang === 'kotlin' ? /\$\{([^}]+)\}|\$([a-zA-Z_]\w*)/g : /\\\(([^)]+)\)()/g);
    if (lang === 'csharp') s = s.replace(/\$"((?:[^"\\\n]|\\.)*)"/g, (m, b) => '`' + b.replace(/`/g, '\\`').replace(/\{([^}:]+)(?::[^}]*)?\}/g, '${$1}') + '`');
    if (lang === 'csharp') s = s.replace(/\$`/g, '`').replace(/\$"/g, '"');
    if (lang === 'go') s = s.replace(/\[\]\s*[\w.]+\s*\{([^}]*)\}/g, '[$1]').replace(/\bmap\[[^\]]+\][\w.]+\s*\{/g, '{').replace(/\bmake\(\[\][\w.]+,\s*([^)]+)\)/g, 'new Array($1).fill(0)').replace(/\bappend\((\w+),\s*([^)]+)\)/g, '[...$1, $2]').replace(/\bstrings\.ToUpper\(/g, '__upper(').replace(/\bstrings\.Repeat\(([^,]+),\s*([^)]+)\)/g, '($1).repeat($2)');
    if (lang === 'rust') s = s.replace(/\bVec::new\(\)|\bVec::with_capacity\([^)]*\)/g, '[]').replace(/\bString::from\(/g, 'String(').replace(/\bString::new\(\)/g, "''").replace(/\s+as\s+(?:f64|f32|i32|i64|u32|u64|usize|isize|u8|char)\b/g, '').replace(/\.iter\(\)\.sum::<\w+>\(\)|\.iter\(\)\.sum\(\)/g, '.reduce((a,b)=>a+b,0)');
    s = s.replace(/std::/g, '').replace(/\bstatic_cast<\w+>/g, '').replace(/\bnamespace\s+[\w.]+\s*\{/g, '{').replace(/\bnamespace\s+[\w.]+;/g, '');
    // printing
    s = s.replace(/System\.out\.println\s*\(/g, '__println(').replace(/System\.out\.print\s*\(/g, '__print(').replace(/System\.out\.printf\s*\(/g, '__printf(').replace(/String\.format\s*\(/g, '__sprintf(');
    s = s.replace(/Console\.WriteLine\s*\(/g, '__println(').replace(/Console\.Write\s*\(/g, '__print(');
    s = s.replace(/fmt\.Println\s*\(/g, '__printlnSp(').replace(/fmt\.Print\s*\(/g, '__print(').replace(/fmt\.Printf\s*\(/g, '__printf(').replace(/fmt\.Sprintf\s*\(/g, '__sprintf(').replace(/fmt\.Sprint\s*\(/g, '__sprint(');
    s = s.replace(/\bprintln!\s*\(/g, '__rprintln(').replace(/\bprint!\s*\(/g, '__rprint(').replace(/\bformat!\s*\(/g, '__rformat(').replace(/\beprintln!\s*\(/g, '__rprintln(').replace(/\bvec!\s*\[/g, '[');
    s = s.replace(/\bprintf\s*\(/g, '__printf(').replace(/\bputs\s*\(/g, '__println(').replace(/\bputchar\s*\(/g, '__putchar(');
    s = s.replace(/\bcout\s*((?:<<[^;]+)+);/g, (m, parts) => '__print(' + parts.split(/<<(?![^"]*"[^"]*$)/).map((x) => x.trim()).filter(Boolean).map((x) => (x === 'endl' ? '"\\n"' : x)).join(', ') + ');');
    if (lang === 'kotlin' || lang === 'swift') s = s.replace(/(^|[^.\w])println\s*\(/g, '$1__println(').replace(/(^|[^.\w])print\s*\(/g, lang === 'swift' ? '$1__println(' : '$1__print(');
    // functions
    if (lang === 'go') s = s.replace(/\bfunc\s+(\w+)\s*\(([^)]*)\)[^{]*\{/g, (m, n, p) => `function ${n}(${p.split(',').map((x) => x.trim().split(/\s+/)[0]).filter(Boolean).join(', ')}) {`);
    else if (lang === 'rust') s = s.replace(/\b(?:pub\s+)?fn\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)[^{]*\{/g, (m, n, p) => `function ${n}(${p.split(',').map((x) => x.split(':')[0].replace(/&|mut\s+/g, '').trim()).filter(Boolean).join(', ')}) {`);
    else if (lang === 'kotlin') s = s.replace(/\bfun\s+(\w+)\s*\(([^)]*)\)[^{=]*\{/g, (m, n, p) => `function ${n}(${p.split(',').map((x) => x.split(':')[0].trim()).filter(Boolean).join(', ')}) {`);
    else if (lang === 'swift') s = s.replace(/\bfunc\s+(\w+)\s*\(([^)]*)\)[^{]*\{/g, (m, n, p) => `function ${n}(${p.split(',').map((x) => { const a = x.split(':')[0].trim().split(/\s+/); return a[a.length - 1]; }).filter(Boolean).join(', ')}) {`);
    else s = s.replace(/^(\s*)((?:public|private|protected|static|final|virtual|override|inline|async|extern|const|unsafe|internal|sealed|abstract)\s+)*(?:[\w:<>,\[\]*&]+\s+)+?(\w+)\s*\(([^)]*)\)\s*(?:const\s*)?(?:throws\s+[\w, ]+)?\s*\{/gm, (m, ind, mods, n, p) => (/^(if|for|while|switch|catch|return|else|new|function)$/.test(n) ? m : `${ind}function ${n}(${p.split(',').map((x) => { const a = x.replace(/[*&]|\[\]|\.\.\./g, ' ').trim().split(/\s+/); return a[a.length - 1]; }).filter((x) => x && x !== 'void').join(', ')}) {`));
    s = s.replace(/\b(?:public\s+|private\s+|internal\s+|static\s+|final\s+|sealed\s+|abstract\s+|data\s+|object\s+)*(?:class|struct|object)\s+\w+[^{;]*\{/g, '{');
    // control flow without parentheses (go, rust, swift)
    if (['go', 'rust', 'swift'].includes(lang)) {
      s = s.replace(/\bfor\s+(\w+)\s*:=\s*([^;{]+);\s*([^;{]+);\s*([^{]+)\{/g, 'for (let $1 = $2; $3; $4) {');
      s = s.replace(/\bfor\s+(\w+)\s*,\s*(\w+)\s*:=\s*range\s+([^{]+)\{/g, 'for (let [$1, $2] of __entries($3)) {').replace(/\bfor\s+(\w+)\s*:=\s*range\s+([^{]+)\{/g, 'for (let $1 of __keys($2)) {').replace(/\bfor\s+_\s*,\s*(\w+)\s*:=\s*range\s+([^{]+)\{/g, 'for (let $1 of $2) {');
      s = s.replace(/\bfor\s+\((\w+)\s*,\s*(\w+)\)\s+in\s+([^{]+?)\.iter\(\)\.enumerate\(\)\s*\{/g, 'for (let [$1, $2] of ($3).entries()) {').replace(/\.iter\(\)|\.into_iter\(\)/g, '');
      s = s.replace(/\bfor\s+(\w+)\s+in\s+\(?([^.{\s]+)\s*(\.\.=|\.\.\.|\.\.<|\.\.)\s*([^{)]+?)\)?\s*\{/g, (m, v, a, op, b) => `for (let ${v} = ${a}; ${v} ${op === '..=' || op === '...' ? '<=' : '<'} ${b}; ${v}++) {`);
      s = s.replace(/\bfor\s+(\w+)\s+in\s+([^{]+?)(?:\.iter\(\))?\s*\{/g, 'for (let $1 of $2) {');
      s = s.replace(/\bfor\s*\{/g, 'while (true) {').replace(/\bloop\s*\{/g, 'while (true) {').replace(/\bfor\s+([^({][^{]*)\{/g, 'while ($1) {');
      s = s.replace(/\b(if|while|else if|switch)\s+(?!\()([^{\n]+?)\s*\{/g, '$1 ($2) {');
    }
    if (lang === 'kotlin') s = s.replace(/\bfor\s*\(\s*(\w+)\s+in\s+([^.)\s]+)\s*(\.\.|until|downTo)\s*([^)\s]+)(?:\s+step\s+(\d+))?\s*\)/g, (m, v, a, op, b, st) => `for (let ${v} = ${a}; ${v} ${op === '..' ? '<=' : op === 'until' ? '<' : '>='} ${b}; ${v} ${op === 'downTo' ? '-' : '+'}= ${st || 1})`).replace(/\bfor\s*\(\s*(\w+)\s+in\s+([^)]+)\)/g, 'for (let $1 of $2)').replace(/\b(?:listOf|mutableListOf|arrayOf|intArrayOf)\s*\(([^)]*)\)/g, '[$1]');
    // for-each (java/c++/c#)
    s = s.replace(/\bfor\s*\(\s*(?:final\s+)?(?:const\s+)?[\w:<>]+[&*\s]+(\w+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)').replace(/\bforeach\s*\(\s*(?:var|[\w<>]+)\s+(\w+)\s+in\s+([^)]+)\)/g, 'for (let $1 of $2)');
    // declarations
    s = s.replace(/\b(?:let\s+mut|let|var|val|const|mut)\s+(\w+)\s*:\s*[\w<>\[\]&?]+\s*=/g, 'let $1 =').replace(/\blet\s+mut\s+/g, 'let ').replace(/\bval\s+/g, 'let ').replace(/(\w+)\s*:=\s*/g, 'let $1 = ').replace(/\bvar\s+(\w+)\s+[\w\[\]]+\s*=/g, 'let $1 =').replace(/\bvar\s+(\w+)\s+([\w\[\]]+)\s*$/gm, 'let $1 = 0');
    s = s.replace(new RegExp(`(^|[;{(\\s])(?:static\\s+|final\\s+|const\\s+|constexpr\\s+|readonly\\s+|private\\s+|public\\s+)*(?:${TYPES})(?:\\s*<[^>]*>)?(?:\\s*\\[\\s*\\])*\\s+(\\w+)\\s*(\\[[^\\]]*\\])?\\s*(=|;|,)`, 'g'), (m, pre, n, arr, end) => `${pre}let ${n}${end === ';' ? (arr ? ' = []' : ' = 0') + ';' : ' ' + end}`);
    s = s.replace(/(^|[;{(\s])(?:const\s+)?[A-Za-z_][\w:]*\s*<[^<>;=()]*(?:<[^<>]*>[^<>;=()]*)?>\s+(\w+)\s*(=|;)/gm, (m, pre, n, e) => `${pre}let ${n}${e === ';' ? ' = [];' : ' ='}`);
    s = s.replace(/(=\s*)\{([^{}]*)\}/g, '$1[$2]').replace(/new\s+[\w<>]+\s*\[\s*\]\s*\{([^}]*)\}/g, '[$1]').replace(/new\s+\w+\s*\[([^\]]+)\]/g, 'new Array($1).fill(0)').replace(/new\s+(?:ArrayList|List|LinkedList|vector)\s*<[^>]*>\s*\(\s*\)/g, '[]').replace(/\b(?:vector|List|ArrayList)<[^>]+>\s+(\w+)\s*;/g, 'let $1 = [];');
    s = s.replace(/\((int|long)\)\s*(\w+(?:\.\w+)*(?:\([^()]*\))?)/g, 'Math.trunc($2)').replace(/\((double|float|char)\)\s*/g, '').replace(/\.length\(\)/g, '.length').replace(/\.size\(\)/g, '.length').replace(/\.push_back\(/g, '.push(').replace(/\.add\(/g, '.push(').replace(/\.len\(\)/g, '.length').replace(/\.Length\b/g, '.length').replace(/\.Count\b/g, '.length').replace(/\.to_string\(\)|\.toString\(\)|\.clone\(\)|\.unwrap\(\)/g, '').replace(/\.charAt\(/g, '.charAt(').replace(/\.ToUpper\(\)/g, '.toUpperCase()').replace(/\.to_uppercase\(\)/g, '.toUpperCase()').replace(/\.ToLower\(\)/g, '.toLowerCase()').replace(/\.to_lowercase\(\)/g, '.toLowerCase()').replace(/\.uppercase\(\)/g, '.toUpperCase()').replace(/\.lowercase\(\)/g, '.toLowerCase()').replace(/\bMath\.(Sqrt|Pow|Abs|Max|Min|Floor|Ceiling|Round)\b/g, (m, f) => 'Math.' + (f === 'Ceiling' ? 'ceil' : f.toLowerCase())).replace(/\blen\(/g, '__len(').replace(/\b(sqrt|pow|abs|floor|ceil|fabs)\(/g, (m, f) => `Math.${f === 'fabs' ? 'abs' : f}(`).replace(/\bendl\b/g, '"\\n"').replace(/\bnil\b|\bnullptr\b|\bNULL\b/g, 'null').replace(/&(\w)/g, '$1').replace(/\bstring\(/g, 'String(');
    if (lang === 'rust') s = s.replace(/\blet\b/g, 'var');
    s = guardLoops(s);
    return s + `\n;if (typeof main === 'function') main([]); else if (typeof Main === 'function') Main([]);`;
  }
  const guardLoops = (s) => s.replace(/\b(while|for)(\s*\((?:[^()]|\([^()]*\))*\)\s*)\{/g, '$1$2{ if (++__g > 3e7) throw new Error("execution limit reached (infinite loop?)");');
  function blocky(src, lang) { // ruby / lua / php-ish 'end' languages -> braces
    let s = lang === 'php' ? stripComments(src.replace(/<\?php|\?>/g, ''), 'php') : stripComments(src, lang === 'lua' ? 'lua' : '#');
    if (lang === 'lua') s = src.replace(/--\[\[[\s\S]*?\]\]/g, '').replace(/--.*$/gm, '');
    const out = [], stack = []; const open = (x) => { out.push(x); if (!/^\}/.test(x)) stack.push('blk'); };
    for (let line of s.split('\n')) {
      let l = line.trim(); if (!l) continue;
      if (lang === 'php') { l = l.replace(/"([^"]*)"/g, (m, b) => (b.includes('$') ? '`' + b.replace(/\{\$(\w+(?:\[[^\]]+\])?)\}|\$(\w+)/g, (mm, a, c) => '${' + (a || c) + '}') + '`' : m)).replace(/\$(\w+)/g, '$1').replace(/->/g, '.').replace(/\[(\s*['"][\w ]+['"]\s*=>[^\]]*)\]/g, (mm, b) => '{' + b.replace(/=>/g, ':') + '}').replace(/\s\.\s|\s\.(?=["'$\w])|(?<=["'\w)])\.\s/g, ' + ').replace(/\.=/g, '+=').replace(/^echo\s+(.+);$/, '__print($1);').replace(/\bforeach\s*\(\s*(.+?)\s+as\s+(\w+)\s*=>\s*(\w+)\s*\)/, 'for (let [$2, $3] of __entries($1))').replace(/\bforeach\s*\(\s*(.+?)\s+as\s+(\w+)\s*\)/, 'for (let $2 of __vals($1))').replace(/\barray\(/g, '[').replace(/\bcount\(/g, '__len(').replace(/\bstrtoupper\(/g, '__upper(').replace(/\bstrtolower\(/g, '__lower(').replace(/\bstrlen\(/g, '__len(').replace(/\bPHP_EOL\b/g, '"\\n"').replace(/\bimplode\(([^,]+),\s*([^)]+)\)/g, '($2).join($1)').replace(/\bprint_r\(/g, '__println(').replace(/\bvar_dump\(/g, '__println(').replace(/\bprintf\(/g, '__printf(').replace(/\bsprintf\(/g, '__sprintf(').replace(/\bfor\s*\(\s*(\w+)\s*=/, 'for (let $1 =').replace(/\bfunction\s+(\w+)\s*\(([^)]*)\)/, (m, n, p) => `function ${n}(${p.split(',').map((x) => x.trim().split(/\s+/).pop().replace(/=.*/, '')).filter(Boolean).join(', ')})`); out.push(l); continue; }
      if (lang === 'ruby') {
        l = l.replace(/"((?:[^"\\]|\\.)*)"/g, (m, b) => (b.includes('#{') ? '`' + b.replace(/#\{([^}]+)\}/g, '${$1}') + '`' : m));
        l = l.replace(/^puts\s+(.+)$/, '__println($1)').replace(/^print\s+(.+)$/, '__print($1)').replace(/^p\s+(.+)$/, '__println($1)').replace(/^puts$/, '__println("")');
        let m;
        if ((m = /^def\s+(\w+[?!]?)\s*(?:\((.*)\)|(.*))$/.exec(l))) { stack.push('def'); out.push(`function ${m[1].replace(/[?!]/, '')}(${m[2] || m[3] || ''}) {`); continue; }
        if ((m = /^(.+?)\.each_with_index\s+do\s*\|(\w+),\s*(\w+)\|$/.exec(l)) || (m = /^(.+?)\.each_with_index\s*\{\s*\|(\w+),\s*(\w+)\|$/.exec(l))) { open(`for (let [${m[3]}, ${m[2]}] of __entries(${m[1]})) {`); continue; }
        if ((m = /^(.+?)\.each\s*\{\s*\|(\w+)\|\s*(.+?)\s*\}$/.exec(l))) { out.push(`for (let ${m[2]} of __vals(${m[1]})) { ${m[3].replace(/^puts\s+(.+)$/, '__println($1)').replace(/^print\s+(.+)$/, '__print($1)')} }`); continue; }
        if ((m = /^(.+?)\.each\s+do\s*\|(\w+)\|$/.exec(l))) { open(`for (let ${m[2]} of __vals(${m[1]})) {`); continue; }
        if ((m = /^(\d+|\w+)\.times\s+do\s*(?:\|(\w+)\|)?$/.exec(l))) { open(`for (let ${m[2] || '__i'} = 0; ${m[2] || '__i'} < ${m[1]}; ${m[2] || '__i'}++) {`); continue; }
        if ((m = /^for\s+(\w+)\s+in\s+\(?(.+?)(\.\.\.?)(.+?)\)?$/.exec(l))) { open(`for (let ${m[1]} = ${m[2]}; ${m[1]} ${m[3] === '..' ? '<=' : '<'} ${m[4]}; ${m[1]}++) {`); continue; }
        if ((m = /^for\s+(\w+)\s+in\s+(.+)$/.exec(l))) { open(`for (let ${m[1]} of __vals(${m[2]})) {`); continue; }
        if ((m = /^(if|unless|while|until|elsif)\s+(.+?)(\s+then|\s+do)?$/.exec(l))) { const c = m[1] === 'unless' || m[1] === 'until' ? `!(${m[2]})` : m[2]; open(m[1] === 'elsif' ? `} else if (${c}) {` : `${m[1] === 'until' ? 'while' : m[1] === 'unless' ? 'if' : m[1]} (${c}) {`); continue; }
        if (l === 'else') { out.push('} else {'); continue; } if (l === 'end') { if (stack.pop() === 'def') { const last = out[out.length - 1]; if (last && !/^(return|if|for|while|var |\}|function|__print)/.test(last)) out[out.length - 1] = 'return ' + last; } out.push('}'); continue; }
        if ((m = /^(.+?)\s+(if|unless)\s+(.+)$/.exec(l)) && !/^(return|puts)?\s*["`]/.test(l)) { out.push(`if (${m[2] === 'unless' ? '!' : ''}(${m[3]})) { ${m[1]} }`); continue; }
        l = l.replace(/\.length\b|\.size\b|\.count\b/g, '.length').replace(/\.upcase\b/g, '.toUpperCase()').replace(/\.downcase\b/g, '.toLowerCase()').replace(/\.to_s\b|\.to_i\b(?!\()/g, '').replace(/\.reverse\b(?!\()/g, '.slice().reverse()').replace(/\.join\b(?!\()/g, ".join('')").replace(/\.sum\b(?!\()/g, '.reduce((a,b)=>a+b,0)').replace(/\bnil\b/g, 'null').replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!').replace(/\*\*/g, '**');
        if (/^\w+\s*=[^=]/.test(l)) l = 'var ' + l; out.push(l); continue;
      }
      if (lang === 'lua') {
        let m; l = l.replace(/~=/g, '!=').replace(/\.\./g, ' + ').replace(/#(\w+)/g, '__len($1)').replace(/\bnil\b/g, 'null').replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!').replace(/\blocal\s+function\b/g, 'function').replace(/\blocal\s+/g, 'var ').replace(/\bstring\.format\(/g, '__sprintf(').replace(/\bstring\.upper\(/g, '__upper(').replace(/\bstring\.rep\(([^,]+),\s*([^)]+)\)/g, '($1).repeat($2)').replace(/\bmath\./g, 'Math.').replace(/\btostring\(/g, 'String(').replace(/\btonumber\(/g, 'Number(').replace(/\btable\.insert\(([^,]+),\s*([^)]+)\)/g, '$1.push($2)').replace(/\btable\.concat\(([^,]+),\s*([^)]+)\)/g, '$1.join($2)').replace(/=\s*\{([^{}]*)\}/g, (mm, b) => (/\w+\s*=/.test(b) ? '= {' + b.replace(/(\w+)\s*=/g, '$1:') + '}' : '= __la(' + b + ')'));
        if ((m = /^print\((.*)\)$/.exec(l))) { out.push(`__printTab(${m[1]})`); continue; }
        if ((m = /^function\s+([\w.:]+)\s*\((.*)\)$/.exec(l))) { out.push(`function ${m[1].replace(/[.:]/g, '_')}(${m[2]}) {`); continue; }
        if ((m = /^for\s+(\w+)\s*=\s*([^,]+),\s*([^,]+?)(?:,\s*(.+?))?\s+do$/.exec(l))) { const st = m[4] || '1'; out.push(`for (let ${m[1]} = ${m[2]}; ${/^-/.test(st) ? `${m[1]} >= ${m[3]}` : `${m[1]} <= ${m[3]}`}; ${m[1]} += ${st}) {`); continue; }
        if ((m = /^for\s+(\w+)\s*,\s*(\w+)\s+in\s+i?pairs\((.+)\)\s+do$/.exec(l))) { out.push(`for (let [${m[1]}, ${m[2]}] of __luapairs(${m[3]})) {`); continue; }
        if ((m = /^(if|elseif|while)\s+(.+?)\s+(then|do)$/.exec(l))) { out.push(m[1] === 'elseif' ? `} else if (${m[2]}) {` : `${m[1]} (${m[2]}) {`); continue; }
        if (l === 'else') { out.push('} else {'); continue; } if (l === 'end' || l === 'end)') { out.push('}'); continue; } if (l === 'repeat') { out.push('do {'); continue; } if ((m = /^until\s+(.+)$/.exec(l))) { out.push(`} while (!(${m[1]}))`); continue; }
        if (/^[\w.[\]]+\s*=[^=]/.test(l) && !/^var /.test(l) && !/[.[]/.test(l.split('=')[0])) l = 'var ' + l; out.push(l); continue;
      }
      if (lang === 'perl') { l = l.replace(/[$@%](\w+)/g, '$1').replace(/^my\s+/, 'var ').replace(/\bmy\s+/g, 'var ').replace(/^print\s+(.+);$/, '__print($1);').replace(/^say\s+(.+);$/, '__println($1);').replace(/\s\.\s/g, ' + ').replace(/\beq\b/g, '===').replace(/\bne\b/g, '!==').replace(/\bforeach\s+(?:var\s+)?(\w+)\s*\(([^)]*)\)/g, 'for (let $1 of [$2])').replace(/\bsub\s+(\w+)\s*\{/g, 'function $1(...__a) {').replace(/\belsif\b/g, 'else if'); out.push(l); continue; }
      out.push(l);
    }
    return guardLoops(out.join('\n'));
  }
  R.translate = (lang, src) => (['ruby', 'lua', 'php', 'perl'].includes(lang) ? blocky(src, lang) : clike(src, lang));
  R.local = (lang, src, w) => {
    if (lang === 'sql') throw new Error('SQL needs the online sqlite engine');
    const js = R.translate(lang, src);
    const out = (s) => w(String(s));
    const H = {
      __println: (...a) => { if (lang === 'csharp' && a.length > 1 && /\{\d+/.test(a[0])) { const f = a.shift(); a = [f.replace(/\{(\d+)(?::[^}]*)?\}/g, (m, i) => show(a[+i]))]; } out(a.map(show).join(lang === 'lua' ? '\t' : lang === 'kotlin' || lang === 'csharp' || lang === 'java' ? '' : ' ') + '\n'); }, __printlnSp: (...a) => out(a.map(show).join(' ') + '\n'), __print: (...a) => out(a.map(show).join('')), __printTab: (...a) => out(a.map(show).join('\t') + '\n'),
      __printf: (f, ...a) => out(fmtC(f, a)), __sprintf: (f, ...a) => fmtC(f, a), __sprint: (...a) => a.map(show).join(''), __putchar: (c) => out(typeof c === 'number' ? String.fromCharCode(c) : c),
      __rprintln: (f = '', ...a) => out(fmtRust(f, Object.assign(a, { __named: {} })) + '\n'), __rprint: (f, ...a) => out(fmtRust(f, Object.assign(a, { __named: {} }))), __rformat: (f, ...a) => fmtRust(f, Object.assign(a, { __named: {} })),
      __len: (x) => (x == null ? 0 : x.__lua ? x.length - 1 : x.length !== undefined ? x.length : Object.keys(x).length), __entries: (x) => (Array.isArray(x) || typeof x === 'string' ? [...x].map((v, i) => [i, v]) : Object.entries(x)), __keys: (x) => (Array.isArray(x) ? x.map((v, i) => i) : Object.keys(x)), __vals: (x) => (Array.isArray(x) ? x : Object.values(x)), __luapairs: (x) => (x && x.__lua ? x.slice(1).map((v, i) => [i + 1, v]) : Array.isArray(x) ? x.map((v, i) => [i + 1, v]) : Object.entries(x)), __la: (...a) => { const r = [undefined, ...a]; Object.defineProperty(r, '__lua', { value: true }); return r; }, __upper: (s) => String(s).toUpperCase(), __lower: (s) => String(s).toLowerCase(),
    };
    // rust inline named args: {name} -> scope lookup
    const js2 = js.replace(/__r(println|print|format)\(\s*("(?:[^"\\]|\\.)*")/g, (m, k, f) => { const names = [...f.matchAll(/\{([a-zA-Z_]\w*)(?::[^}]*)?\}/g)].map((x) => x[1]); return names.length ? `__r${k}(${f.replace(/\{([a-zA-Z_]\w*)(:[^}]*)?\}/g, '{$2}')}, ${names.join(', ')}` : m; }).replace(/__r(println|print|format)\(([^,]+), ,/g, '__r$1($2,');
    new Function(...Object.keys(H), 'let __g = 0;\n' + js2)(...Object.values(H));
  };
  R.NAMES = NAMES;

  /* ---------- real Python via Pyodide ---------- */
  let pyP = null;
  R.pyodideURL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  R.loadPython = (onStatus) => {
    if (pyP) return pyP;
    pyP = new Promise((res, rej) => {
      if (window.loadPyodide) return res(window.loadPyodide({ indexURL: R.pyodideURL }));
      onStatus && onStatus('Downloading Python 3.12 (Pyodide, ~10 MB — only the first time)…');
      const s = document.createElement('script'); s.src = R.pyodideURL + 'pyodide.js'; s.onload = () => window.loadPyodide({ indexURL: R.pyodideURL }).then(res, rej); s.onerror = () => rej(new Error('offline')); document.head.appendChild(s);
      setTimeout(() => rej(new Error('timeout')), 60000);
    }).catch((e) => { pyP = null; throw e; });
    return pyP;
  };
  R.runPython = async (src, ctx, file) => {
    const py = await R.loadPython((m) => ctx.println(C.gray + m + C.r));
    py.setStdout({ batched: (s) => ctx.out(s + '\n') }); py.setStderr({ batched: (s) => ctx.err(C.red + s + C.r + '\n') });
    py.setStdin({ stdin: () => { const v = window.prompt('Python input()'); return v == null ? null : v; } });
    // sync the working directory into Python's filesystem
    const cwd = ctx.sh ? ctx.sh.cwd : OS.home(); const before = {};
    try { py.FS.mkdirTree(cwd); OS.fs.ls(cwd).forEach((f) => { if (f.type === 'file' && f.size < 400000) { const c = OS.fs.read(OS.fs.join(cwd, f.name)); if (!OS.isDataUrl(c)) { py.FS.writeFile(OS.fs.join(cwd, f.name), c); before[f.name] = c; } } }); py.FS.chdir(cwd); } catch (e) {}
    try { await py.loadPackagesFromImports(src).catch(() => {}); await py.runPythonAsync(src, { filename: file || '<stdin>' }); }
    catch (e) { const msg = String(e.message || e).split('\n'); const i = msg.findIndex((l) => l.startsWith('Traceback')); ctx.err(C.red + msg.slice(i < 0 ? 0 : i).filter((l) => !/_pyodide|pyodide\/|\/lib\/python3/.test(l)).join('\n').trim() + C.r + '\n'); return 1; }
    finally { try { py.FS.readdir(cwd).forEach((n) => { if (n === '.' || n === '..') return; const p = OS.fs.join(cwd, n); try { if (py.FS.isFile(py.FS.stat(p).mode)) { const c = py.FS.readFile(p, { encoding: 'utf8' }); if (before[n] !== c) OS.fs.write(p, c); } } catch (e) {} }); } catch (e) {} }
    return 0;
  };

  /* ---------- shared executor used by terminal commands ---------- */
  async function readStdin(ctx, src) {
    if (ctx.stdin) return ctx.stdin;
    if (!R.needsInput(src)) return '';
    ctx.println(C.gray + 'This program reads input. Type it below, then an empty line to run:' + C.r);
    const ls = []; for (;;) { const l = await ctx.readLine(''); if (l == null || l === '') break; ls.push(l); } return ls.join('\n') + '\n';
  }
  R.exec = async (lang, src, ctx, label) => {
    const offline = OS.store.get('runner-offline', false);
    if (!offline) {
      try {
        const stdin = await readStdin(ctx, src);
        const r = await R.remote(lang, src, stdin);
        if (ctx.isTTY && lang !== 'python') ctx.println(C.gray + `── ${r.compiler} · cloud build ──` + C.r);
        if (r.cerr) { ctx.err(C.red + r.cerr.replace(/prog\.(\w+)/g, label || 'source.$1') + C.r + (r.cerr.endsWith('\n') ? '' : '\n')); if (r.status && !r.out) return r.status || 1; }
        if (r.out) ctx.out(r.out); if (r.err) ctx.err(C.red + r.err + C.r);
        if (r.signal) ctx.err(C.red + r.signal + C.r + '\n');
        return r.status || 0;
      } catch (e) { ctx.println(C.yellow + `⚠ Online compilers unreachable (${e.message}). Using the offline lite runner — supports simple programs.` + C.r); }
    }
    try { R.local(lang, src, (s) => ctx.out(s)); return 0; } catch (e) { ctx.err(`${C.red}${label || lang}: ${e.message}${C.r}\n`); return 1; }
  };
  const MARK = '#!cirrus-exec';
  R.isBinary = (content) => typeof content === 'string' && content.startsWith(MARK);
  const writeBin = (path, lang, srcPath) => OS.fs.write(path, `${MARK}\nlang=${lang}\nsrc=${srcPath}\n\x7fELF compiled by Cirrus (${NAMES[lang]})\n`);
  R.runBinary = async (path, ctx) => {
    const c = OS.fs.read(path); const lang = (/lang=(\w+)/.exec(c) || [])[1], sp = (/src=(.+)/.exec(c) || [])[1];
    if (!lang || !sp || !OS.fs.isFile(sp)) { ctx.err(`${OS.fs.basename(path)}: cannot execute binary file (source missing)\n`); return 126; }
    return R.exec(lang, OS.fs.read(sp), ctx, OS.fs.basename(sp));
  };
  const srcArg = (ctx, exts) => ctx.args.find((a) => !a.startsWith('-') && exts.includes(OS.ext(a)));
  const need = (ctx, f, tool) => { if (!f) { ctx.err(`${tool}: fatal error: no input files\ncompilation terminated.\n`); return false; } if (!OS.fs.isFile(ctx.path(f))) { ctx.err(`${tool}: error: ${f}: No such file or directory\n`); return false; } return true; };
  const outName = (ctx, def) => { const i = ctx.args.indexOf('-o'); return i >= 0 && ctx.args[i + 1] ? ctx.args[i + 1] : def; };
  def('gcc cc clang', 'C compiler', (ctx) => { if (ctx.args[0] === '--version' || ctx.args[0] === '-v') return ctx.println('gcc (Cirrus 13.2.0-cloud) 13.2.0'); const f = srcArg(ctx, ['c']); if (!need(ctx, f, ctx.name)) return 1; writeBin(ctx.path(outName(ctx, 'a.out')), 'c', ctx.path(f)); });
  def('g++ c++ clang++', 'C++ compiler', (ctx) => { if (ctx.args[0] === '--version') return ctx.println('g++ (Cirrus 13.2.0-cloud) 13.2.0'); const f = srcArg(ctx, ['cpp', 'cc', 'cxx']); if (!need(ctx, f, ctx.name)) return 1; writeBin(ctx.path(outName(ctx, 'a.out')), 'cpp', ctx.path(f)); });
  def('javac', 'Java compiler', (ctx) => { if (ctx.args[0] === '-version') return ctx.println('javac 21.0.3'); const f = srcArg(ctx, ['java']); if (!need(ctx, f, 'javac')) return 1; const src = OS.fs.read(ctx.path(f)); const cls = (/class\s+(\w+)/.exec(src) || [, OS.fs.basename(f).replace(/\.java$/, '')])[1]; writeBin(OS.fs.join(OS.fs.dirname(ctx.path(f)), cls + '.class'), 'java', ctx.path(f)); });
  def('java', 'Java runtime', async (ctx) => {
    if (!ctx.args.length || ctx.args[0] === '-version' || ctx.args[0] === '--version') return ctx.println('openjdk 21.0.3 2024-04-16\nOpenJDK Runtime Environment (Cirrus cloud build)');
    const ji = ctx.args.indexOf('-jar'); if (ji >= 0) { const p = ctx.path(ctx.args[ji + 1] || ''); if (!OS.fs.isFile(p)) { ctx.err('Error: Unable to access jarfile ' + ctx.args[ji + 1] + '\n'); return 1; } return R.runBinary(p, ctx); }
    const a = ctx.args.find((x) => !x.startsWith('-'));
    if (/\.java$/.test(a)) { if (!need(ctx, a, 'java')) return 1; return R.exec('java', OS.fs.read(ctx.path(a)), ctx, a); }
    const cp = ctx.path(a + '.class'); if (!OS.fs.isFile(cp)) { ctx.err(`Error: Could not find or load main class ${a}\nCaused by: java.lang.ClassNotFoundException: ${a}\n`); return 1; } return R.runBinary(cp, ctx);
  });
  def('go', 'Go toolchain', async (ctx) => {
    const [sub, ...rest] = ctx.args; if (!sub || sub === 'version') return ctx.println('go version go1.22.4 linux/amd64');
    const f = rest.find((x) => x.endsWith('.go')) || (OS.fs.ls(ctx.sh.cwd).find((x) => x.name.endsWith('.go')) || {}).name;
    if (!need(ctx, f, 'go')) return 1;
    if (sub === 'run') return R.exec('go', OS.fs.read(ctx.path(f)), ctx, f);
    if (sub === 'build') { writeBin(ctx.path(outName(ctx, f.replace(/\.go$/, ''))), 'go', ctx.path(f)); return; }
    ctx.err(`go ${sub}: unknown command\nRun 'go help' for usage.\n`); return 2;
  });
  def('rustc', 'Rust compiler', (ctx) => { if (ctx.args[0] === '--version' || ctx.args[0] === '-V') return ctx.println('rustc 1.79.0 (cirrus-cloud)'); const f = srcArg(ctx, ['rs']); if (!need(ctx, f, 'rustc')) return 1; writeBin(ctx.path(outName(ctx, f.replace(/\.rs$/, ''))), 'rust', ctx.path(f)); });
  def('cargo', 'Rust package manager', async (ctx) => { if (ctx.args[0] !== 'run') return ctx.println('cargo 1.79.0 — try: cargo run (runs src/main.rs or main.rs)'); const p = ['src/main.rs', 'main.rs'].map((x) => ctx.path(x)).find((x) => OS.fs.isFile(x)); if (!p) { ctx.err('error: could not find `Cargo.toml` or main.rs\n'); return 101; } ctx.println(`${C.green}   Compiling${C.r} ${OS.fs.basename(ctx.sh.cwd)} v0.1.0\n${C.green}    Finished${C.r} dev [unoptimized + debuginfo]\n${C.green}     Running${C.r} target/debug/${OS.fs.basename(ctx.sh.cwd)}`); return R.exec('rust', OS.fs.read(p), ctx, 'main.rs'); });
  def('csc mcs', 'C# compiler', (ctx) => { const f = srcArg(ctx, ['cs']); if (!need(ctx, f, ctx.name)) return 1; const o = (ctx.args.find((a) => a.startsWith('-out:')) || '').slice(5) || f.replace(/\.cs$/, '.exe'); writeBin(ctx.path(o), 'csharp', ctx.path(f)); });
  def('mono', 'run .NET programs', async (ctx) => { const f = ctx.args.find((x) => !x.startsWith('-')); if (!f) return ctx.println('Mono JIT compiler version 6.12 (cirrus)'); if (/\.cs$/.test(f)) return R.exec('csharp', OS.fs.read(ctx.path(f)), ctx, f); if (!OS.fs.isFile(ctx.path(f))) { ctx.err(`Cannot open assembly '${f}': No such file or directory.\n`); return 2; } return R.runBinary(ctx.path(f), ctx); });
  def('dotnet', '.NET CLI', async (ctx) => { if (ctx.args[0] !== 'run') return ctx.println('.NET SDK 8.0 (cirrus) — try: dotnet run'); const f = (OS.fs.ls(ctx.sh.cwd).find((x) => x.name.endsWith('.cs')) || {}).name; if (!need(ctx, f, 'dotnet')) return 1; return R.exec('csharp', OS.fs.read(ctx.path(f)), ctx, f); });
  def('kotlinc', 'Kotlin compiler', (ctx) => { const f = srcArg(ctx, ['kt']); if (!need(ctx, f, 'kotlinc')) return 1; const di = ctx.args.indexOf('-d'); writeBin(ctx.path(di >= 0 ? ctx.args[di + 1] : f.replace(/\.kt$/, '.jar')), 'kotlin', ctx.path(f)); });
  def('kotlin', 'Kotlin runner', async (ctx) => { const f = ctx.args.find((x) => !x.startsWith('-')); if (!f) return ctx.println('Kotlin 2.0 (cirrus)'); if (/\.kts?$/.test(f)) return R.exec('kotlin', OS.fs.read(ctx.path(f)), ctx, f); return R.runBinary(ctx.path(f), ctx); });
  def('swiftc', 'Swift compiler', (ctx) => { const f = srcArg(ctx, ['swift']); if (!need(ctx, f, 'swiftc')) return 1; writeBin(ctx.path(outName(ctx, f.replace(/\.swift$/, ''))), 'swift', ctx.path(f)); });
  const direct = (cmd, lang, exts, ver) => def(cmd, NAMES[lang] + ' interpreter', async (ctx) => { const f = ctx.args.find((x) => !x.startsWith('-')); if (!f || ctx.args[0] === '--version' || ctx.args[0] === '-v') return ctx.println(ver); if (!OS.fs.isFile(ctx.path(f))) { ctx.err(`${ctx.name}: ${f}: No such file or directory\n`); return 1; } return R.exec(lang, OS.fs.read(ctx.path(f)), ctx, f); });
  direct('swift', 'swift', ['swift'], 'Swift version 5.10 (cirrus)'); direct('php', 'php', ['php'], 'PHP 8.3.6 (cli)'); direct('ruby', 'ruby', ['rb'], 'ruby 3.3.1 (cirrus)'); direct('lua lua5.4', 'lua', ['lua'], 'Lua 5.4.6'); direct('perl', 'perl', ['pl'], 'This is perl 5, version 38');
  def('sqlite3', 'SQL database shell', async (ctx) => { const f = ctx.args.find((x) => /\.sql$/.test(x)); const src = ctx.stdin || (f && OS.fs.isFile(ctx.path(f)) ? OS.fs.read(ctx.path(f)) : ''); if (!src) return ctx.println('SQLite version 3.45 (cirrus)\nUsage: sqlite3 :memory: < file.sql'); return R.exec('sql', src, ctx, f || 'stdin'); });
  def('tsc', 'TypeScript compiler', async (ctx) => { if (ctx.args[0] === '-v' || ctx.args[0] === '--version') return ctx.println('Version 5.4.5'); const f = srcArg(ctx, ['ts']); if (!need(ctx, f, 'tsc')) return 1; OS.fs.write(ctx.path(f.replace(/\.ts$/, '.js')), await R.compileTS(OS.fs.read(ctx.path(f)), ctx)); });
  def('ts-node tsx deno', 'run TypeScript', async (ctx) => { const f = ctx.args.find((x) => !x.startsWith('-') && x !== 'run'); if (!f) return ctx.println('ts-node v10.9 (cirrus)'); if (!OS.fs.isFile(ctx.path(f))) { ctx.err(`Cannot find module '${f}'\n`); return 1; } try { const r = OS.shell.jsRun(await R.compileTS(OS.fs.read(ctx.path(f)), ctx), ctx); if (r && r.then) await r; } catch (e) { ctx.err(`${C.red}${e.name}: ${e.message}${C.r}\n`); return 1; } });
  R.tsURL = 'https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.js';
  let tsP = null;
  R.loadTS = () => (tsP = tsP || new Promise((res, rej) => { if (window.ts && window.ts.transpileModule) return res(window.ts); const s2 = document.createElement('script'); s2.src = R.tsURL; s2.onload = () => (window.ts ? res(window.ts) : rej(new Error('no ts'))); s2.onerror = () => rej(new Error('offline')); document.head.appendChild(s2); setTimeout(() => rej(new Error('timeout')), 45000); }).catch((e) => { tsP = null; throw e; }));
  // real TypeScript compiler when available, fast type-stripping otherwise
  R.compileTS = async (src, ctx) => { if (!OS.store.get('runner-offline', false)) { try { if (!window.ts && ctx && ctx.isTTY) ctx.println(C.gray + 'Loading the TypeScript compiler (first time only)…' + C.r); const ts = await R.loadTS(); return ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None, removeComments: false } }).outputText.replace(/^"use strict";\s*/, '').replace(/^Object\.defineProperty\(exports[^\n]*\n/m, ''); } catch (e) {} } return R.stripTS(src); };
  R.stripTS = (src) => src.replace(/(\w|\))\s*:\s*[A-Za-z_][\w.]*\s*<[^<>=]*(?:<[^<>]*>[^<>=]*)*>(\[\])*(?=\s*[,)=;{]|\s*=>)/g, '$1').replace(/^\s*(export\s+)?type\s+\w+(\s*<[^>]*>)?\s*=[\s\S]*?;[ \t]*$/gm, '').replace(/\b(class|function|interface)\s+(\w+)\s*<[^>{(]*>/g, '$1 $2').replace(/\bnew\s+([\w.]+)\s*<[^>()]*>\s*\(/g, 'new $1(').replace(/\b(implements)\s+[\w<>, ]+(?=\{)/g, '').replace(/^\s*(export\s+)?interface\s+\w+[^{]*\{[\s\S]*?\n\}\s*$/gm, '').replace(/^\s*(export\s+)?type\s+\w+\s*=[^;]+;\s*$/gm, '').replace(/\b(public|private|protected|readonly)\s+/g, '').replace(/(\w|\))\s*:\s*[A-Za-z_][\w<>\[\]|&., ]*?(\[\])?(?=\s*[,)=;{]|\s*=>)/g, '$1').replace(/\bas\s+[A-Za-z_][\w<>\[\]]*/g, '').replace(/function\s+(\w+)\s*<[^>]+>/g, 'function $1').replace(/!\./g, '.').replace(/^export\s+(default\s+)?/gm, '');
  def('run', 'run a source file in any language', async (ctx) => {
    const f = ctx.args[0]; if (!f) return ctx.println('usage: run <file>   — runs C, C++, Java, C#, Go, Rust, Kotlin, Swift, PHP, Ruby, Lua, Perl, SQL, Python, JS, TS, shell');
    const p = ctx.path(f); if (!OS.fs.isFile(p)) { ctx.err(`run: ${f}: No such file\n`); return 1; } const lang = R.langOf(f);
    if (lang === 'javascript') return OS.shell.CMDS.node(Object.assign({}, ctx, { name: 'node', args: [f] }));
    if (lang === 'typescript') return OS.shell.CMDS['ts-node'](Object.assign({}, ctx, { name: 'ts-node', args: [f] }));
    if (lang === 'python') return OS.shell.CMDS.python3(Object.assign({}, ctx, { name: 'python3', args: [f] }));
    if (lang === 'shell') return OS.shell.CMDS.bash(Object.assign({}, ctx, { name: 'bash', args: [f] }));
    if (!lang) { ctx.err(`run: don't know how to run .${OS.ext(f)} files\n`); return 1; }
    return R.exec(lang, OS.fs.read(p), ctx, f);
  });
  def('runner-mode', 'choose online/offline compilers', (ctx) => { const m = ctx.args[0]; if (m === 'offline' || m === 'online') { OS.store.set('runner-offline', m === 'offline'); return ctx.println('Compilers: ' + m); } ctx.println('Compilers: ' + (OS.store.get('runner-offline', false) ? 'offline (lite runner)' : 'online (real compilers, falls back offline)') + '\nusage: runner-mode online|offline'); });
})();
