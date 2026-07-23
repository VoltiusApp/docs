// Manifest-driven capture runner. Runs INSIDE the tauri-headless container against
// tauri-driver on localhost:4444. Reads shots.json (copied alongside it), and for each
// requested shot replays its `steps` (a small verb vocabulary) then screenshots to
// /app/screenshots/raw/<id>.png.
//
//   Usage: node capture.mjs <shots.json> [id ...]
//
// Precondition: a fresh headless app (empty Personal vault). Each shot is self-contained
// — it resets the Personal vault to empty and re-seeds what it needs — so shots may run
// in any order or as a subset, and re-runs are idempotent.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const BASE = 'http://localhost:4444';
const APP = '/app/target/debug/voltius';
const OUT = '/app/screenshots/raw';
const SIDF = '/tmp/wd_sid';

// Seed host used by the populated/terminal shots. ssh-host-1 is the companion container
// (see compose.headless.yml): user "voltius", password "voltius", port 2222.
const SEED = { host: 'ssh-host-1', port: '2222', user: 'voltius', pass: 'voltius' };

const [manifestPath, ...ids] = process.argv.slice(2);
const shots = JSON.parse(readFileSync(manifestPath, 'utf8'))
  .filter((s) => ids.length === 0 || ids.includes(s.id));

let sid;

async function http(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t }; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evalJs(script, args = []) {
  const r = await http('POST', `/session/${sid}/execute/sync`, { script, args });
  return r && ('value' in r ? r.value : r);
}

// DOM-event click at a viewport point (dodges WebKitGTK dropped-click on ripple mutation).
async function clickAt(x, y) {
  return evalJs(
    // Hoist args to locals: inside the forEach callback `arguments` rebinds to the
    // callback's own params, so arguments[0]/[1] would not be x/y there.
    `var px=arguments[0], py=arguments[1];
     var el=document.elementFromPoint(px,py); if(!el) return 'NOEL';
     ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
       el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:px,clientY:py,button:0}));
     }); return 'OK';`,
    [x, y],
  );
}

// Click the first visible element whose trimmed text === label (buttons/tabs).
async function clickText(label) {
  return evalJs(
    `var needle=arguments[0];
     function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
     var el=[...document.querySelectorAll('button,a,[role=button],[role=tab],div,span')]
       .find(function(e){return vis(e)&&e.textContent.trim()===needle&&e.getBoundingClientRect().width<260;});
     if(!el) return 'NOEL';
     var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
     ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
       el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,button:0}));
     }); return 'OK';`,
    [label],
  );
}

// Set a React-controlled input/textarea value by CSS selector (native setter + events).
async function setVal(sel, val) {
  return evalJs(
    `var el=document.querySelector(arguments[0]); if(!el) return 'NOEL';
     var proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;
     var set=Object.getOwnPropertyDescriptor(proto,'value').set; el.focus(); set.call(el,arguments[1]);
     el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
     return 'OK';`,
    [sel, val],
  );
}

async function pressKey(key) {
  return evalJs(
    `document.dispatchEvent(new KeyboardEvent('keydown',{key:arguments[0],code:arguments[0],keyCode:arguments[0]==='Escape'?27:0,bubbles:true})); return 'OK';`,
    [key],
  );
}

async function setWindow(w, h) {
  return http('POST', `/session/${sid}/window/rect`, { width: w, height: h, x: 0, y: 0 });
}

async function waitText(text, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const ok = await evalJs(
      `var needle=arguments[0];
       function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
       return [...document.querySelectorAll('*')].some(function(e){return vis(e)&&e.textContent.trim()===needle;});`,
      [text],
    );
    if (ok === true) return true;
    await sleep(200);
  }
  return false;
}

