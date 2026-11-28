/* Cirrus Linux — first-login account setup (out-of-box experience) */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const RESERVED = new Set('root daemon bin sys sync games man lp mail news uucp proxy www-data backup list irc nobody systemd messagebus admin sudo cirrus'.split(' '));
  const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 24);
  const strength = (p) => { let n = 0; if (p.length >= 6) n++; if (p.length >= 10) n++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++; if (/\d/.test(p)) n++; if (/[^A-Za-z0-9]/.test(p)) n++; return Math.min(4, n); };
  OS.setup = {
    needed: () => !OS.settings.accountSetup,
    run: () => new Promise((resolve) => {
      const S = OS.settings;
      const st = { fullname: '', user: '', userEdited: false, host: S.hostname || 'cirrus', pass: '', pass2: '', hint: '', theme: S.theme, accent: S.accent, step: 0 };
      const el = OS.el(`<div id="oobe"><div class="ob-bg"></div><div class="ob-card"><div class="ob-steps"></div><div class="ob-body"></div><div class="ob-foot"><button class="btn" data-a="back">Back</button><span class="spacer"></span><button class="btn primary" data-a="next">Next</button></div></div></div>`);
      el.querySelector('.ob-bg').style.background = OS.wallpaperCss(S.wallpaper);
      document.body.appendChild(el);
      const body = el.querySelector('.ob-body'), next = el.querySelector('[data-a=next]'), back = el.querySelector('[data-a=back]');
      const STEPS = ['Welcome', 'About you', 'Password', 'Look', 'Finish'];
      function err(msg) { const e = body.querySelector('.ob-err'); if (e) { e.textContent = msg; e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); } if (msg) OS.sound('error'); return !msg; }
      function render() {
        el.querySelector('.ob-steps').innerHTML = STEPS.map((s, i) => `<span class="${i === st.step ? 'on' : i < st.step ? 'done' : ''}"><i>${i < st.step ? '✓' : i + 1}</i><b>${s}</b></span>`).join('');
        back.hidden = st.step === 0 || st.step === 4; next.hidden = st.step === 4; next.textContent = st.step === 0 ? 'Get started' : st.step === 3 ? 'Create account' : 'Next';
        if (st.step === 0) body.innerHTML = `<div class="ob-hero">${OS.logo(88)}<h1>Welcome to Cirrus Linux</h1><p>Let’s set up your computer. You’ll choose a user name and a password — you’ll need the password every time you log in.</p><div class="ob-feats"><span>${gl('folder')}Your own home folder</span><span>${gl('lock')}Password-protected login</span><span>${gl('palette')}Your favourite look</span></div></div>`;
        if (st.step === 1) {
          body.innerHTML = `<h2>Who are you?</h2><p class="muted">Your user name is used for your home folder (<code>/home/<span data-v="u">${esc(st.user || 'name')}</span></code>) and in the terminal.</p>
            <label class="ob-f"><span>Your name</span><input class="inp" data-k="fullname" placeholder="e.g. Ada Lovelace" autocomplete="name" value="${esc(st.fullname)}"></label>
            <label class="ob-f"><span>User name</span><input class="inp" data-k="user" placeholder="e.g. ada" autocapitalize="off" autocomplete="username" spellcheck="false" value="${esc(st.user)}"><small>Lowercase letters, digits, - and _</small></label>
            <label class="ob-f"><span>Computer name</span><input class="inp" data-k="host" autocapitalize="off" spellcheck="false" value="${esc(st.host)}"><small>How this device appears on the network</small></label><div class="ob-err"></div>`;
          const fi = body.querySelector('[data-k=fullname]'), ui = body.querySelector('[data-k=user]'), hi = body.querySelector('[data-k=host]');
          fi.oninput = () => { st.fullname = fi.value; if (!st.userEdited) { st.user = slug(fi.value.split(' ')[0] || fi.value); ui.value = st.user; } body.querySelector('[data-v=u]').textContent = st.user || 'name'; };
          ui.oninput = () => { st.userEdited = true; st.user = ui.value = ui.value.toLowerCase().replace(/\s/g, ''); body.querySelector('[data-v=u]').textContent = st.user || 'name'; };
          hi.oninput = () => (st.host = hi.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
          setTimeout(() => fi.focus(), 50);
        }
        if (st.step === 2) {
          body.innerHTML = `<h2>Choose a password</h2><p class="muted">You’ll type it to log in, unlock the screen and use <code>sudo</code>.</p>
            <label class="ob-f"><span>Password</span><div class="ob-pw"><input class="inp" type="password" data-k="pass" autocomplete="new-password" value="${esc(st.pass)}"><button type="button" class="ibtn" data-a="eye" title="Show password">${gl('eye')}</button></div><div class="ob-meter" data-s="0"><i></i><i></i><i></i><i></i></div><small data-v="sm">At least 4 characters</small></label>
            <label class="ob-f"><span>Confirm password</span><input class="inp" type="password" data-k="pass2" autocomplete="new-password" value="${esc(st.pass2)}"></label>
            <label class="ob-f"><span>Password hint <em class="muted">(optional)</em></span><input class="inp" data-k="hint" placeholder="Shown after a wrong password" value="${esc(st.hint)}"></label><div class="ob-err"></div>`;
          const p1 = body.querySelector('[data-k=pass]'), p2 = body.querySelector('[data-k=pass2]'), h = body.querySelector('[data-k=hint]'), meter = body.querySelector('.ob-meter');
          const upd = () => { const s = st.pass ? strength(st.pass) : 0; meter.dataset.s = s; body.querySelector('[data-v=sm]').textContent = !st.pass ? 'At least 4 characters' : ['Very weak', 'Weak', 'Okay', 'Good', 'Strong'][s]; };
          p1.oninput = () => { st.pass = p1.value; upd(); }; p2.oninput = () => (st.pass2 = p2.value); h.oninput = () => (st.hint = h.value);
          body.querySelector('[data-a=eye]').onclick = () => { const t = p1.type === 'password' ? 'text' : 'password'; p1.type = p2.type = t; };
          upd(); setTimeout(() => p1.focus(), 50);
        }
        if (st.step === 3) {
          body.innerHTML = `<h2>Pick your look</h2><p class="muted">You can change this any time in Settings.</p>
            <div class="ob-themes">${['dark', 'light'].map((t) => `<button class="ob-theme ${st.theme === t ? 'on' : ''}" data-t="${t}"><div class="ob-prev ${t}"><i></i><i></i><i></i></div><b>${t === 'dark' ? 'Dark' : 'Light'}</b></button>`).join('')}</div>
            <div class="ob-f"><span>Accent colour</span><div class="ob-acc">${OS.accents.map((c) => `<button data-c="${c}" class="${c === st.accent ? 'on' : ''}" style="background:${c}" title="${c}"></button>`).join('')}</div></div>`;
          body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { st.theme = b.dataset.t; OS.set('theme', st.theme); render(); }));
          body.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { st.accent = b.dataset.c; OS.set('accent', st.accent); render(); }));
        }
        if (st.step === 4) finish();
      }
      function validate() {
        if (st.step === 1) {
          st.fullname = st.fullname.trim();
          if (!st.fullname) return err('Please enter your name.');
          if (!/^[a-z_][a-z0-9_-]{0,30}$/.test(st.user)) return err('User names must start with a letter and use only lowercase letters, digits, - and _.');
          if (RESERVED.has(st.user)) return err(`“${st.user}” is reserved by the system. Pick another user name.`);
          if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(st.host)) return err('Computer names can use lowercase letters, digits and -.');
        }
        if (st.step === 2) {
          if (st.pass.length < 4) return err('Your password needs at least 4 characters.');
          if (st.pass !== st.pass2) return err('The passwords don’t match.');
          if (st.hint && st.hint.toLowerCase().includes(st.pass.toLowerCase())) return err('The hint can’t contain the password.');
        }
        return true;
      }
      async function finish() {
        body.innerHTML = `<div class="ob-hero"><div class="spinner"></div><h2>Setting things up for ${esc(st.fullname.split(' ')[0])}…</h2><div class="ob-log"></div></div>`;
        const log = body.querySelector('.ob-log');
        const say = async (t, ms) => { log.insertAdjacentHTML('beforeend', `<div>${gl('check')}${esc(t)}</div>`); await OS.sleep(ms); };
        const oldUser = S.username;
        await say(`Creating user ${st.user} (UID 1000)`, 500);
        await OS.fs.applyAccount({ oldUser, user: st.user, fullname: st.fullname, host: st.host, password: st.pass });
        await say(`Setting up home folder /home/${st.user}`, 500);
        OS.settings.username = st.user; OS.settings.fullname = st.fullname; OS.settings.hostname = st.host; OS.settings.password = st.pass; OS.settings.passwordHint = st.hint; OS.settings.accountSetup = true; OS.settings.lockOnBoot = true;
        OS.saveSettings(); OS.applySettings(); OS.emit('settings', 'username', st.user);
        await say('Adding you to the sudo group', 400);
        await say(`Naming this computer “${st.host}”`, 400);
        await say('Applying your theme', 400);
        await say('All done!', 600);
        el.classList.add('gone'); setTimeout(() => el.remove(), 500);
        resolve(true);
      }
      next.onclick = () => { if (!validate()) return; st.step++; render(); };
      back.onclick = () => { st.step = Math.max(0, st.step - 1); render(); };
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !next.hidden) { e.preventDefault(); next.click(); } });
      body.addEventListener('input', () => { const e = body.querySelector('.ob-err'); if (e) e.textContent = ''; });
      render(); setTimeout(() => next.focus(), 50);
    }),
  };
})();
