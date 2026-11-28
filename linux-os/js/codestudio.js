/* Cirrus Linux — Nimbus Code: a code editor with syntax highlighting, explorer, search, terminal and run/preview */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  /* ======================= languages ======================= */
  const W = (s) => s.split(' ');
  const C_LIKE = { line: '//', block: ['/*', '*/'] };
  const LANGS = {
    javascript: { name: 'JavaScript', ext: ['js', 'mjs', 'cjs', 'jsx'], c: C_LIKE, kw: W('break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await get set'), lit: W('true false null undefined NaN Infinity'), bi: W('console Math JSON Object Array String Number Boolean Promise Date RegExp Map Set Symbol Error window document fetch setTimeout setInterval parseInt parseFloat require module process'), color: '#f7df1e', tpl: true },
    typescript: { name: 'TypeScript', ext: ['ts', 'tsx'], c: C_LIKE, kw: W('break case catch class const continue default delete do else enum export extends finally for from function if implements import in instanceof interface let new of private protected public readonly return static super switch this throw try type typeof var void while yield async await as declare namespace abstract keyof'), lit: W('true false null undefined'), types: W('string number boolean any unknown never void object bigint Array Record Promise Partial'), bi: W('console Math JSON Object Array String Number Promise Date Map Set'), color: '#3178c6', tpl: true },
    python: { name: 'Python', ext: ['py', 'pyw'], c: { line: '#' }, kw: W('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'), lit: W('True False None'), bi: W('print len range int str float list dict set tuple open input sorted enumerate zip map filter sum min max abs round type isinstance super self'), color: '#3776ab', triple: true },
    html: { name: 'HTML', ext: ['html', 'htm', 'xhtml', 'svg', 'xml', 'vue'], markup: true, c: { block: ['<!--', '-->'] }, color: '#e34f26' },
    css: { name: 'CSS', ext: ['css', 'scss', 'less'], css: true, c: { block: ['/*', '*/'], line: null }, color: '#2965f1' },
    json: { name: 'JSON', ext: ['json', 'jsonc', 'webmanifest'], json: true, c: {}, lit: W('true false null'), color: '#cbcb41' },
    markdown: { name: 'Markdown', ext: ['md', 'markdown'], md: true, c: {}, color: '#519aba' },
    shell: { name: 'Shell Script', ext: ['sh', 'bash', 'zsh'], c: { line: '#' }, kw: W('if then else elif fi for while until do done case esac in function return local export source alias exit break continue'), bi: W('echo cd ls cat grep sed awk printf read test mkdir rm cp mv touch pwd sudo apt git curl wget chmod'), color: '#89e051', vars: true },
    c: { name: 'C', ext: ['c', 'h'], c: C_LIKE, kw: W('auto break case const continue default do else enum extern for goto if inline register return sizeof static struct switch typedef union volatile while #include #define #ifdef #ifndef #endif #pragma'), types: W('int char float double long short signed unsigned void bool size_t FILE'), lit: W('NULL true false'), bi: W('printf scanf malloc free strlen strcpy memcpy puts main'), color: '#a8b9cc' },
    cpp: { name: 'C++', ext: ['cpp', 'cc', 'cxx', 'hpp', 'hh'], c: C_LIKE, kw: W('alignas auto break case catch class const constexpr continue default delete do else enum explicit export extern for friend goto if inline mutable namespace new noexcept operator private protected public return sizeof static struct switch template this throw try typedef typename union using virtual volatile while #include #define'), types: W('int char float double long short unsigned void bool string vector map auto size_t'), lit: W('nullptr true false'), bi: W('std cout cin endl printf'), color: '#f34b7d' },
    java: { name: 'Java', ext: ['java'], c: C_LIKE, kw: W('abstract assert break case catch class const continue default do else enum extends final finally for if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while var record'), types: W('int long short byte char float double boolean void String Integer List Map ArrayList HashMap Object'), lit: W('true false null'), bi: W('System out println Math'), color: '#b07219' },
    csharp: { name: 'C#', ext: ['cs'], c: C_LIKE, kw: W('abstract as base break case catch class const continue default delegate do else enum event explicit extern finally fixed for foreach goto if implicit in interface internal is lock namespace new operator out override params private protected public readonly ref return sealed sizeof static struct switch this throw try typeof unchecked unsafe using virtual void volatile while var async await get set'), types: W('int long string bool double float decimal char object byte List Dictionary Task'), lit: W('true false null'), bi: W('Console WriteLine Math'), color: '#178600' },
    go: { name: 'Go', ext: ['go'], c: C_LIKE, kw: W('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'), types: W('int int64 float64 string bool byte rune error any'), lit: W('true false nil iota'), bi: W('fmt Println Printf make len append cap new panic'), color: '#00add8' },
    rust: { name: 'Rust', ext: ['rs'], c: C_LIKE, kw: W('as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while'), types: W('i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 bool char str String Vec Option Result Box usize'), lit: W('true false None Some Ok Err'), bi: W('println! print! vec! format! panic!'), color: '#dea584' },
    php: { name: 'PHP', ext: ['php'], c: { line: '//', block: ['/*', '*/'] }, kw: W('abstract and as break case catch class clone const continue declare default do echo else elseif empty endif extends final finally fn for foreach function global if implements include interface isset namespace new or print private protected public require return static switch throw trait try unset use var while'), lit: W('true false null TRUE FALSE NULL'), color: '#4f5d95', vars: true },
    ruby: { name: 'Ruby', ext: ['rb'], c: { line: '#' }, kw: W('alias and begin break case class def defined? do else elsif end ensure for if in module next nil not or redo rescue retry return self super then undef unless until when while yield require attr_accessor puts'), lit: W('true false nil'), color: '#701516' },
    lua: { name: 'Lua', ext: ['lua'], c: { line: '--' }, kw: W('and break do else elseif end for function goto if in local not or repeat return then until while'), lit: W('true false nil'), bi: W('print pairs ipairs table string math require'), color: '#000080' },
    kotlin: { name: 'Kotlin', ext: ['kt', 'kts'], c: C_LIKE, kw: W('as break class continue do else for fun if in interface is object package return super this throw try typealias val var when while data sealed override open private public'), types: W('Int Long Double Float String Boolean Unit Any List Map'), lit: W('true false null'), bi: W('println listOf mapOf'), color: '#a97bff' },
    swift: { name: 'Swift', ext: ['swift'], c: C_LIKE, kw: W('associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public static struct subscript typealias var break case continue default defer do else fallthrough for guard if in repeat return switch where while as catch throw throws try async await'), types: W('Int Double Float String Bool Character Array Dictionary Optional'), lit: W('true false nil'), bi: W('print'), color: '#f05138' },
    sql: { name: 'SQL', ext: ['sql'], c: { line: '--', block: ['/*', '*/'] }, kw: W('select from where insert into values update set delete create table drop alter add primary key foreign references join left right inner outer on group by order having limit offset as and or not null is in like distinct union all case when then else end index view default unique'), types: W('int integer varchar text date datetime boolean float real serial'), bi: W('count sum avg min max now coalesce'), ci: true, color: '#e38c00' },
    yaml: { name: 'YAML', ext: ['yml', 'yaml'], c: { line: '#' }, yaml: true, lit: W('true false null yes no on off'), color: '#cb171e' },
    toml: { name: 'TOML', ext: ['toml', 'ini', 'conf', 'cfg', 'env'], c: { line: '#' }, yaml: true, lit: W('true false'), color: '#9c4221' },
    plaintext: { name: 'Plain Text', ext: ['txt', 'log', 'csv'], plain: true, c: {}, color: '#888' },
  };
  const langOf = (name) => { const e = OS.ext(name); for (const k in LANGS) if (LANGS[k].ext.includes(e)) return k; if (/^(Makefile|Dockerfile|\.bashrc|\.profile)$/.test(name)) return 'shell'; return 'plaintext'; };
  /* ======================= highlighter ======================= */
  function hlCode(src, L) {
    const kw = new Set(L.kw || []), lit = new Set(L.lit || []), ty = new Set(L.types || []), bi = new Set(L.bi || []);
    let out = '', i = 0; const n = src.length; const sp = (c, t) => `<span class="t-${c}">${esc(t)}</span>`;
    const lc = L.c.line, bc = L.c.block;
    while (i < n) {
      const ch = src[i], rest = src.startsWith.bind(src);
      if (bc && rest(bc[0], i)) { let j = src.indexOf(bc[1], i + bc[0].length); j = j < 0 ? n : j + bc[1].length; out += sp('com', src.slice(i, j)); i = j; continue; }
      if (lc && rest(lc, i) && !(lc === '#' && L.name === 'C')) { let j = src.indexOf('\n', i); if (j < 0) j = n; out += sp('com', src.slice(i, j)); i = j; continue; }
      if (L.triple && (rest('"""', i) || rest("'''", i))) { const q = src.slice(i, i + 3); let j = src.indexOf(q, i + 3); j = j < 0 ? n : j + 3; out += sp('str', src.slice(i, j)); i = j; continue; }
      if (ch === '"' || ch === "'" || (ch === '`' && L.tpl)) { let j = i + 1; while (j < n && src[j] !== ch) { if (src[j] === '\\') j++; if (src[j] === '\n' && ch !== '`') break; j++; } j = Math.min(n, j + 1); out += sp('str', src.slice(i, j)); i = j; continue; }
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) { const m = /^(0x[0-9a-fA-F_]+|0b[01_]+|[0-9][0-9_]*\.?[0-9_]*(e[+-]?[0-9]+)?[a-zA-Z]*|\.[0-9]+)/.exec(src.slice(i, i + 40)); if (m && !/[A-Za-z_]/.test(src[i - 1] || '')) { out += sp('num', m[0]); i += m[0].length; continue; } }
      if (L.vars && ch === '$') { const m = /^\$(\{[^}]*\}|[A-Za-z_][\w]*|[0-9@#?$!*])/.exec(src.slice(i, i + 60)); if (m) { out += sp('var', m[0]); i += m[0].length; continue; } }
      if (ch === '@' && /[A-Za-z]/.test(src[i + 1] || '')) { const m = /^@[\w.]+/.exec(src.slice(i, i + 60)); out += sp('dec', m[0]); i += m[0].length; continue; }
      if (/[A-Za-z_#$]/.test(ch)) {
        const m = /^[#A-Za-z_$][\w$!?]*/.exec(src.slice(i, i + 80)); const w = m[0]; const key = L.ci ? w.toLowerCase() : w;
        let cls = kw.has(key) ? 'kw' : lit.has(key) ? 'lit' : ty.has(key) ? 'type' : bi.has(key) ? 'bi' : null;
        if (!cls) { let j = i + w.length; while (src[j] === ' ') j++; if (src[j] === '(') cls = 'fn'; else if (/^[A-Z]/.test(w) && L !== LANGS.sql) cls = 'type'; }
        out += cls ? sp(cls, w) : esc(w); i += w.length; continue;
      }
      if (/[{}()[\]]/.test(ch)) { out += sp('br', ch); i++; continue; }
      if (/[-+*/%=<>!&|^~?:;,.]/.test(ch)) { out += sp('op', ch); i++; continue; }
      out += esc(ch); i++;
    }
    return out;
  }
  function hlMarkup(src) {
    return esc(src).replace(/&lt;!--[\s\S]*?(--&gt;|$)/g, (m) => `\u0001com\u0002${m}\u0003`)
      .replace(/(&lt;\/?)([\w:-]+)([\s\S]*?)(\/?&gt;)/g, (m, a, tag, attrs, b) => { if (m.includes('\u0001')) return m; return `\u0001punc\u0002${a}\u0003\u0001tag\u0002${tag}\u0003${attrs.replace(/([\w:@.-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|[^\s&]+)?/g, (mm, n2, eq, v) => `\u0001attr\u0002${n2}\u0003${eq}${v ? `\u0001str\u0002${v}\u0003` : ''}`)}\u0001punc\u0002${b}\u0003`; })
      .replace(/&amp;\w+;/g, (m) => `\u0001lit\u0002${m}\u0003`)
      .replace(/\u0001(\w+)\u0002/g, '<span class="t-$1">').replace(/\u0003/g, '</span>');
  }
  function hlCss(src) {
    let out = ''; let i = 0, inBlock = 0; const n = src.length; const sp = (c, t) => `<span class="t-${c}">${esc(t)}</span>`;
    while (i < n) {
      if (src.startsWith('/*', i)) { let j = src.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; out += sp('com', src.slice(i, j)); i = j; continue; }
      const ch = src[i];
      if (ch === '{') { inBlock++; out += sp('br', ch); i++; continue; } if (ch === '}') { inBlock = Math.max(0, inBlock - 1); out += sp('br', ch); i++; continue; }
      if (ch === '"' || ch === "'") { let j = src.indexOf(ch, i + 1); j = j < 0 ? n : j + 1; out += sp('str', src.slice(i, j)); i = j; continue; }
      if (ch === '@') { const m = /^@[\w-]+/.exec(src.slice(i)); out += sp('kw', m[0]); i += m[0].length; continue; }
      if (inBlock) {
        const m = /^[\w-]+(?=\s*:(?!:))/.exec(src.slice(i, i + 60)); if (m && /[\s;{]$|^$/.test(src.slice(Math.max(0, i - 1), i))) { out += sp('prop', m[0]); i += m[0].length; continue; }
        const c2 = /^#[0-9a-fA-F]{3,8}\b/.exec(src.slice(i, i + 10)); if (c2) { out += `<span class="t-num" style="border-bottom:2px solid ${c2[0]}">${c2[0]}</span>`; i += c2[0].length; continue; }
        const nm = /^-?[0-9.]+(px|em|rem|%|vh|vw|s|ms|deg|fr)?/.exec(src.slice(i, i + 20)); if (nm && /[\s:(,]/.test(src[i - 1] || ' ')) { out += sp('num', nm[0]); i += nm[0].length; continue; }
        const fn = /^[\w-]+(?=\()/.exec(src.slice(i, i + 40)); if (fn) { out += sp('fn', fn[0]); i += fn[0].length; continue; }
        if (src.startsWith('!important', i)) { out += sp('kw', '!important'); i += 10; continue; }
        out += esc(ch); i++; continue;
      }
      const sel = /^[^{/"']+/.exec(src.slice(i)); if (sel) { out += sp('tag', sel[0]); i += sel[0].length; continue; }
      out += esc(ch); i++;
    }
    return out;
  }
  function hlJson(src) { return esc(src).replace(/(&quot;(?:[^&\\]|\\.|&(?!quot;))*?&quot;)(\s*:)?|\b(-?\d+\.?\d*(?:e[+-]?\d+)?)\b|\b(true|false|null)\b|([{}[\]])/gi, (m, s, colon, num, kw, br) => (s ? `<span class="t-${colon ? 'key' : 'str'}">${s}</span>${colon || ''}` : num ? `<span class="t-num">${num}</span>` : kw ? `<span class="t-lit">${kw}</span>` : `<span class="t-br">${br}</span>`)); }
  function hlMd(src) { return src.split('\n').map((l) => { const e = esc(l); if (/^#{1,6} /.test(l)) return `<span class="t-head">${e}</span>`; if (/^```/.test(l)) return `<span class="t-com">${e}</span>`; if (/^\s*>/.test(l)) return `<span class="t-com">${e}</span>`; return e.replace(/^(\s*)([-*+]|\d+\.)(\s)/, '$1<span class="t-kw">$2</span>$3').replace(/(`[^`]+`)/g, '<span class="t-str">$1</span>').replace(/(\*\*[^*]+\*\*)/g, '<span class="t-bold">$1</span>').replace(/(\[[^\]]*\])(\([^)]*\))/g, '<span class="t-fn">$1</span><span class="t-attr">$2</span>'); }).join('\n'); }
  function hlYaml(src, L) { return src.split('\n').map((l) => { const ci = l.search(/(^|\s)#/); let code = ci >= 0 ? l.slice(0, ci) : l, com = ci >= 0 ? l.slice(ci) : ''; let e = esc(code).replace(/^(\s*-?\s*)([\w.\-"' ]+?)(\s*[:=])/, '$1<span class="t-key">$2</span>$3').replace(/^(\s*)(\[[^\]]+\])/, '$1<span class="t-tag">$2</span>').replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span class="t-str">$1</span>').replace(/(:\s*|=\s*)(-?\d+\.?\d*)\b/g, '$1<span class="t-num">$2</span>'); (L.lit || []).forEach((w) => { e = e.replace(new RegExp(`(:\\s*|=\\s*)(${w})\\b`, 'g'), '$1<span class="t-lit">$2</span>'); }); return e + (com ? `<span class="t-com">${esc(com)}</span>` : ''); }).join('\n'); }
  function highlight(src, lang) { const L = LANGS[lang] || LANGS.plaintext; if (src.length > 300000) return esc(src); if (L.plain) return esc(src); if (L.markup) return hlMarkup(src); if (L.css) return hlCss(src); if (L.json) return hlJson(src); if (L.md) return hlMd(src); if (L.yaml) return hlYaml(src, L); return hlCode(src, L); }
  OS.codeHighlight = highlight; OS.codeLangOf = langOf;
  const mdHtml = (md) => { let inCode = false; return md.split('\n').map((l) => { if (/^```/.test(l)) { inCode = !inCode; return inCode ? '<pre><code>' : '</code></pre>'; } if (inCode) return esc(l); let h = esc(l).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>'); const m = /^(#{1,6}) (.*)/.exec(l); if (m) return `<h${m[1].length}>${h.replace(/^#+ /, '')}</h${m[1].length}>`; if (/^\s*[-*] /.test(l)) return `<li>${h.replace(/^\s*[-*] /, '')}</li>`; if (/^\s*>/.test(l)) return `<blockquote>${h.replace(/^\s*&gt;\s?/, '')}</blockquote>`; return l.trim() ? `<p>${h}</p>` : ''; }).join('\n'); };
  /* ======================= themes ======================= */
  const THEMES = {
    'Nimbus Dark': { bg: '#1e1f26', side: '#181920', act: '#14151b', fg: '#d4d7e0', fg2: '#8b90a0', sel: '#264f78', line: '#2a2c36', bar: '#6c8cff', kw: '#c586c0', str: '#ce9178', com: '#6a9955', num: '#b5cea8', fn: '#dcdcaa', type: '#4ec9b0', bi: '#9cdcfe', lit: '#569cd6', op: '#d4d4d4', tag: '#569cd6', attr: '#9cdcfe', prop: '#9cdcfe', key: '#9cdcfe', var: '#9cdcfe', head: '#569cd6', br: '#ffd700', dec: '#dcdcaa' },
    'Nimbus Light': { bg: '#ffffff', side: '#f3f3f3', act: '#e8e8e8', fg: '#1f2328', fg2: '#6e7781', sel: '#add6ff', line: '#f2f4f8', bar: '#2f6bff', kw: '#af00db', str: '#a31515', com: '#008000', num: '#098658', fn: '#795e26', type: '#267f99', bi: '#001080', lit: '#0000ff', op: '#000', tag: '#800000', attr: '#e50000', prop: '#e50000', key: '#0451a5', var: '#001080', head: '#0000ff', br: '#0431fa', dec: '#795e26' },
    Ember: { bg: '#272822', side: '#1e1f1c', act: '#191a17', fg: '#f8f8f2', fg2: '#90908a', sel: '#49483e', line: '#3e3d32', bar: '#fd971f', kw: '#f92672', str: '#e6db74', com: '#75715e', num: '#ae81ff', fn: '#a6e22e', type: '#66d9ef', bi: '#66d9ef', lit: '#ae81ff', op: '#f92672', tag: '#f92672', attr: '#a6e22e', prop: '#66d9ef', key: '#66d9ef', var: '#fd971f', head: '#a6e22e', br: '#f8f8f2', dec: '#a6e22e' },
    Solar: { bg: '#fdf6e3', side: '#eee8d5', act: '#e4ddc8', fg: '#586e75', fg2: '#93a1a1', sel: '#d6cfb6', line: '#f3ecd7', bar: '#268bd2', kw: '#859900', str: '#2aa198', com: '#93a1a1', num: '#d33682', fn: '#268bd2', type: '#b58900', bi: '#cb4b16', lit: '#6c71c4', op: '#657b83', tag: '#268bd2', attr: '#b58900', prop: '#268bd2', key: '#268bd2', var: '#cb4b16', head: '#cb4b16', br: '#657b83', dec: '#6c71c4' },
    Ocean: { bg: '#282c34', side: '#21252b', act: '#1b1f24', fg: '#abb2bf', fg2: '#6b717d', sel: '#3e4451', line: '#2c313c', bar: '#61afef', kw: '#c678dd', str: '#98c379', com: '#5c6370', num: '#d19a66', fn: '#61afef', type: '#e5c07b', bi: '#56b6c2', lit: '#d19a66', op: '#56b6c2', tag: '#e06c75', attr: '#d19a66', prop: '#e06c75', key: '#e06c75', var: '#e06c75', head: '#e06c75', br: '#abb2bf', dec: '#61afef' },
    'High Contrast': { bg: '#000000', side: '#000000', act: '#000000', fg: '#ffffff', fg2: '#cccccc', sel: '#0058aa', line: '#111', bar: '#f38518', kw: '#569cd6', str: '#ce9178', com: '#7ca668', num: '#b5cea8', fn: '#dcdcaa', type: '#4ec9b0', bi: '#9cdcfe', lit: '#569cd6', op: '#ffffff', tag: '#569cd6', attr: '#9cdcfe', prop: '#9cdcfe', key: '#9cdcfe', var: '#9cdcfe', head: '#569cd6', br: '#ffffff', dec: '#dcdcaa' },
  };
  const themeCss = (t) => Object.entries(t).map(([k, v]) => `--cd-${k}:${v}`).join(';');
  /* ======================= sample project ======================= */
  function seed() {
    const root = OS.home() + '/Projects/hello-world';
    const X = {
      'hello.c': `#include <stdio.h>\n\nint square(int x) {\n    return x * x;\n}\n\nint main(void) {\n    printf("Hello from C!\\n");\n    for (int i = 1; i <= 5; i++) {\n        printf("%d squared is %d\\n", i, square(i));\n    }\n    return 0;\n}\n`,
      'hello.cpp': `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    vector<string> planets = {"Mercury", "Venus", "Earth"};\n    for (const auto& p : planets) {\n        cout << "Hello, " << p << "!" << endl;\n    }\n    cout << "Total: " << planets.size() << endl;\n    return 0;\n}\n`,
      'Program.cs': `using System;\n\nclass Program {\n    static void Main(string[] args) {\n        string name = "Cirrus";\n        Console.WriteLine($"Hello from C#, {name}!");\n        for (int i = 0; i < 3; i++) {\n            Console.WriteLine("Line {0}", i + 1);\n        }\n    }\n}\n`,
      'hello.rb': `# Ruby\ndef greet(name)\n  "Hello, #{name}!"\nend\n\nputs greet("Ruby")\n[1, 2, 3].each do |n|\n  puts "#{n} x 10 = #{n * 10}"\nend\n`,
      'hello.php': `<?php\n$names = ["Ada", "Linus", "Grace"];\nforeach ($names as $name) {\n    echo "Hello, $name!\\n";\n}\necho "Count: " . count($names) . "\\n";\n`,
      'hello.lua': `-- Lua\nlocal fruits = {"apple", "banana", "cherry"}\nfor i, f in ipairs(fruits) do\n  print(i, f)\nend\nprint("Total: " .. #fruits)\n`,
      'main.kt': `fun main() {\n    val langs = listOf("Kotlin", "Java", "Scala")\n    for (l in langs) {\n        println("Hello, $l!")\n    }\n    for (i in 1..3) println("Count \${i * 2}")\n}\n`,
      'main.swift': `let names = ["Swift", "SwiftUI"]\nfor name in names {\n    print("Hello, \\(name)!")\n}\nfor i in 1...3 {\n    print("Number \\(i)")\n}\n`,
    };
    if (OS.fs.exists(root)) { if (!OS.store.get('code-seed2')) { OS.store.set('code-seed2', 1); Object.entries(X).forEach(([n, c]) => { const p = OS.fs.join(root, n); if (!OS.fs.exists(p)) OS.fs.write(p, c); }); } return root; }
    OS.store.set('code-seed2', 1);
    const F = {
      'README.md': `# Hello World 👋\n\nA tiny multi-language project for **Nimbus Code**.\n\n- Press **F5** (or the ▶ button) to run the current file\n- \`index.html\` opens a live preview\n- \`app.js\`, \`main.py\` and \`utils.ts\` run in the Output panel\n- \`script.sh\` runs in the integrated terminal\n\n> Tip: press **Ctrl+P** to quickly open files and **Ctrl+Shift+P** for all commands.\n`,
      'index.html': `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Hello from Nimbus Code</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="card">\n    <h1>Hello, world!</h1>\n    <p>Edit <code>index.html</code> and watch this preview update live.</p>\n    <button id="btn">Click me</button>\n    <p id="out"></p>\n  </main>\n  <script>\n    let n = 0;\n    document.getElementById('btn').onclick = () => {\n      document.getElementById('out').textContent = \`Clicked \${++n} time\${n > 1 ? 's' : ''}!\`;\n    };\n  </script>\n</body>\n</html>\n`,
      'style.css': `/* Styles for index.html */\nbody {\n  font-family: system-ui, sans-serif;\n  background: linear-gradient(135deg, #6c8cff, #b06cff);\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  margin: 0;\n}\n\n.card {\n  background: #fff;\n  padding: 32px 40px;\n  border-radius: 18px;\n  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);\n  text-align: center;\n}\n\nbutton {\n  font-size: 16px;\n  padding: 10px 20px;\n  border: 0;\n  border-radius: 10px;\n  background: #6c8cff;\n  color: white;\n  cursor: pointer;\n}\n`,
      'app.js': `// JavaScript — press F5 to run\nconst fruits = ['apple', 'banana', 'cherry'];\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('Nimbus'));\nfruits.forEach((f, i) => console.log(i + 1, f.toUpperCase()));\n\nconst squares = Array.from({ length: 8 }, (_, i) => i * i);\nconsole.log('Squares:', squares);\nconsole.log('Sum:', squares.reduce((a, b) => a + b, 0));\n`,
      'main.py': `# Python — press F5 to run\ndef fib(n):\n    a = 0\n    b = 1\n    result = []\n    for i in range(n):\n        result.append(a)\n        t = a + b\n        a = b\n        b = t\n    return result\n\nprint("Fibonacci:", fib(10))\n\nfor i in range(1, 6):\n    print(i, "squared is", i * i)\n`,
      'utils.ts': `// TypeScript — simple type annotations are stripped when running\ninterface User {\n  name: string;\n  age: number;\n}\n\nfunction describe(user: User): string {\n  return \`\${user.name} is \${user.age} years old\`;\n}\n\nconst users: User[] = [\n  { name: 'Ada', age: 36 },\n  { name: 'Linus', age: 54 },\n];\n\nusers.forEach((u) => console.log(describe(u)));\n`,
      'data.json': `{\n  "name": "hello-world",\n  "version": "1.0.0",\n  "languages": ["html", "css", "javascript", "python", "typescript"],\n  "awesome": true,\n  "stars": 42\n}\n`,
      'script.sh': `#!/bin/sh\n# Shell script — runs in the integrated terminal\necho "Hello from $USER on $(hostname)!"\necho "Files in this project:"\nls\nfor lang in html css js py; do\n  echo " - $lang"\ndone\n`,
      'hello.c': `#include <stdio.h>\n\n// C source: syntax highlighting & editing (compilers are not available in the browser)\nint main(void) {\n    for (int i = 1; i <= 3; i++) {\n        printf("Hello #%d\\n", i);\n    }\n    return 0;\n}\n`,
      'Main.java': `public class Main {\n    public static void main(String[] args) {\n        String[] langs = {"Java", "Kotlin", "Scala"};\n        for (String l : langs) {\n            System.out.println("Hello, " + l + "!");\n        }\n    }\n}\n`,
      'main.rs': `fn main() {\n    let names = vec!["Ferris", "Crab", "Rustacean"];\n    for (i, name) in names.iter().enumerate() {\n        println!("{}: Hello, {}!", i + 1, name);\n    }\n}\n`,
      'main.go': `package main\n\nimport "fmt"\n\nfunc main() {\n    for i := 1; i <= 3; i++ {\n        fmt.Printf("Hello, Gopher %d!\\n", i)\n    }\n}\n`,
      'query.sql': `-- SQL example\nSELECT name, COUNT(*) AS orders\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.created_at > '2024-01-01'\nGROUP BY name\nORDER BY orders DESC\nLIMIT 10;\n`,
      'config.yml': `# YAML config\napp:\n  name: hello-world\n  debug: true\n  port: 8080\nfeatures:\n  - preview\n  - terminal\n`,
    };
    Object.assign(F, X);
    OS.fs.mkdir(root, { p: true }); Object.entries(F).forEach(([n, c]) => OS.fs.write(OS.fs.join(root, n), c));
    return root;
  }
  /* ======================= app ======================= */
  OS.registerApp({
    id: 'code', name: 'Nimbus Code', icon: 'code', color: ['#2f80ed', '#1b4fb3'], cat: 'Development', w: 1180, h: 740, single: true, desc: 'Code editor', keywords: 'vscode visual studio code ide editor programming javascript python html',
    launch(win, args) {
      const set = Object.assign({ theme: 'Nimbus Dark', font: 13.5, tab: 2, wrap: false, auto: true, autosave: false, minimap: false, side: 240 }, OS.store.get('code-settings', {}));
      let root = args.folder || OS.store.get('code-root') || seed(); if (!OS.fs.isDir(root)) root = seed();
      let tabs = [], active = null, view = 'explorer', expanded = new Set(OS.store.get('code-exp', [])), panel = OS.store.get('code-panel', 'output'), panelOpen = false, sideOpen = !OS.isMobile(), preview = null;
      win.body.innerHTML = `<div class="cd" style="${themeCss(THEMES[set.theme] || THEMES['Nimbus Dark'])}">
        <div class="cd-act">${[['explorer', 'folder', 'Explorer (Ctrl+Shift+E)'], ['search', 'search', 'Search (Ctrl+Shift+F)'], ['run', 'play', 'Run'], ['ext', 'grid', 'Extensions'], ['settings', 'gear', 'Settings']].map(([v, i, t]) => `<button class="cd-ab" data-view="${v}" title="${t}">${gl(i)}</button>`).join('')}</div>
        <div class="cd-side"><div class="cd-sidehead"></div><div class="cd-sidebody"></div></div>
        <div class="cd-center">
          <div class="cd-tabbar"><div class="cd-tabs"></div><div class="cd-tacts"><button class="cd-tbtn run" data-a="run" title="Run (F5)">${gl('play')}<span>Run</span></button><button class="cd-tbtn" data-a="toggleterm" title="Toggle terminal (Ctrl+\`)">${gl('terminal')}</button></div></div><div class="cd-crumbs"></div>
          <div class="cd-split"><div class="cd-edwrap"><div class="cd-gutter"><div class="cd-gin"></div></div><div class="cd-code"><div class="cd-curline"></div><pre class="cd-hl"></pre><textarea class="cd-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea><div class="cd-ac" hidden></div></div><div class="cd-welcome"></div><div class="cd-find" hidden><input placeholder="Find" data-f="q"><input placeholder="Replace" data-f="r"><button class="ibtn" data-f="prev" title="Previous">${gl('up')}</button><button class="ibtn" data-f="next" title="Next (Enter)">${gl('down')}</button><button class="btn sm" data-f="rep">Replace</button><button class="btn sm" data-f="all">All</button><span data-f="n" class="small"></span><button class="ibtn" data-f="x">${gl('x')}</button></div></div><div class="cd-preview" hidden><div class="cd-phead"><span></span><button class="ibtn" data-a="closeprev">${gl('x')}</button></div><iframe sandbox="allow-scripts allow-modals allow-forms allow-popups"></iframe></div></div>
          <div class="cd-panel"><div class="cd-ptabs">${[['problems', 'Problems'], ['output', 'Output'], ['terminal', 'Terminal']].map(([v, l]) => `<button class="cd-ptab" data-p="${v}">${l}</button>`).join('')}<span class="spacer"></span><button class="ibtn" data-a="clearout" title="Clear">${gl('eraser')}</button><button class="ibtn" data-a="closepanel" title="Close panel">${gl('x')}</button></div><div class="cd-pbody"><div class="cd-out" data-pp="output"></div><div class="cd-probs" data-pp="problems"></div><div class="cd-term" data-pp="terminal"></div></div></div>
        </div>
        <div class="cd-status"><span data-s="branch">${gl('code')} main</span><span data-s="errs"></span><span class="spacer"></span><span data-s="pos"></span><span data-s="tab" class="hide-m"></span><span class="hide-m">UTF-8</span><span data-s="lang" class="cd-click"></span><span data-s="theme" class="cd-click hide-m">${gl('palette')}</span></div>
        <div class="cd-palette" hidden><input placeholder="Search files by name (type > for commands)"><div class="cd-plist"></div></div>
      </div>`;
      const $ = (s) => win.body.querySelector(s), ROOT = $('.cd'), ta = $('.cd-ta'), hl = $('.cd-hl'), gin = $('.cd-gin'), curline = $('.cd-curline'), ac = $('.cd-ac');
      const saveSet = () => OS.store.set('code-settings', set);
      const applySet = () => { ROOT.setAttribute('style', themeCss(THEMES[set.theme] || THEMES['Nimbus Dark'])); ROOT.style.setProperty('--cd-fs', set.font + 'px'); ROOT.style.setProperty('--cd-lh', Math.round(set.font * 1.5) + 'px'); ROOT.style.setProperty('--cd-sidew', set.side + 'px'); ROOT.classList.toggle('wrap', set.wrap); ta.wrap = set.wrap ? 'soft' : 'off'; ROOT.classList.toggle('side-closed', !sideOpen); ROOT.classList.toggle('panel-open', panelOpen); ROOT.classList.toggle('dark-theme', !['Nimbus Light', 'Solar'].includes(set.theme)); sync(); };
      const lh = () => Math.round(set.font * 1.5);
      let charW = 8; const measure = () => { const s = document.createElement('span'); s.textContent = 'x'.repeat(100); hl.appendChild(s); charW = s.getBoundingClientRect().width / 100 || 8; s.remove(); };
      /* ---------- tabs ---------- */
      const tabOf = (p) => tabs.find((t) => t.path === p);
      function openFile(p, opts = {}) {
        if (OS.fs.isDir(p)) { expanded.add(p); renderSide(); return; }
        let t = tabOf(p);
        if (!t) { let c = ''; try { c = OS.fs.read(p); } catch (e) { return OS.alert('Cannot open', e.message); } if (OS.isDataUrl(c)) { OS.desktop.openPath(p); return; } t = { path: p, name: OS.fs.basename(p), content: c, saved: c, lang: langOf(OS.fs.basename(p)), sel: [0, 0], scroll: 0 }; tabs.push(t); }
        activate(t); if (opts.line != null) gotoLine(opts.line, opts.col || 0, opts.len || 0);
        if (OS.isMobile() && sideOpen) { sideOpen = false; applySet(); }
      }
      function newUntitled(lang = 'plaintext', content = '') { let n = 1; while (tabs.some((t) => t.name === `Untitled-${n}`)) n++; const t = { path: null, name: `Untitled-${n}`, content, saved: null, lang, sel: [0, 0], scroll: 0 }; tabs.push(t); activate(t); }
      function stash() { if (!active) return; active.content = ta.value; active.sel = [ta.selectionStart, ta.selectionEnd]; active.scroll = ta.scrollTop; active.scrollL = ta.scrollLeft; }
      function activate(t) { stash(); active = t; ta.value = t.content; ta.setSelectionRange(...t.sel); ta.scrollTop = t.scroll; ta.scrollLeft = t.scrollL || 0; renderTabs(); sync(); updateStatus(); checkProblems(); refreshPreview(); setTimeout(() => ta.focus({ preventScroll: true }), 0); }
      const dirty = (t) => t.content !== t.saved;
      function renderTabs() {
        const host = $('.cd-tabs'); host.innerHTML = '';
        tabs.forEach((t) => { const el = OS.el(`<div class="cd-tab ${t === active ? 'on' : ''}" title="${esc(t.path || t.name)}"><i style="background:${LANGS[t.lang].color}"></i><span>${esc(t.name)}</span><button class="cd-tx ${dirty(t) ? 'dirty' : ''}">${gl('x')}</button></div>`); el.onclick = () => activate(t); el.onauxclick = (e) => { if (e.button === 1) closeTab(t); }; el.querySelector('.cd-tx').onclick = (e) => { e.stopPropagation(); closeTab(t); }; OS.onContext(el, (e, x, y) => OS.menu(x, y, [{ label: 'Close', action: () => closeTab(t) }, { label: 'Close others', action: () => tabs.filter((o) => o !== t).forEach((o) => closeTab(o, true)) }, { label: 'Close all', action: () => tabs.slice().forEach((o) => closeTab(o, true)) }, '-', { label: 'Copy path', icon: 'copy', disabled: !t.path, action: () => navigator.clipboard?.writeText(t.path) }, { label: 'Reveal in Files', icon: 'folder', disabled: !t.path, action: () => OS.wm.open('files', { path: OS.fs.dirname(t.path) }) }])); host.appendChild(el); });
        const has = !!active; $('.cd-edwrap').classList.toggle('empty', !has); $('.cd-welcome').hidden = has;
        if (!has) renderWelcome();
        $('.cd-crumbs').innerHTML = active ? (active.path ? OS.fs.pretty(active.path).split('/').filter(Boolean).map(esc).join(' <span>›</span> ') : esc(active.name)) : '';
        win.setTitle((active ? (dirty(active) ? '● ' : '') + active.name + ' — ' : '') + OS.fs.basename(root) + ' — Nimbus Code');
      }
      async function closeTab(t, force) {
        stash();
        if (dirty(t) && !force) { const r = await OS.dialog({ title: `Save changes to ${t.name}?`, message: "Your changes will be lost if you don't save them.", buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save', value: 's', primary: true }] }); if (r === 'c') return; if (r === 's' && !(await saveTab(t))) return; }
        const i = tabs.indexOf(t); tabs.splice(i, 1); if (active === t) { active = null; if (tabs.length) activate(tabs[Math.min(i, tabs.length - 1)]); else { ta.value = ''; renderTabs(); sync(); updateStatus(); refreshPreview(); } } else renderTabs();
      }
      async function saveTab(t = active, as) {
        if (!t) return false; if (t === active) stash();
        let p = t.path; if (!p || as) { p = await OS.pickFile({ mode: 'save', path: root, name: t.path ? t.name : t.name + (t.lang !== 'plaintext' ? '.' + LANGS[t.lang].ext[0] : '.txt') }); if (!p) return false; }
        if (t.lang === 'json' && set.formatOnSave) { try { t.content = JSON.stringify(JSON.parse(t.content), null, set.tab) + '\n'; if (t === active) ta.value = t.content; } catch (e) {} }
        try { OS.fs.write(p, t.content); t.path = p; t.name = OS.fs.basename(p); t.saved = t.content; if (!t.lang || t.lang === 'plaintext') t.lang = langOf(t.name); renderTabs(); renderSide(); updateStatus(); refreshPreview(); return true; } catch (e) { OS.alert('Save failed', e.message); return false; }
      }
      /* ---------- editor sync ---------- */
      let hlTimer = null;
      function sync() {
        if (!active) { hl.innerHTML = ''; gin.innerHTML = ''; return; }
        const v = ta.value; hl.innerHTML = highlight(v, active.lang) + '\n';
        const n = v.split('\n').length; let g = ''; const cl = curLine(); for (let i = 1; i <= n; i++) g += `<div class="${i === cl + 1 ? 'on' : ''} ${problemLines.has(i) ? 'err' : ''}">${i}</div>`; gin.innerHTML = g;
        scrollSync();
      }
      const curLine = () => ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
      function scrollSync() { hl.style.width = set.wrap ? ta.clientWidth + 'px' : ''; hl.style.transform = `translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`; gin.style.transform = `translateY(${-ta.scrollTop}px)`; if (!set.wrap) { curline.style.top = curLine() * lh() - ta.scrollTop + 8 + 'px'; curline.hidden = false; } else curline.hidden = true; }
      function onEdit() { if (!active) return; const was = dirty(active); active.content = ta.value; if (was !== dirty(active)) renderTabs(); clearTimeout(hlTimer); hlTimer = setTimeout(() => { sync(); checkProblemsSoon(); refreshPreviewSoon(); if (set.autosave && active.path) saveTab(active); }, ta.value.length > 30000 ? 120 : 0); updateStatus(); autocomplete(); }
      ta.addEventListener('input', onEdit);
      ta.addEventListener('scroll', scrollSync);
      ['keyup', 'click', 'select'].forEach((e) => ta.addEventListener(e, () => { updateStatus(); const cl = curLine(); gin.querySelectorAll('.on').forEach((x) => x.classList.remove('on')); gin.children[cl]?.classList.add('on'); scrollSync(); }));
      function updateStatus() { if (!active) { $('[data-s=pos]').textContent = ''; $('[data-s=lang]').textContent = ''; $('[data-s=tab]').textContent = ''; return; } const v = ta.value.slice(0, ta.selectionStart); const ln = v.split('\n'); const sel = ta.selectionEnd - ta.selectionStart; $('[data-s=pos]').textContent = `Ln ${ln.length}, Col ${ln[ln.length - 1].length + 1}${sel ? ` (${sel} selected)` : ''}`; $('[data-s=lang]').textContent = LANGS[active.lang].name; $('[data-s=tab]').textContent = `Spaces: ${set.tab}`; }
      const ins = (text) => document.execCommand('insertText', false, text);
      const indentOf = (line) => /^\s*/.exec(line)[0];
      const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
      ta.addEventListener('keydown', (e) => {
        const c = e.ctrlKey || e.metaKey; const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
        if (!ac.hidden) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); acMove(e.key === 'ArrowDown' ? 1 : -1); return; } if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); acAccept(); return; } if (e.key === 'Escape') { e.preventDefault(); ac.hidden = true; return; } }
        if (e.key === 'Tab') { e.preventDefault(); const tabS = ' '.repeat(set.tab); if (s !== en && v.slice(s, en).includes('\n') || e.shiftKey) { const ls = v.lastIndexOf('\n', s - 1) + 1; const block = v.slice(ls, en); const nb = e.shiftKey ? block.split('\n').map((l) => l.replace(new RegExp(`^ {1,${set.tab}}|^\\t`), '')).join('\n') : block.split('\n').map((l) => tabS + l).join('\n'); ta.setSelectionRange(ls, en); ins(nb); ta.setSelectionRange(ls, ls + nb.length); } else ins(tabS); return; }
        if (e.key === 'Enter' && !c) { e.preventDefault(); const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s); let ind = indentOf(line); const prev = line.trimEnd(); const next = v[en];
          const opener = /[{[(]$/.test(prev) || (active && active.lang === 'python' && /:$/.test(prev)) || (active && LANGS[active.lang].markup && /<([a-z][\w-]*)[^>]*>$/i.test(prev) && !/<\/|\/>$/.test(prev.slice(prev.lastIndexOf('<'))));
          if (opener && PAIRS[prev.slice(-1)] === next) { ins('\n' + ind + ' '.repeat(set.tab) + '\n' + ind); ta.setSelectionRange(s + 1 + ind.length + set.tab, s + 1 + ind.length + set.tab); }
          else ins('\n' + ind + (opener ? ' '.repeat(set.tab) : '')); onEdit(); return; }
        if (!c && !e.altKey && PAIRS[e.key] && active && !LANGS[active.lang].plain) { const sel = v.slice(s, en); if (sel) { e.preventDefault(); ins(e.key + sel + PAIRS[e.key]); ta.setSelectionRange(s + 1, s + 1 + sel.length); return; } const nx = v[s] || ''; if ((e.key === '"' || e.key === "'" || e.key === '`') && (/\w/.test(v[s - 1] || '') || nx === e.key)) { if (nx === e.key) { e.preventDefault(); ta.setSelectionRange(s + 1, s + 1); } return; } if (!nx || /[\s)\]};,]/.test(nx)) { e.preventDefault(); ins(e.key + PAIRS[e.key]); ta.setSelectionRange(s + 1, s + 1); return; } }
        if (!c && [')', ']', '}'].includes(e.key) && v[s] === e.key && s === en) { e.preventDefault(); ta.setSelectionRange(s + 1, s + 1); return; }
        if (e.key === 'Backspace' && s === en && PAIRS[v[s - 1]] && PAIRS[v[s - 1]] === v[s]) { e.preventDefault(); ta.setSelectionRange(s - 1, s + 1); ins(''); return; }
        if (c && e.key === '/') { e.preventDefault(); toggleComment(); return; }
        if (c && e.shiftKey && (e.key === 'K' || e.key === 'k')) { e.preventDefault(); const [a, b] = lineRange(); ta.setSelectionRange(a, Math.min(v.length, b + 1)); ins(''); return; }
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveLines(e.key === 'ArrowUp' ? -1 : 1, e.shiftKey); return; }
        if (c && e.key === 'd') { e.preventDefault(); selectNext(); return; }
        if (c && e.key === ']') { e.preventDefault(); const [a, b] = lineRange(); ta.setSelectionRange(a, b); ins(v.slice(a, b).split('\n').map((l) => ' '.repeat(set.tab) + l).join('\n')); return; }
        if (c && e.key === '[') { e.preventDefault(); const [a, b] = lineRange(); ta.setSelectionRange(a, b); ins(v.slice(a, b).split('\n').map((l) => l.replace(new RegExp(`^ {1,${set.tab}}`), '')).join('\n')); return; }
        if (c && e.key === ' ') { e.preventDefault(); autocomplete(true); }
      });
      function lineRange() { const v = ta.value; const a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1; let b = v.indexOf('\n', Math.max(ta.selectionEnd - (ta.selectionEnd > ta.selectionStart && v[ta.selectionEnd - 1] === '\n' ? 1 : 0), ta.selectionStart)); if (b < 0) b = v.length; return [a, b]; }
      function toggleComment() { if (!active) return; const L = LANGS[active.lang]; const [a, b] = lineRange(); const lines = ta.value.slice(a, b).split('\n'); if (L.c.line) { const t = L.c.line; const all = lines.filter((l) => l.trim()).every((l) => l.trimStart().startsWith(t)); const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => indentOf(l).length)); const out = lines.map((l) => (!l.trim() ? l : all ? l.replace(new RegExp(`^(\\s*)${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} ?`), '$1') : l.slice(0, ind) + t + ' ' + l.slice(ind))).join('\n'); ta.setSelectionRange(a, b); ins(out); ta.setSelectionRange(a, a + out.length); } else if (L.c.block) { const [o, cl] = L.c.block; const txt = ta.value.slice(a, b); const out = txt.trim().startsWith(o) ? txt.replace(o + ' ', '').replace(o, '').replace(' ' + cl, '').replace(cl, '') : `${o} ${txt} ${cl}`; ta.setSelectionRange(a, b); ins(out); } onEdit(); }
      function moveLines(dir, dup) { const v = ta.value; const [a, b] = lineRange(); const block = v.slice(a, b); if (dup) { ta.setSelectionRange(b, b); ins('\n' + block); ta.setSelectionRange(b + 1, b + 1 + block.length); return; } if (dir < 0 && a === 0) return; if (dir > 0 && b >= v.length) return; if (dir < 0) { const pa = v.lastIndexOf('\n', a - 2) + 1; const prev = v.slice(pa, a - 1); ta.setSelectionRange(pa, b); ins(block + '\n' + prev); ta.setSelectionRange(pa, pa + block.length); } else { let nb = v.indexOf('\n', b + 1); if (nb < 0) nb = v.length; const next = v.slice(b + 1, nb); ta.setSelectionRange(a, nb); ins(next + '\n' + block); const st = a + next.length + 1; ta.setSelectionRange(st, st + block.length); } }
      function selectNext() { const v = ta.value; let s = ta.selectionStart, e = ta.selectionEnd; if (s === e) { while (s > 0 && /\w/.test(v[s - 1])) s--; while (e < v.length && /\w/.test(v[e])) e++; ta.setSelectionRange(s, e); return; } const w = v.slice(s, e); let i = v.indexOf(w, e); if (i < 0) i = v.indexOf(w); if (i >= 0) { ta.setSelectionRange(i, i + w.length); revealSel(); } }
      function revealSel() { const line = ta.value.slice(0, ta.selectionStart).split('\n').length - 1; const y = line * lh(); if (y < ta.scrollTop || y > ta.scrollTop + ta.clientHeight - lh() * 2) ta.scrollTop = y - ta.clientHeight / 3; scrollSync(); updateStatus(); }
      function gotoLine(l, col = 0, len = 0) { const lines = ta.value.split('\n'); l = OS.clamp(l, 1, lines.length); let pos = 0; for (let i = 0; i < l - 1; i++) pos += lines[i].length + 1; pos += Math.min(col, lines[l - 1].length); ta.focus(); ta.setSelectionRange(pos, pos + len); revealSel(); }
      /* ---------- autocomplete ---------- */
      let acItems = [], acSel = 0, acStart = 0;
      function autocomplete(force) {
        if (!active || !set.auto || LANGS[active.lang].plain) { ac.hidden = true; return; }
        const v = ta.value, s = ta.selectionStart; if (s !== ta.selectionEnd) { ac.hidden = true; return; }
        let a = s; while (a > 0 && /[\w$]/.test(v[a - 1])) a--; const pre = v.slice(a, s);
        if ((!force && pre.length < 2) || /\d/.test(pre[0] || '')) { ac.hidden = true; return; }
        const L = LANGS[active.lang]; const words = new Set([...(L.kw || []), ...(L.bi || []), ...(L.types || []), ...(L.lit || [])]); (v.match(/[A-Za-z_$][\w$]{2,}/g) || []).forEach((w) => words.add(w));
        acItems = [...words].filter((w) => w !== pre && w.toLowerCase().startsWith(pre.toLowerCase())).sort((x, y) => x.length - y.length).slice(0, 8);
        if (!acItems.length) { ac.hidden = true; return; }
        acStart = a; acSel = 0; const line = v.slice(0, s).split('\n'); const col = line[line.length - 1].length;
        ac.style.left = Math.max(0, 10 + (col - pre.length) * charW - ta.scrollLeft) + 'px'; ac.style.top = line.length * lh() - ta.scrollTop + 10 + 'px';
        ac.innerHTML = acItems.map((w, i) => `<div class="${i === 0 ? 'on' : ''}" data-i="${i}"><i class="t-${(L.kw || []).includes(w) ? 'kw' : (L.bi || []).includes(w) ? 'bi' : (L.types || []).includes(w) ? 'type' : 'var'}">${(L.kw || []).includes(w) ? '⌘' : 'ab'}</i>${esc(w)}</div>`).join(''); ac.hidden = false;
        ac.querySelectorAll('[data-i]').forEach((d) => d.addEventListener('pointerdown', (e) => { e.preventDefault(); acSel = +d.dataset.i; acAccept(); }));
      }
      const acMove = (d) => { acSel = (acSel + d + acItems.length) % acItems.length; ac.querySelectorAll('[data-i]').forEach((x, i) => x.classList.toggle('on', i === acSel)); };
      const acAccept = () => { const w = acItems[acSel]; ac.hidden = true; ta.setSelectionRange(acStart, ta.selectionStart); ins(w); onEdit(); ac.hidden = true; };
      ta.addEventListener('blur', () => setTimeout(() => (ac.hidden = true), 150));
      /* ---------- find ---------- */
      const fb = $('.cd-find'), fq = fb.querySelector('[data-f=q]'), fr = fb.querySelector('[data-f=r]');
      const openFind = (rep) => { if (!active) return; fb.hidden = false; fb.classList.toggle('rep', !!rep); const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd); if (sel && !sel.includes('\n')) fq.value = sel; fq.focus(); fq.select(); countFind(); };
      const countFind = () => { const q = fq.value; fb.querySelector('[data-f=n]').textContent = q ? `${ta.value.split(q).length - 1} results` : ''; };
      const findStep = (d) => { const q = fq.value; if (!q) return; const v = ta.value; let i = d > 0 ? v.indexOf(q, ta.selectionEnd) : v.lastIndexOf(q, ta.selectionStart - 1); if (i < 0) i = d > 0 ? v.indexOf(q) : v.lastIndexOf(q); if (i < 0) return; ta.setSelectionRange(i, i + q.length); revealSel(); };
      fq.oninput = countFind; fq.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); findStep(e.shiftKey ? -1 : 1); } if (e.key === 'Escape') { fb.hidden = true; ta.focus(); } };
      fb.querySelector('[data-f=next]').onclick = () => findStep(1); fb.querySelector('[data-f=prev]').onclick = () => findStep(-1);
      fb.querySelector('[data-f=rep]').onclick = () => { if (ta.value.slice(ta.selectionStart, ta.selectionEnd) === fq.value) { ta.focus(); ins(fr.value); onEdit(); } findStep(1); };
      fb.querySelector('[data-f=all]').onclick = () => { if (!fq.value) return; ta.focus(); ta.setSelectionRange(0, ta.value.length); ins(ta.value.split(fq.value).join(fr.value)); onEdit(); countFind(); };
      fb.querySelector('[data-f=x]').onclick = () => { fb.hidden = true; ta.focus(); };
      /* ---------- problems ---------- */
      let problems = [], problemLines = new Set(), pT = null;
      const checkProblemsSoon = () => { clearTimeout(pT); pT = setTimeout(checkProblems, 500); };
      function checkProblems() {
        problems = []; problemLines = new Set();
        if (active) { const v = ta.value;
          if (active.lang === 'json' && v.trim()) { try { JSON.parse(v); } catch (e) { const m = /position (\d+)/.exec(e.message) || /line (\d+)/.exec(e.message); let line = 1; if (m) line = /line/.test(m[0]) ? +m[1] : v.slice(0, +m[1]).split('\n').length; problems.push({ line, msg: e.message, sev: 'error' }); } }
          if (active.lang === 'javascript') { try { new Function(v); } catch (e) { if (e instanceof SyntaxError && !/import|export|await/.test(e.message)) problems.push({ line: e.lineNumber ? e.lineNumber - 2 : guessLine(v, e), msg: e.message, sev: 'error' }); } }
          const bal = { '(': ')', '[': ']', '{': '}' }; if (!LANGS[active.lang].plain && !LANGS[active.lang].md && active.lang !== 'html') { const st = []; const stripped = v.replace(/\/\*[\s\S]*?\*\/|\/\/.*|#.*|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, (m) => m.replace(/[^\n]/g, ' ')); let ln = 1; for (const ch of stripped) { if (ch === '\n') ln++; else if (bal[ch]) st.push([ch, ln]); else if (Object.values(bal).includes(ch)) { const t = st.pop(); if (!t || bal[t[0]] !== ch) { problems.push({ line: ln, msg: `Unexpected '${ch}'`, sev: 'error' }); break; } } } if (st.length && !problems.length) problems.push({ line: st[st.length - 1][1], msg: `Unclosed '${st[st.length - 1][0]}'`, sev: 'warning' }); }
          problems.forEach((p) => problemLines.add(p.line)); }
        const e = problems.length; $('[data-s=errs]').innerHTML = `${gl('x')} ${problems.filter((p) => p.sev === 'error').length}  ⚠ ${problems.filter((p) => p.sev !== 'error').length}`; void e;
        $('.cd-probs').innerHTML = problems.length ? problems.map((p) => `<div class="cd-prob" data-l="${p.line}"><b class="${p.sev}">${p.sev === 'error' ? '✖' : '⚠'}</b> ${esc(p.msg)} <span class="muted">${esc(active.name)} [Ln ${p.line}]</span></div>`).join('') : '<div class="muted small" style="padding:8px">No problems have been detected in the current file.</div>';
        $('.cd-probs').querySelectorAll('[data-l]').forEach((d) => (d.onclick = () => gotoLine(+d.dataset.l)));
        gin.querySelectorAll('div').forEach((d, i) => d.classList.toggle('err', problemLines.has(i + 1)));
      }
      const guessLine = (v, e) => { const lines = v.split('\n'); for (let i = 1; i <= lines.length; i++) { try { new Function(lines.slice(0, i).join('\n') + '\n}}}}}}}}'); } catch (er) { if (er.message !== e.message && !/Unexpected token '}'|Unexpected end/.test(er.message)) continue; if (er.message === e.message) return i; } } return 1; };
      /* ---------- run & preview ---------- */
      const out = $('.cd-out');
      const outWrite = (t, cls = '') => { const d = document.createElement('div'); d.className = 'cd-ol ' + cls; d.textContent = t; out.appendChild(d); out.scrollTop = out.scrollHeight; };
      function showPanel(p, noFocus) { panel = p; panelOpen = true; OS.store.set('code-panel', p); win.body.querySelectorAll('.cd-ptab').forEach((b) => b.classList.toggle('on', b.dataset.p === p)); win.body.querySelectorAll('[data-pp]').forEach((d) => (d.hidden = d.dataset.pp !== p)); applySet(); if (p === 'terminal') ensureTerm().then(() => { if (!noFocus) setTimeout(() => $('.cd-term .inl input')?.focus(), 60); }); }
      const stripTS = (src) => src.replace(/^\s*(export\s+)?interface\s+\w+[^{]*\{[\s\S]*?\n\}\s*$/gm, '').replace(/^\s*(export\s+)?type\s+\w+\s*=[^;]+;\s*$/gm, '').replace(/\b(public|private|protected|readonly)\s+/g, '').replace(/(\w|\))\s*:\s*[A-Za-z_][\w<>\[\]|&., ]*?(\[\])?(?=\s*[,)=;{]|\s*=>)/g, '$1').replace(/\bas\s+[A-Za-z_][\w<>\[\]]*/g, '').replace(/function\s+(\w+)\s*<[^>]+>/g, 'function $1').replace(/!\./g, '.');
      const RUNCMD = { javascript: (f) => `node ${f}`, typescript: (f) => `ts-node ${f}`, python: (f) => `python3 ${f}`, shell: (f) => `bash ${f}`, c: (f, b) => `gcc ${f} -o ${b} && ./${b}`, cpp: (f, b) => `g++ ${f} -o ${b} && ./${b}`, java: (f) => `java ${f}`, csharp: (f, b) => `csc ${f} && mono ${b}.exe`, go: (f) => `go run ${f}`, rust: (f, b) => `rustc ${f} && ./${b}`, kotlin: (f, b) => `kotlinc ${f} -include-runtime -d ${b}.jar && java -jar ${b}.jar`, swift: (f) => `swift ${f}`, php: (f) => `php ${f}`, ruby: (f) => `ruby ${f}`, lua: (f) => `lua ${f}`, sql: (f) => `sqlite3 :memory: < ${f}` };
      const q = (x) => (/^[\w.@+-]+$/.test(x) ? x : `"${x.replace(/(["\\$`])/g, '\\$1')}"`);
      async function run() {
        if (!active) { OS.notify('Nothing to run', 'Open a file first.', { app: 'code' }); return; }
        stash(); if (dirty(active) && active.path) await saveTab(active);
        const L = active.lang, src = ta.value;
        if (L === 'html' || L === 'markdown' || L === 'css') { openPreview(); return; }
        if (L === 'json' || !RUNCMD[L]) {
          showPanel('output'); out.innerHTML = ''; outWrite(`▶ ${active.name} (${LANGS[L].name}) · ${new Date().toLocaleTimeString()}`, 'cd-run');
          if (L === 'json') { try { const o = JSON.parse(src); outWrite('✔ Valid JSON: ' + (Array.isArray(o) ? `array with ${o.length} items` : `object with ${Object.keys(o).length} keys`), 'ok'); } catch (e) { outWrite('✖ ' + e.message, 'err'); } return; }
          outWrite(`ℹ ${LANGS[L].name} is a data/config format — nothing to run. Syntax highlighting and checks are available.`, 'warn'); return;
        }
        let path = active.path;
        if (!path) { const dir = '/tmp/nimbus'; OS.fs.mkdir(dir, { p: true }); const ext = (LANGS[L].ext || ['txt'])[0]; path = OS.fs.join(dir, /\.\w+$/.test(active.name) ? active.name : `${active.name.replace(/\W+/g, '_')}.${ext}`); OS.fs.write(path, src); }
        const name = OS.fs.basename(path), base = name.replace(/\.[^.]+$/, '');
        showPanel('terminal', true); await ensureTerm();
        setTimeout(() => { termRun(`cd ${q(OS.fs.dirname(path))} && ${RUNCMD[L](q(name), q(base))}`); setTimeout(() => $('.cd-term .inl input')?.focus(), 80); }, 120);
      }
      function openPreview() { if (!active) return; preview = { tab: active }; $('.cd-preview').hidden = false; ROOT.classList.add('previewing'); refreshPreview(); }
      let pvT = null; const refreshPreviewSoon = () => { clearTimeout(pvT); pvT = setTimeout(refreshPreview, 400); };
      function refreshPreview() {
        if (!preview) return; const pv = $('.cd-preview'); let t = preview.tab; if (!tabs.includes(t)) { preview = null; pv.hidden = true; ROOT.classList.remove('previewing'); return; }
        if (t === active) stash();
        let html; const L = t.lang;
        if (L === 'markdown') html = `<!doctype html><meta charset="utf-8"><style>body{font-family:system-ui;max-width:760px;margin:0 auto;padding:20px;line-height:1.6;color:#222}code{background:#f0f0f5;padding:2px 5px;border-radius:5px}pre{background:#f4f4f8;padding:12px;border-radius:8px;overflow:auto}blockquote{border-left:4px solid #ccc;margin:0;padding-left:14px;color:#555}</style>${mdHtml(t.content)}`;
        else if (L === 'css') { const htmlTab = tabs.find((x) => x.lang === 'html'); html = htmlTab ? htmlTab.content : `<h1>Heading</h1><p>Paragraph text with <a href="#">a link</a>.</p><button>Button</button><div class="card">.card</div>`; html = `<style>${t.content}</style>` + html; }
        else { html = t.content; if (t.path) { html = html.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (m, href) => { try { return `<style>${OS.fs.read(OS.fs.norm(href, OS.fs.dirname(t.path)))}</style>`; } catch (e) { return m; } }).replace(/<script([^>]*)src=["']([^"']+\.js)["']([^>]*)><\/script>/gi, (m, a, src, b) => { try { return `<script${a}${b}>${OS.fs.read(OS.fs.norm(src, OS.fs.dirname(t.path))).replace(/<\/script/gi, '<\\/script')}<\/script>`; } catch (e) { return m; } }); } }
        pv.querySelector('iframe').srcdoc = html; pv.querySelector('.cd-phead span').textContent = 'Preview · ' + t.name;
      }
      $('[data-a=closeprev]').onclick = () => { preview = null; $('.cd-preview').hidden = true; ROOT.classList.remove('previewing'); };
      /* ---------- integrated terminal ---------- */
      let termWin = null, termReady = null;
      function ensureTerm() {
        if (termReady) return termReady;
        termReady = new Promise((res) => {
          const host = $('.cd-term'); host.innerHTML = ''; const closers = [];
          termWin = { id: win.id + '-t', body: host, realWin: win, title: '', _close: closers, onClose: (f) => closers.push(f), setTitle() {}, close: () => { closers.forEach((f) => f()); termReady = null; termWin = null; host.innerHTML = '<div class="muted small" style="padding:10px">Terminal closed. <a href="#" data-new>New terminal</a></div>'; host.querySelector('[data-new]').onclick = (e) => { e.preventDefault(); ensureTerm(); }; }, focus() {}, isActive: () => true };
          OS.apps.terminal.launch(termWin, { cwd: root });
          win.onClose(() => closers.forEach((f) => f()));
          setTimeout(() => res(termWin), 50);
        });
        return termReady;
      }
      function termRun(cmd) { const inp = $('.cd-term .inl input'); if (!inp) return; inp.value = cmd; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
      /* ---------- sidebar views ---------- */
      function renderSide() {
        win.body.querySelectorAll('.cd-ab').forEach((b) => b.classList.toggle('on', b.dataset.view === view && sideOpen));
        const head = $('.cd-sidehead'), body = $('.cd-sidebody');
        if (view === 'explorer') {
          head.innerHTML = `<span>EXPLORER</span><span class="spacer"></span><button class="ibtn" data-x="newf" title="New file">${gl('plus')}</button><button class="ibtn" data-x="newd" title="New folder">${gl('folder')}</button><button class="ibtn" data-x="refresh" title="Refresh">${gl('refresh')}</button><button class="ibtn" data-x="open" title="Open folder">${gl('external')}</button>`;
          const tree = (dir, depth) => { let items = []; try { items = OS.fs.ls(dir).filter((x) => x.name !== '.git'); } catch (e) {} return items.map((it) => { const isD = it.type === 'dir'; const open = expanded.has(it.path); return `<div class="cd-node ${active && active.path === it.path ? 'on' : ''}" data-p="${esc(it.path)}" data-d="${isD ? 1 : 0}" style="padding-left:${8 + depth * 14}px">${isD ? `<span class="cd-chev ${open ? 'open' : ''}">${gl('right')}</span>` : `<i style="background:${LANGS[langOf(it.name)].color}"></i>`}<span>${esc(it.name)}</span>${tabs.some((t) => t.path === it.path && dirty(t)) ? '<b class="cd-dot">●</b>' : ''}</div>${isD && open ? tree(it.path, depth + 1) : ''}`; }).join(''); };
          body.innerHTML = `<div class="cd-root"><span class="cd-chev open">${gl('right')}</span>${esc(OS.fs.basename(root).toUpperCase())}</div>${tree(root, 0)}`;
          body.querySelectorAll('.cd-node').forEach((n) => { n.onclick = () => { if (n.dataset.d === '1') { expanded.has(n.dataset.p) ? expanded.delete(n.dataset.p) : expanded.add(n.dataset.p); OS.store.set('code-exp', [...expanded]); renderSide(); } else openFile(n.dataset.p); }; OS.onContext(n, (e, x, y) => nodeMenu(n.dataset.p, n.dataset.d === '1', x, y)); });
          OS.onContext(body, (e, x, y) => { if (!e.target.closest('.cd-node')) nodeMenu(root, true, x, y); });
          const H = (k, f) => (head.querySelector(`[data-x=${k}]`).onclick = f);
          H('newf', () => newEntry(root, false)); H('newd', () => newEntry(root, true)); H('refresh', renderSide);
          H('open', async () => { const p = await OS.pickFile({ mode: 'dir', path: OS.home() }); if (p) { root = p; OS.store.set('code-root', root); renderSide(); renderWelcome(); } });
        } else if (view === 'search') {
          head.innerHTML = '<span>SEARCH</span>';
          body.innerHTML = `<div class="cd-search"><input class="cd-in" placeholder="Search in ${esc(OS.fs.basename(root))}" data-q><input class="cd-in" placeholder="Replace" data-r><label class="small"><input type="checkbox" data-cs> Match case</label><div class="cd-results"></div></div>`;
          const q = body.querySelector('[data-q]'), res = body.querySelector('.cd-results'); let t = null;
          const doSearch = () => { const s = q.value; if (!s) { res.innerHTML = ''; return; } const cs = body.querySelector('[data-cs]').checked; const files = OS.fs.find(root, (n, nd, p) => nd.t === 'f' && !p.includes('/.git/'), 400); let total = 0; res.innerHTML = files.map((p) => { let c; try { c = OS.fs.read(p); } catch (e) { return ''; } if (OS.isDataUrl(c)) return ''; const hits = []; c.split('\n').forEach((l, i) => { const idx = cs ? l.indexOf(s) : l.toLowerCase().indexOf(s.toLowerCase()); if (idx >= 0 && hits.length < 50) hits.push([i + 1, idx, l]); }); if (!hits.length) return ''; total += hits.length; return `<div class="cd-rfile">${esc(OS.fs.basename(p))} <small>${hits.length}</small></div>` + hits.map(([ln, idx, l]) => `<div class="cd-rhit" data-p="${esc(p)}" data-l="${ln}" data-c="${idx}">${esc(l.slice(Math.max(0, idx - 20), idx))}<mark>${esc(l.substr(idx, s.length))}</mark>${esc(l.slice(idx + s.length, idx + s.length + 40))}</div>`).join(''); }).join('') || '<div class="muted small" style="padding:8px">No results</div>'; if (total) res.insertAdjacentHTML('afterbegin', `<div class="small muted" style="padding:4px 8px">${total} results <button class="btn sm" data-ra>Replace all</button></div>`); res.querySelectorAll('.cd-rhit').forEach((h) => (h.onclick = () => openFile(h.dataset.p, { line: +h.dataset.l, col: +h.dataset.c, len: s.length }))); const ra = res.querySelector('[data-ra]'); if (ra) ra.onclick = async () => { const r = body.querySelector('[data-r]').value; if (!(await OS.confirm('Replace all?', `Replace ${total} occurrences of “${s}” with “${r}” in ${OS.fs.basename(root)}?`, 'Replace', true))) return; files.forEach((p) => { try { const c = OS.fs.read(p); if (OS.isDataUrl(c)) return; const n = cs ? c.split(s).join(r) : c.replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), r); if (n !== c) { OS.fs.write(p, n); const tt = tabOf(p); if (tt) { tt.content = tt.saved = n; if (tt === active) { ta.value = n; sync(); } } } } catch (e) {} }); doSearch(); }; };
          q.oninput = () => { clearTimeout(t); t = setTimeout(doSearch, 250); }; body.querySelector('[data-cs]').onchange = doSearch; setTimeout(() => q.focus(), 30);
        } else if (view === 'run') {
          head.innerHTML = '<span>RUN AND DEBUG</span>';
          body.innerHTML = `<div class="pad col"><button class="btn primary" data-r="run">${gl('play')}Run current file (F5)</button><button class="btn" data-r="preview">${gl('eye')}Open preview</button><button class="btn" data-r="term">${gl('terminal')}New terminal</button><div class="small muted">Run support (integrated terminal):<br>• JavaScript, TypeScript, Shell — run locally<br>• Python — real Python 3 (Pyodide) online, mini-Python offline<br>• C, C++, Java, C#, Go, Rust, Kotlin, Swift, PHP, Ruby, Lua, Perl, SQL — real compilers in the cloud when online; simple programs also run offline<br>• HTML, CSS, Markdown — live preview<br>• JSON — validation</div></div>`;
          body.querySelector('[data-r=run]').onclick = run; body.querySelector('[data-r=preview]').onclick = openPreview; body.querySelector('[data-r=term]').onclick = () => showPanel('terminal');
        } else if (view === 'ext') {
          head.innerHTML = '<span>EXTENSIONS</span>';
          body.innerHTML = `<div class="cd-exts"><div class="cd-exth">INSTALLED · LANGUAGES</div>${Object.entries(LANGS).map(([k, L]) => `<div class="cd-ext"><i style="background:${L.color}">${esc(L.name.slice(0, 2))}</i><div><b>${esc(L.name)}</b><small>Syntax highlighting${['javascript', 'typescript', 'python', 'shell'].includes(k) ? ', run' : ['html', 'css', 'markdown'].includes(k) ? ', preview' : k === 'json' ? ', validation' : ''} · .${L.ext.join(' .')}</small></div></div>`).join('')}<div class="cd-exth">COLOR THEMES</div>${Object.keys(THEMES).map((t) => `<div class="cd-ext cd-theme ${t === set.theme ? 'on' : ''}" data-t="${esc(t)}"><i style="background:${THEMES[t].bg};border:2px solid ${THEMES[t].kw}"></i><div><b>${esc(t)}</b><small>${t === set.theme ? 'Active' : 'Click to apply'}</small></div></div>`).join('')}</div>`;
          body.querySelectorAll('[data-t]').forEach((d) => (d.onclick = () => { set.theme = d.dataset.t; saveSet(); applySet(); renderSide(); }));
        } else if (view === 'settings') {
          head.innerHTML = '<span>SETTINGS</span>';
          body.innerHTML = `<div class="pad col cd-sets"><label>Color theme<select class="cd-in" data-k="theme">${Object.keys(THEMES).map((t) => `<option ${t === set.theme ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>Font size<input class="cd-in" type="number" min="9" max="28" data-k="font" value="${set.font}"></label><label>Tab size<select class="cd-in" data-k="tab">${[2, 4, 8].map((n) => `<option ${n === set.tab ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="row"><input type="checkbox" data-k="wrap" ${set.wrap ? 'checked' : ''}> Word wrap</label><label class="row"><input type="checkbox" data-k="auto" ${set.auto ? 'checked' : ''}> Suggestions while typing</label><label class="row"><input type="checkbox" data-k="autosave" ${set.autosave ? 'checked' : ''}> Auto save</label><label class="row"><input type="checkbox" data-k="formatOnSave" ${set.formatOnSave ? 'checked' : ''}> Format JSON on save</label></div>`;
          body.querySelectorAll('[data-k]').forEach((i) => (i.onchange = () => { const k = i.dataset.k; set[k] = i.type === 'checkbox' ? i.checked : i.type === 'number' || k === 'tab' ? +i.value : i.value; saveSet(); applySet(); measure(); sync(); }));
        }
      }
      async function newEntry(dir, isDir) { const n = await OS.prompt(isDir ? 'New folder' : 'New file', `In ${OS.fs.pretty(dir)}`, isDir ? 'folder' : 'untitled.js'); if (!n) return; const p = OS.fs.join(dir, n); if (OS.fs.exists(p)) return OS.alert('Already exists', n); try { if (isDir) { OS.fs.mkdir(p, { p: true }); expanded.add(p); } else { OS.fs.mkdir(OS.fs.dirname(p), { p: true }); OS.fs.write(p, ''); expanded.add(dir); openFile(p); } renderSide(); } catch (e) { OS.alert('Error', e.message); } }
      function nodeMenu(p, isDir, x, y) {
        OS.menu(x, y, [
          isDir && { label: 'New file…', icon: 'plus', action: () => newEntry(p, false) }, isDir && { label: 'New folder…', icon: 'folder', action: () => newEntry(p, true) },
          !isDir && { label: 'Open', icon: 'external', action: () => openFile(p) }, !isDir && /\.(html?|md|css)$/i.test(p) && { label: 'Open preview', icon: 'eye', action: () => { openFile(p); openPreview(); } },
          { label: 'Open in integrated terminal', icon: 'terminal', action: async () => { showPanel('terminal'); await ensureTerm(); setTimeout(() => termRun(`cd "${isDir ? p : OS.fs.dirname(p)}"`), 100); } },
          '-', p !== root && { label: 'Rename…', icon: 'edit', action: async () => { const n = await OS.prompt('Rename', '', OS.fs.basename(p)); if (n && n !== OS.fs.basename(p)) { const np = OS.fs.join(OS.fs.dirname(p), n); OS.fs.mv(p, np); const t = tabOf(p); if (t) { t.path = np; t.name = n; t.lang = langOf(n); } renderTabs(); renderSide(); } } },
          p !== root && { label: 'Delete', icon: 'trash', danger: true, action: async () => { if (await OS.confirm(`Delete ${OS.fs.basename(p)}?`, 'It will be moved to the Trash.', 'Move to Trash', true)) { OS.fs.trash(p); const t = tabOf(p); if (t) closeTab(t, true); renderSide(); } } },
          { label: 'Copy path', icon: 'copy', action: () => navigator.clipboard?.writeText(p) }, { label: 'Reveal in Files', icon: 'folder', action: () => OS.wm.open('files', { path: isDir ? p : OS.fs.dirname(p) }) },
        ]);
      }
      function renderWelcome() {
        const recent = OS.fs.find(root, (n, nd, p) => nd.t === 'f' && !p.includes('/.git/'), 200).map((p) => ({ p, m: OS.fs.stat(p).mtime })).sort((a, b) => b.m - a.m).slice(0, 6);
        $('.cd-welcome').innerHTML = `<div class="cd-wel"><div class="cd-logo">${OS.appIcon('code', 72)}</div><h1>Nimbus Code</h1><p class="muted">Editing evolved, in your browser</p><div class="cd-wcols"><div><h3>Start</h3><a data-w="new">${gl('plus')} New file…</a><a data-w="open">${gl('folder')} Open folder…</a><a data-w="term">${gl('terminal')} Open terminal</a><a data-w="pal">${gl('search')} Go to file… <kbd>Ctrl+P</kbd></a></div><div><h3>Recent in ${esc(OS.fs.basename(root))}</h3>${recent.map((r) => `<a data-f="${esc(r.p)}"><i style="background:${LANGS[langOf(r.p)].color}"></i>${esc(OS.fs.basename(r.p))}</a>`).join('') || '<span class="muted small">No files yet</span>'}</div></div><div class="cd-keys small muted">F5 run · Ctrl+S save · Ctrl+/ comment · Alt+↑↓ move line · Ctrl+D select next · Ctrl+F find · Ctrl+\` terminal · Ctrl+B sidebar</div></div>`;
        const W2 = $('.cd-welcome'); W2.querySelector('[data-w=new]').onclick = () => quickLang(); W2.querySelector('[data-w=open]').onclick = async () => { const p = await OS.pickFile({ mode: 'dir', path: OS.home() }); if (p) { root = p; OS.store.set('code-root', root); renderSide(); renderWelcome(); } }; W2.querySelector('[data-w=term]').onclick = () => showPanel('terminal'); W2.querySelector('[data-w=pal]').onclick = () => palette('');
        W2.querySelectorAll('[data-f]').forEach((a) => (a.onclick = () => openFile(a.dataset.f)));
      }
      function quickLang() { palette('', Object.entries(LANGS).map(([k, L]) => ({ label: `New ${L.name} file`, icon: L.color, run: () => newUntitled(k) }))); }
      /* ---------- command palette / quick open ---------- */
      const COMMANDS = () => [
        { label: 'File: New File', run: () => quickLang() }, { label: 'File: Save', run: () => saveTab() }, { label: 'File: Save As…', run: () => saveTab(active, true) }, { label: 'File: Close Editor', run: () => active && closeTab(active) }, { label: 'File: Open Folder…', run: async () => { const p = await OS.pickFile({ mode: 'dir', path: OS.home() }); if (p) { root = p; OS.store.set('code-root', root); renderSide(); } } },
        { label: 'Run: Run Current File', run } , { label: 'Preview: Open Preview to the Side', run: openPreview }, { label: 'View: Toggle Terminal', run: () => (panelOpen && panel === 'terminal' ? ((panelOpen = false), applySet()) : showPanel('terminal')) }, { label: 'View: Toggle Sidebar', run: () => { sideOpen = !sideOpen; applySet(); renderSide(); } }, { label: 'View: Show Problems', run: () => showPanel('problems') }, { label: 'View: Toggle Word Wrap', run: () => { set.wrap = !set.wrap; saveSet(); applySet(); } },
        { label: 'Editor: Go to Line…', run: async () => { const l = await OS.prompt('Go to line', '', String(curLine() + 1)); if (l) gotoLine(+l); } }, { label: 'Editor: Toggle Line Comment', run: toggleComment }, { label: 'Editor: Find', run: () => openFind() }, { label: 'Editor: Replace', run: () => openFind(true) }, { label: 'Editor: Zoom In', run: () => { set.font = Math.min(28, set.font + 1); saveSet(); applySet(); measure(); sync(); } }, { label: 'Editor: Zoom Out', run: () => { set.font = Math.max(9, set.font - 1); saveSet(); applySet(); measure(); sync(); } },
        { label: 'Format Document (JSON)', run: () => { if (active && active.lang === 'json') { try { const f = JSON.stringify(JSON.parse(ta.value), null, set.tab); ta.focus(); ta.setSelectionRange(0, ta.value.length); ins(f); onEdit(); } catch (e) { OS.alert('Cannot format', e.message); } } } },
        { label: 'Change Language Mode…', run: () => palette('', Object.entries(LANGS).map(([k, L]) => ({ label: L.name, icon: L.color, run: () => { if (active) { active.lang = k; sync(); updateStatus(); renderTabs(); } } }))) },
        ...Object.keys(THEMES).map((t) => ({ label: `Preferences: Color Theme — ${t}`, run: () => { set.theme = t; saveSet(); applySet(); } })),
        { label: 'Git: Initialize Repository (terminal)', run: async () => { showPanel('terminal'); await ensureTerm(); setTimeout(() => termRun(`cd "${root}" && git init`), 100); } },
      ];
      function palette(init, items) {
        const P = $('.cd-palette'), inp = P.querySelector('input'), list = P.querySelector('.cd-plist'); P.hidden = false; inp.value = init; let sel = 0, cur = [];
        const files = () => OS.fs.find(root, (n, nd, p) => nd.t === 'f' && !p.includes('/.git/'), 500);
        const render = () => { const q = inp.value; if (items) cur = items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase())); else if (q.startsWith('>')) { const qq = q.slice(1).trim().toLowerCase(); cur = COMMANDS().filter((c) => c.label.toLowerCase().includes(qq)); } else if (q.startsWith(':')) cur = [{ label: `Go to line ${q.slice(1)}`, run: () => gotoLine(+q.slice(1)) }]; else { const ql = q.toLowerCase(); cur = files().map((p) => ({ p, rel: p.slice(root.length + 1) })).filter((f) => !ql || fuzzy(f.rel.toLowerCase(), ql)).slice(0, 40).map((f) => ({ label: OS.fs.basename(f.p), sub: OS.fs.dirname(f.rel) === '.' ? '' : OS.fs.dirname('/' + f.rel).slice(1), icon: LANGS[langOf(f.p)].color, run: () => openFile(f.p) })); }
          sel = Math.min(sel, Math.max(0, cur.length - 1)); list.innerHTML = cur.map((c, i) => `<div class="${i === sel ? 'on' : ''}" data-i="${i}">${c.icon ? `<i style="background:${c.icon}"></i>` : ''}<span>${esc(c.label)}</span>${c.sub ? `<small>${esc(c.sub)}</small>` : ''}</div>`).join('') || '<div class="muted">No matching results</div>'; list.querySelectorAll('[data-i]').forEach((d) => (d.onclick = () => pick(+d.dataset.i))); };
        const fuzzy = (s, q) => { let i = 0; for (const ch of s) if (ch === q[i]) i++; return i === q.length; };
        const close = () => { P.hidden = true; inp.onkeydown = inp.oninput = null; document.removeEventListener('pointerdown', outside, true); };
        const pick = (i) => { const c = cur[i]; close(); if (c) c.run(); };
        const outside = (e) => { if (!P.contains(e.target)) close(); };
        inp.oninput = () => { sel = 0; render(); };
        inp.onkeydown = (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(cur.length - 1, sel + 1); render(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); } else if (e.key === 'Enter') { e.preventDefault(); pick(sel); } else if (e.key === 'Escape') { e.preventDefault(); close(); ta.focus(); } };
        setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
        render(); inp.focus();
      }
      /* ---------- wiring ---------- */
      win.body.querySelectorAll('.cd-ab').forEach((b) => (b.onclick = () => { if (view === b.dataset.view && sideOpen) sideOpen = false; else { view = b.dataset.view; sideOpen = true; } applySet(); renderSide(); }));
      win.body.querySelectorAll('.cd-ptab').forEach((b) => (b.onclick = () => showPanel(b.dataset.p)));
      $('[data-a=run]').onclick = () => run();
      $('[data-a=toggleterm]').onclick = () => { if (panelOpen && panel === 'terminal') { panelOpen = false; applySet(); } else showPanel('terminal'); };
      $('[data-a=closepanel]').onclick = () => { panelOpen = false; applySet(); };
      $('[data-a=clearout]').onclick = () => { if (panel === 'output') out.innerHTML = ''; };
      $('[data-s=lang]').onclick = () => COMMANDS().find((c) => c.label.startsWith('Change Language')).run();
      $('[data-s=theme]').onclick = () => palette('', Object.keys(THEMES).map((t) => ({ label: t, icon: THEMES[t].bg, run: () => { set.theme = t; saveSet(); applySet(); } })));
      $('[data-s=errs]').onclick = () => showPanel('problems');
      OS.wm.keys(win, (e) => {
        const c = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
        if (c && k === 's') { e.preventDefault(); saveTab(active, e.shiftKey); }
        else if (c && e.shiftKey && k === 'p') { e.preventDefault(); palette('>'); }
        else if (c && k === 'p') { e.preventDefault(); palette(''); }
        else if (c && k === 'f' && e.shiftKey) { e.preventDefault(); view = 'search'; sideOpen = true; applySet(); renderSide(); }
        else if (c && e.shiftKey && k === 'e') { e.preventDefault(); view = 'explorer'; sideOpen = true; applySet(); renderSide(); }
        else if (c && k === 'f') { e.preventDefault(); openFind(); } else if (c && k === 'h') { e.preventDefault(); openFind(true); }
        else if (c && k === 'g') { e.preventDefault(); palette(':'); }
        else if (c && k === 'b') { e.preventDefault(); sideOpen = !sideOpen; applySet(); renderSide(); }
        else if (c && (e.key === '`' || e.code === 'Backquote')) { e.preventDefault(); if (panelOpen && panel === 'terminal') { panelOpen = false; applySet(); } else showPanel('terminal'); }
        else if (e.key === 'F5' || (c && e.key === 'Enter')) { e.preventDefault(); run(); }
        else if (c && k === 'n') { e.preventDefault(); quickLang(); }
        else if (c && k === 'w') { e.preventDefault(); if (active) closeTab(active); }
        else if (c && (k === '=' || k === '+')) { e.preventDefault(); set.font = Math.min(28, set.font + 1); saveSet(); applySet(); measure(); sync(); }
        else if (c && k === '-') { e.preventDefault(); set.font = Math.max(9, set.font - 1); saveSet(); applySet(); measure(); sync(); }
      });
      win.beforeClose = async () => { stash(); const d = tabs.filter(dirty); if (!d.length) return true; const r = await OS.dialog({ title: `Save changes to ${d.length} file${d.length > 1 ? 's' : ''}?`, message: d.map((t) => t.name).join(', '), buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save all', value: 's', primary: true }] }); if (r === 's') { for (const t of d) if (!(await saveTab(t))) return false; return true; } return r === 'd'; };
      const offFs = OS.on('fs', (d) => { if (d.startsWith(root) && view === 'explorer') { clearTimeout(offFs.t); offFs.t = setTimeout(renderSide, 200); } tabs.forEach((t) => { if (t.path && !dirty(t) && OS.fs.isFile(t.path)) { const c = OS.fs.read(t.path); if (c !== t.saved) { t.content = t.saved = c; if (t === active) { const s = ta.selectionStart; ta.value = c; ta.setSelectionRange(s, s); sync(); } } } }); }); win.onClose(offFs);
      win.onResize = () => { scrollSync(); }; win.onFocus = () => active && ta.focus({ preventScroll: true });
      win.onArgs = (a) => { if (a.path) openFile(a.path); if (a.folder) { root = a.folder; renderSide(); } };
      applySet(); measure(); renderSide(); renderTabs(); if (panel !== 'terminal') showPanel(panel, true); panelOpen = false; applySet(); checkProblems();
      if (args.path) { const dirp = OS.fs.dirname(args.path); if (!args.path.startsWith(root)) { root = dirp; } openFile(args.path); } else if (!OS.store.get('code-opened')) { OS.store.set('code-opened', 1); openFile(root + '/README.md'); openFile(root + '/app.js'); }
    },
  });
})();