// Best-effort dismiss of the "Verify your email …" test banner and any error toast.
// Clicks explicit ×/dismiss controls plus small icon buttons in the bottom-right toast
// corner (the dev-mode "Something went wrong / Create bug report" toast has an icon-only ×).
async function dismissBanner() {
  return evalJs(
    `function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
     var n=0;
     [...document.querySelectorAll('button')].filter(vis).forEach(function(b){
       var t=(b.textContent||'').trim(), al=(b.getAttribute('aria-label')||'');
       var r=b.getBoundingClientRect();
       var toastCorner = r.left>980 && r.top>700 && r.width<44;
       if(t==='×'||t==='✕'||/dismiss|close/i.test(al)||toastCorner){
         ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(ev){
           b.dispatchEvent(new MouseEvent(ev,{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0}));}); n++;
       }
     }); return n;`,
  );
}

// Delete every host card in the current Hosts view (leftmost action icon per card = trash).
// Idempotent reset: loops until the empty state appears or no action icons remain.
async function deleteAllHosts() {
  for (let i = 0; i < 8; i++) {
    if (await waitText('No hosts yet', 500)) return 'empty';
    const clicked = await evalJs(
      `function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
       var btns=[...document.querySelectorAll('button')].filter(function(e){
         if(!vis(e)) return false; var r=e.getBoundingClientRect();
         return r.width<44 && r.height<44 && r.left<240 && r.top>300 && r.top<720;
       }).sort(function(a,b){return a.getBoundingClientRect().left-b.getBoundingClientRect().left;});
       if(!btns.length) return 'NONE';
       var el=btns[0], r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
       ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(t){
         el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,button:0}));});
       return 'CLICKED';`,
    );
    if (clicked === 'NONE') return 'empty';
    await sleep(500);
  }
  return 'maxed';
}

// Seed the SEED host via the New Host form (auto-saves on field entry), then close the
// edit panel and clear the toast that host creation raises. Coordinates match the 1200×800
// layout: the "New Host" button (1085,191) and the panel collapse arrow (1171,191). A
// coordinate click on the button is required — clickText matches a wrapper div that misses.
async function seedHost() {
  await clickAt(1085, 191); // open the New Host form
  await sleep(900);
  await setVal("input[placeholder='My Server (optional)']", SEED.host);
  await setVal("input[placeholder='192.168.1.1']", SEED.host);
  await setVal("input[placeholder='22']", SEED.port);
  await setVal("input[placeholder='root']", SEED.user);
  await setVal("input[type='password'][placeholder='••••••••']", SEED.pass);
  await sleep(1400); // auto-save + reachability ping
  await clickAt(1171, 191); // collapse the edit panel
  await sleep(600);
  await dismissBanner(); // clear the "Something went wrong" toast host creation raises
  await sleep(400);
}

// Close the terminal's right side panel (Ports/etc.) if it is open, for a clean terminal
// shot. The titlebar toggle at (1031,31) flips it, so only click when a panel is present.
async function closeSidePanel() {
  const open = await evalJs(
    `function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
     return [...document.querySelectorAll('*')].some(function(e){ if(!vis(e)) return false;
       var r=e.getBoundingClientRect(); return r.left>=880 && r.width>=250 && r.height>=350; });`,
  );
  if (open === true) {
    await clickAt(1031, 31);
    await sleep(400);
  }
}

// Type a command into the focused terminal (real key events) + Enter.
async function termType(text) {
  const acts = [];
  for (const ch of text) {
    acts.push({ type: 'keyDown', value: ch }, { type: 'keyUp', value: ch });
  }
  acts.push({ type: 'keyDown', value: '\uE007' }, { type: 'keyUp', value: '\uE007' }); // Enter
  await http('POST', `/session/${sid}/actions`, {
    actions: [{ type: 'key', id: 'kb', actions: acts }],
  });
}

async function runStep(step) {
  if (step.setWindow) return setWindow(step.setWindow[0], step.setWindow[1]);
  if (step.clickAt) return clickAt(step.clickAt[0], step.clickAt[1]);
  if (step.clickText) return clickText(step.clickText);
  if (step.setVal) return setVal(step.setVal[0], step.setVal[1]);
  if (step.key) return pressKey(step.key);
  if (step.waitText) return waitText(step.waitText[0], step.waitText[1] || 8000);
  if (step.waitMs != null) return sleep(step.waitMs);
  if (step.dismissBanner) return dismissBanner();
  if (step.deleteAllHosts) return deleteAllHosts();
  if (step.seedHost) return seedHost();
  if (step.closeSidePanel) return closeSidePanel();
  if (step.termType) return termType(step.termType);
  if (step.eval) return evalJs(step.eval);
  throw new Error('unknown step: ' + JSON.stringify(step));
}

async function waitGone(text, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const present = await evalJs(
      `var needle=arguments[0];
       function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
       return [...document.querySelectorAll('*')].some(function(e){return vis(e)&&e.textContent.trim()===needle;});`,
      [text],
    );
    if (present === false) return true;
    await sleep(200);
  }
  return false;
}

// tauri-driver allows a single session. Reuse the live one if there is one (avoids the
// launch splash and its restore-last-session quirk); only launch fresh when none exists.
async function ensureSession() {
  if (existsSync(SIDF)) {
    const old = readFileSync(SIDF, 'utf8').trim();
    const chk = await http('GET', `/session/${old}/window/rect`);
    if (chk && chk.value && typeof chk.value.width === 'number') sid = old;
  }
  if (!sid) {
    const r = await http('POST', '/session', {
      capabilities: { alwaysMatch: { 'tauri:options': { application: APP } } },
    });
    sid = r.value && r.value.sessionId;
    if (!sid) throw new Error('no session: ' + JSON.stringify(r).slice(0, 300));
    writeFileSync(SIDF, sid);
    await http('POST', `/session/${sid}/timeouts`, { implicit: 6000 });
  }
  await setWindow(1200, 800);
  // Wait past the splash ("Voltius / SSH Client / Checking vault …") if this is a fresh
  // launch; a no-op when reusing an already-booted session.
  await waitGone('SSH Client', 30000);
  await sleep(800);
}

// Return to the Vaults view from wherever the app is (the top-left titlebar button is
// "Vaults" in the vault view and "back to Vaults" in a terminal view).
async function toVaults() {
  await clickAt(34, 31);
  await sleep(900); // let the view transition settle before locating titlebar tabs
}

// Close any open terminal session tabs (middle-click), so a re-run doesn't accumulate
// tabs and the Vaults-view shots stay clean. Titlebar session tabs carry the seed host name.
async function closeTerminalTabs() {
  for (let i = 0; i < 6; i++) {
    const closed = await evalJs(
      `var needle=arguments[0];
       function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
       var tab=[...document.querySelectorAll('button')].find(function(e){ if(!vis(e)) return false;
         var r=e.getBoundingClientRect(); return r.top<50 && r.width<220 && e.textContent.indexOf(needle)>=0; });
       if(!tab) return 'none';
       var r=tab.getBoundingClientRect(),cx=Math.round(r.left+r.width/2),cy=Math.round(r.top+r.height/2);
       var target=document.elementFromPoint(cx,cy) || tab; // middle-click closes on the inner element, not the button
       ['pointerdown','mousedown','pointerup','mouseup'].forEach(function(t){
         target.dispatchEvent(new MouseEvent(t,{bubbles:true,clientX:cx,clientY:cy,button:1}));});
       target.dispatchEvent(new MouseEvent('auxclick',{bubbles:true,clientX:cx,clientY:cy,button:1}));
       return 'closed';`,
      [SEED.host],
    );
    if (closed === 'none') break;
    await sleep(400);
  }
}

async function capture(shot) {
  await toVaults();
  await closeTerminalTabs();
  for (const step of shot.steps) await runStep(step);
  await sleep(400);
  const r = await http('GET', `/session/${sid}/screenshot`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${shot.id}.png`, r.value, 'base64');
  console.log('SHOT ' + shot.id);
}

await ensureSession();
for (const shot of shots) {
  try {
    await capture(shot);
  } catch (e) {
    console.error('FAIL ' + shot.id + ': ' + e.message);
    process.exitCode = 1;
  }
}
