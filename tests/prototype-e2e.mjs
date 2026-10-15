/** Reproducible browser checks using the Playwright CLI, with no test-runner dependency.
 * Start the app separately, then run `node tests/prototype-e2e.mjs`.
 * Optional: PROTOTYPE_BASE_URL, PROTOTYPE_E2E_SESSION, or --suite=<name>.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'output', 'playwright');
const base = process.env.PROTOTYPE_BASE_URL || 'http://127.0.0.1:3000';
const session = process.env.PROTOTYPE_E2E_SESSION || 'prototype-tests';
const cliPackage = '@playwright/cli@0.1.22';
const key = 'lesson-designer-library:classical-library:v1';
const selected = process.argv.find(argument => argument.startsWith('--suite='))?.slice(8);
const reportFilename = selected ? `prototype-e2e-report-${selected}.json` : 'prototype-e2e-report.json';
mkdirSync(output, { recursive: true });

function locateNpx() {
  const candidates = [join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')];
  if (process.env.npm_execpath) candidates.push(join(dirname(process.env.npm_execpath), 'npx-cli.js'));
  for (const directory of (process.env.PATH || '').split(delimiter)) {
    const executable = join(directory, process.platform === 'win32' ? 'npx.cmd' : 'npx');
    if (existsSync(executable)) {
      candidates.push(join(directory, 'node_modules', 'npm', 'bin', 'npx-cli.js'));
      const target = realpathSync(executable); if (target.endsWith('.js')) candidates.push(target);
    }
  }
  const entrypoint = candidates.find(candidate => existsSync(candidate));
  if (!entrypoint) throw new Error('npx가 필요합니다. Node.js와 npm 설치 후 다시 실행하세요.');
  return entrypoint;
}
const npx = locateNpx();
let cacheReady = false;
async function cli(args, { tolerateFailure = false } = {}) {
  const command = [npx, ...(cacheReady ? ['--offline'] : []), '--yes', '--package', cliPackage, 'playwright-cli', `-s=${session}`, ...args];
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, command, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`CLI 명령 제한 시간 55초 초과: ${args[0]}`)); }, 55000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); resolveResult({ code, stdout, stderr }); });
  });
  if (!tolerateFailure && (result.code !== 0 || /### Error\b/.test(result.stdout))) throw new Error(`${args[0]} 실패\n${result.stdout}\n${result.stderr}`);
  return result;
}

const suites = [];
function suite(name, operation, options = {}) { suites.push({ name, operation, ...options }); }
for (const [instrument, label] of [['violin', '바이올린'], ['cello', '첼로'], ['flute', '플루트'], ['clarinet', '클라리넷']]) {
  suite(`core-${instrument}`, async function (page, h, input) {
    await h.goto('/teacher/plans'); await h.waitCount(page.locator('.ws-plan-card'), 4);
    await h.goto('/library'); await page.getByRole('main').getByRole('button', { name: input.label, exact: true }).click();
    await page.getByRole('textbox', { name: '자료 검색', exact: true }).fill(input.label);
    await page.getByRole('button', { name: '검색 실행', exact: true }).click(); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 2);
    await page.getByRole('link', { name: `${input.label} 수업 준비 노트 책 열기`, exact: true }).click();
    await page.getByRole('button', { name: '첫 단원 열기', exact: true }).click(); await h.visible(page.getByRole('heading', { name: '자료를 열기 전에', exact: true }));
    await page.getByRole('button', { name: '현재 위치 북마크', exact: true }).click(); await h.attr(page.getByRole('button', { name: '현재 위치 북마크', exact: true }), 'aria-pressed', 'true');
    await page.getByRole('button', { name: '다음 단원', exact: true }).click(); await h.visible(page.getByRole('heading', { name: '한 회차 수업에 담기', exact: true }));
    await page.waitForFunction(storageKey => JSON.parse(localStorage.getItem(storageKey) || 'null')?.data.positions.some(position => position.unitId.endsWith('unit-2')), h.key);
    await page.reload(); await h.visible(page.getByRole('heading', { name: '한 회차 수업에 담기', exact: true }));
    const stored = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), h.key);
    h.assert(stored.data.bookmarks.length === 1 && stored.data.positions.some(position => position.unitId.endsWith('unit-2') && position.resourceVersionId === `demo-${input.instrument}-textbook-v1`), '판본별 북마크·위치 보존 실패');
    await h.goto('/bookmarks'); await page.getByRole('button', { name: '책 열기', exact: true }).click();
    await h.visible(page.getByRole('heading', { name: '자료를 열기 전에', exact: true })); await h.attr(page.getByRole('button', { name: '현재 위치 북마크', exact: true }), 'aria-pressed', 'true');
    await page.getByRole('button', { name: '다음 단원', exact: true }).click(); await h.visible(page.getByRole('heading', { name: '한 회차 수업에 담기', exact: true }));
    await page.getByRole('button', { name: '수업안에 담기', exact: true }).click();
    await h.visible(page.getByRole('dialog', { name: '수업안 선택', exact: true }));
    await page.getByRole('combobox', { name: /^수업안 선택/ }).selectOption('new'); await page.getByRole('button', { name: '단원 담기', exact: true }).click();
    await h.visible(page.getByLabel('수업안 제목', { exact: true }));
    const title = `${input.label} 자동 검증 수업안`; await page.getByLabel('수업안 제목', { exact: true }).fill(title); await page.getByRole('button', { name: '수업안 저장', exact: true }).click();
    await page.waitForFunction(([storageKey, title]) => JSON.parse(localStorage.getItem(storageKey)).data.plans.some(plan => plan.title === title), [h.key, title]);
    await page.reload(); h.assert(await page.getByLabel('수업안 제목', { exact: true }).inputValue() === title, '교안 저장·새로고침 실패');
    h.assert(await page.getByText('한 회차 수업에 담기 · 판본 1.0', { exact: false }).count() > 0, '단원/판본 고정 참조 미표시');
    await page.getByRole('button', { name: '복제', exact: true }).click(); await page.waitForURL(url => /\/teacher\/plans\//.test(url.pathname));
    await page.waitForFunction(() => document.querySelector('input[maxlength="160"]')?.value.endsWith('(복사)'));
    await page.getByRole('button', { name: '출력 미리보기', exact: true }).click(); await h.visible(page.getByRole('button', { name: '미리보기 닫기', exact: true }));
    h.assert((await page.locator('.ws-print-sheet').innerText()).includes('합성 시연용 수업안'), '인쇄 데모 워터마크 누락');
    await page.screenshot({ path: h.artifact(`plan-${input.instrument}.png`), fullPage: true });
    const saved = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).data.plans, h.key);
    h.assert(saved.length === 6 && saved.some(plan => plan.title === title && plan.activities.some(activity => activity.resources.some(ref => ref.resourceId === `demo-${input.instrument}-textbook` && ref.unitId.endsWith('unit-2')))), '새 교안 생성·단원 참조·복제 수량 오류');
  }, { input: { instrument, label } });
}

suite('search-routing', async function (page, h) {
  await h.goto('/library'); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 8);
  for (const term of ['플룻', '  FLUTE  ']) { await page.getByRole('textbox', { name: '자료 검색', exact: true }).fill(term); await page.getByRole('button', { name: '검색 실행', exact: true }).click(); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 2); }
  await h.goto('/library?instrument=cello&level=1&sort=recent'); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 1);
  await page.getByRole('button', { name: '목록 보기', exact: true }).click(); await page.waitForURL(/view=list/); const before = page.url();
  await page.getByRole('link', { name: '첼로 수업 준비 노트 책 열기', exact: true }).click(); await h.visible(page.getByRole('button', { name: '첫 단원 열기', exact: true })); await page.goBack();
  h.assert(page.url() === before, '뒤로가기 필터/정렬/목록 복원 실패'); await h.attr(page.getByRole('button', { name: '목록 보기', exact: true }), 'aria-pressed', 'true');
  await h.goto('/library?instrument=clarinet&kind=score'); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 1);
  await h.goto('/library?q=존재하지않는단어'); await h.visible(page.getByRole('heading', { name: '조건에 맞는 자료가 없습니다.', exact: true }));
  await h.goto('/library?scope=real'); await h.visible(page.getByRole('heading', { name: '현재 공개할 수 있는 승인 실자료가 없습니다.', exact: true })); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 0);
  const missingResource = await page.goto(`${h.base}/library/no-such-resource`); await h.visible(page.getByRole('heading', { name: /자료.*찾을 수 없습니다/ })); h.assert(missingResource.status() === 404, '없는 자료가 404가 아닙니다.');
  await h.goto('/library/demo-violin-textbook/units/not-a-unit'); await h.visible(page.getByRole('heading', { name: '이 판본의 단원이 아닙니다.', exact: true }));
  const response = await page.goto(`${h.base}/not-a-real-route`); h.assert(response.status() === 404, '없는 경로가 404가 아닙니다.');
});

suite('unsaved-back', async function (page, h) {
  await h.goto('/teacher/plans'); await page.getByRole('link', { name: '바이올린 40분 수업 준비', exact: true }).click();
  const title = page.getByLabel('수업안 제목', { exact: true }); const originalTitle = await title.inputValue(); const editorUrl = page.url(); const unsaved = '취소 시 유지할 저장 전 교안'; await title.fill(unsaved); await h.visible(page.locator('.ws-save-state.ws-dirty'));
  const cancelDialog = page.waitForEvent('dialog'); const canceledBack = page.evaluate(() => history.back()); const dialog = await cancelDialog; await dialog.dismiss(); await canceledBack; await page.waitForURL(editorUrl);
  h.assert(await title.inputValue() === unsaved, '브라우저 뒤로가기 취소가 저장 전 편집을 보존하지 않음');
  const beforeUnload = page.waitForEvent('dialog'); const reloadAttempt = page.reload().catch(() => null); const reloadDialog = await beforeUnload; h.assert(reloadDialog.type() === 'beforeunload', '새로고침의 저장 전 편집 안내가 아님'); await reloadDialog.dismiss(); await reloadAttempt;
  h.assert(page.url() === editorUrl && await title.inputValue() === unsaved, '새로고침 취소가 저장 전 편집을 보존하지 않음');
  page.once('dialog', dialog => dialog.accept()); await page.goBack(); await page.waitForURL(`${h.base}/teacher/plans`);
  await page.getByRole('link', { name: originalTitle, exact: true }).click(); h.assert(await title.inputValue() === originalTitle, '뒤로가기에서 버린 편집이 저장됨');
  await title.fill(unsaved); await h.visible(page.locator('.ws-save-state.ws-dirty')); let confirmations = 0; const cancel = dialog => { confirmations++; return dialog.dismiss(); }; page.on('dialog', cancel);
  await page.getByRole('link', { name: '모든 자료', exact: true }).click(); page.off('dialog', cancel);
  h.assert(confirmations === 1 && page.url() === editorUrl && await title.inputValue() === unsaved, '내부 이동 취소는 한 번 확인하고 편집을 유지해야 함');
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('link', { name: '모든 자료', exact: true }).click(); await page.waitForURL(`${h.base}/library`);
});

suite('admin-practice', async function (page, h) {
  await h.goto('/admin/resources'); await h.visible(page.getByRole('heading', { name: '자료 관리실', exact: true }));
  h.assert(JSON.stringify(await page.locator('.ws-admin-stats strong').allTextContents()) === JSON.stringify(['0', '8', '19', '37']), '공개/합성/원자료/앱 통계 구분 오류');
  await h.goto('/admin/mapping'); h.assert((await page.locator('.ws-mapping-summary').innerText()).includes('24'), '24개 제안 모듈 수 누락'); await h.waitCount(page.locator('.ws-mapping-group tbody tr'), 24);
  await h.goto('/admin/apps'); await h.waitCount(page.getByRole('complementary', { name: '편집할 앱 후보 선택', exact: true }).getByRole('button'), 37);
  const field = page.getByLabel(/^앱 URL/); const original = await field.inputValue(); await field.fill('https://127.0.0.1/'); await page.getByRole('button', { name: '변경사항 저장', exact: true }).click();
  await h.visible(page.getByRole('status').filter({ hasText: '허용된 HTTPS 호스트' })); await page.getByRole('button', { name: '변경 취소', exact: true }).click(); h.assert(await field.inputValue() === original, '앱 변경 취소 미복원');
  await h.goto('/practice?instrument=clarinet'); await h.visible(page.getByRole('heading', { name: '악기 연습실', exact: true }));
  h.assert(await page.getByRole('link', { name: /외부 앱 새 탭 열기/ }).count() === 0, '미검증 앱이 활성 외부 링크로 노출됨');
  h.assert(await page.getByRole('button', { name: '점검 후 연결 예정', exact: true }).count() > 0, '미점검 앱 비활성 표시 누락');
  h.assert(await page.locator('audio[autoplay],video[autoplay],iframe').count() === 0, '자동 재생/외부 임베드 발견');
  await page.screenshot({ path: h.artifact('practice.png'), fullPage: true });
});

suite('storage-corruption', async function (page, h) {
  await page.context().addInitScript(storageKey => { localStorage.setItem(storageKey, '{broken-json'); }, h.key);
  await h.goto('/library'); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 8); await h.visible(page.getByRole('alert').filter({ hasText: '손상' }));
  h.assert(await page.evaluate(storageKey => localStorage.getItem(storageKey), h.key) === '{broken-json', '손상 원본을 자동 덮어씀');
  page.once('dialog', dialog => dialog.dismiss()); await page.getByRole('button', { name: '저장소 초기화', exact: true }).click();
  h.assert(await page.evaluate(storageKey => localStorage.getItem(storageKey), h.key) === '{broken-json', '초기화 취소로 데이터가 바뀜');
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: '저장소 초기화', exact: true }).click();
  await page.waitForFunction(storageKey => localStorage.getItem(storageKey) === null, h.key); await h.waitCount(page.getByRole('link', { name: /책 열기$/ }), 8);
  await page.screenshot({ path: h.artifact('storage-recovery.png'), fullPage: true });
});

suite('storage-quota', async function (page, h) {
  await page.context().addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Simulated quota', 'QuotaExceededError'); }; });
  await h.goto('/library'); const button = page.getByRole('button', { name: '바이올린 수업 준비 노트 북마크 추가', exact: true }); await button.click();
  await h.visible(page.getByRole('alert').filter({ hasText: '임시 메모리' })); await h.visible(page.getByRole('status').filter({ hasText: '브라우저 저장 실패' }));
  await h.attr(page.getByRole('button', { name: '바이올린 수업 준비 노트 북마크 해제', exact: true }), 'aria-pressed', 'true');
  await page.reload(); await h.visible(page.getByRole('button', { name: '바이올린 수업 준비 노트 북마크 추가', exact: true }));
});

suite('safety-report', async function (page, h) {
  const route = '/library/demo-violin-textbook/units/demo-violin-textbook-v1-unit-1';
  await h.goto(route); await page.getByRole('button', { name: '이 위치의 오류 신고', exact: true }).click();
  await h.visible(page.getByRole('dialog', { name: '오류 신고', exact: true }));
  await page.getByRole('combobox', { name: '범주', exact: true }).selectOption('safety');
  await page.getByRole('combobox', { name: '심각도', exact: true }).selectOption('critical');
  await page.getByLabel('오류 내용', { exact: true }).fill('안전 신고 후 자료 보류를 확인하는 합성 자동 검증');
  await page.getByLabel('확인 근거', { exact: true }).fill('이 검증은 시연 데이터의 상태 전이만 확인합니다.');
  await page.getByLabel('수정 제안', { exact: true }).fill('사용을 중지하고 가상 검수자가 재확인합니다.');
  await page.getByRole('button', { name: '신고 저장', exact: true }).click();
  await h.visible(page.getByRole('heading', { name: '이 자료의 열람이 중지되었습니다.', exact: true }));
  await page.reload(); await h.visible(page.getByRole('heading', { name: '이 자료의 열람이 중지되었습니다.', exact: true }));
  const state = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).data, h.key);
  h.assert(state.resources.find(resource => resource.id === 'demo-violin-textbook').publicationState === 'on_hold', '안전 신고 후 공개 자료가 보류되지 않음');
  h.assert(state.issues.some(issue => issue.category === 'safety' && issue.severity === 'critical' && issue.unitId === 'demo-violin-textbook-v1-unit-1'), '단원 위치를 포함한 안전 신고 미저장');
  await h.goto('/teacher/plans/plan-violin-demo'); await h.visible(page.getByRole('heading', { name: '자료 사용 확인', exact: true }));
  h.assert((await page.locator('.ws-warning-panel').innerText()).includes('보류'), '기존 교안의 보류 자료 경고 누락');
  await page.getByRole('button', { name: '출력 미리보기', exact: true }).click();
  const source = await page.locator('.ws-print-source').innerText(); h.assert(source.includes('판본 1.0') && source.includes('메타데이터만 출력'), '보류 교안의 판본·출력 제한 안내 누락');
  h.assert(!source.includes('이 단원은 자료를 읽는 화면의 구조를 보여 줍니다.'), '보류 자료의 본문이 교안 출력에 노출됨');
  await page.screenshot({ path: h.artifact('safety-hold-plan-warning.png'), fullPage: true });
});

suite('reader-print-rights', async function (page, h) {
  await h.goto('/library/demo-violin-textbook/units/demo-violin-textbook-v1-unit-1');
  await page.waitForFunction(storageKey => !!localStorage.getItem(storageKey), h.key);
  await page.evaluate(storageKey => { const state = JSON.parse(localStorage.getItem(storageKey)); state.data.readingAssets.find(asset => asset.id === 'demo-violin-textbook-structured').rights.allowPrint = false; localStorage.setItem(storageKey, JSON.stringify(state)); }, h.key);
  await page.reload(); await h.visible(page.getByRole('heading', { name: '자료를 열기 전에', exact: true }));
  h.assert(await page.getByRole('button', { name: '이 자료 출력', exact: true }).isDisabled(), '자산 출력권이 없는 자료의 출력 버튼이 활성화됨');
  await page.emulateMedia({ media: 'print' });
  const visibility = await page.evaluate(() => { const content = document.querySelector('.reading-content'); const provenance = document.querySelector('.print-provenance'); return { body: getComputedStyle(content).display, provenance: getComputedStyle(provenance).display, restriction: getComputedStyle(provenance, '::after').content, text: provenance.textContent }; });
  h.assert(visibility.body === 'none' && visibility.provenance !== 'none', '인쇄 CSS가 제한 본문을 숨기고 출처를 남기지 않음');
  h.assert(visibility.restriction.includes('인쇄 권한') && visibility.text.includes('출처:'), '인쇄 제한·출처 표시 누락');
  await page.screenshot({ path: h.artifact('reader-print-rights.png'), fullPage: true });
});

for (const [name, route] of [['home', '/'], ['reader', '/library/demo-violin-textbook/units/demo-violin-textbook-v1-unit-1'], ['plan', '/teacher/plans/plan-violin-demo'], ['admin', '/admin/apps']]) {
  suite(`responsive-${name}`, async function (page, h, input) {
    await h.goto(input.route); await page.getByRole('main').waitFor();
    for (const width of [320, 360, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await h.noOverflow(`${input.name} ${width}px`); await page.screenshot({ path: h.artifact(`${input.name}-${width}.png`), fullPage: true });
      if (width === 320 && input.name === 'home') { await page.getByRole('button', { name: '메뉴 열기', exact: true }).click(); await h.visible(page.getByRole('navigation', { name: '주 메뉴', exact: true })); await page.keyboard.press('Escape'); if (await page.getByRole('navigation', { name: '주 메뉴', exact: true }).isVisible()) await page.getByRole('button', { name: '메뉴 닫기', exact: true }).first().click(); }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (input.name === 'reader') { for (let index = 0; index < 4; index++) await page.getByRole('button', { name: '글자 확대', exact: true }).click(); await h.noOverflow('단원 글자 확대 200%'); h.assert(await page.getByRole('button', { name: '글자 확대', exact: true }).isDisabled(), '200% 글자 확대 상한 불일치'); await page.screenshot({ path: h.artifact('reader-text-200-percent.png'), fullPage: true }); }
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; }); await h.noOverflow(`${input.name} 페이지 CSS 확대 200%`); await page.screenshot({ path: h.artifact(`${input.name}-page-200-percent.png`), fullPage: true });
  }, { input: { name, route } });
}

function browserCode(specification) {
  return `async (page) => {
    const context = await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const target = await context.newPage(); target.setDefaultTimeout(8000); target.setDefaultNavigationTimeout(15000);
    const attempted = []; const pageErrors = []; const permissionAttempts = [];
    await context.exposeFunction('__prototypeRecordPermission', kind => permissionAttempts.push(kind));
    context.on('page', p => p.on('pageerror', error => pageErrors.push(error.message))); target.on('pageerror', error => pageErrors.push(error.message));
    await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin === ${JSON.stringify(new URL(base).origin)}) return route.continue(); attempted.push(route.request().url()); return route.abort(); });
    await context.addInitScript(() => {
      window.__prototypePermissionCalls = 0;
      const denied = kind => () => { window.__prototypePermissionCalls++; void window.__prototypeRecordPermission(kind); return Promise.reject(new Error('Unexpected device permission request')); };
      if (navigator.mediaDevices) { navigator.mediaDevices.getUserMedia = denied('getUserMedia'); navigator.mediaDevices.getDisplayMedia = denied('getDisplayMedia'); }
      if (navigator.geolocation) { navigator.geolocation.getCurrentPosition = denied('geolocation'); navigator.geolocation.watchPosition = denied('geolocation-watch'); }
    });
    const h = {
      base:${JSON.stringify(base)},key:${JSON.stringify(key)},artifact:name=>${JSON.stringify(output)}+'/'+name,
      assert:(condition,message)=>{if(!condition)throw new Error(message)},
      visible:locator=>locator.waitFor({state:'visible'}),
      waitCount:async(locator,count)=>{await target.waitForFunction(({selector,count})=>document.querySelectorAll(selector).length===count,{selector:'body',count:1});for(let i=0;i<40;i++){if(await locator.count()===count)return;await target.waitForTimeout(100)}throw new Error('요소 수 불일치: '+await locator.count()+' expected '+count)},
      attr:async(locator,name,value)=>{for(let i=0;i<40;i++){if(await locator.getAttribute(name)===value)return;await target.waitForTimeout(100)}throw new Error(name+' 값 불일치')},
      goto:async path=>{await target.goto(${JSON.stringify(base)}+path);await target.locator('.loading-state').waitFor({state:'hidden'});},
      noOverflow:async label=>{const sizes=await target.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,trouble:[...document.querySelectorAll('body *')].filter(element=>element.getBoundingClientRect().right>innerWidth+1&&element.getBoundingClientRect().width>0&&element.children.length===0).slice(0,6).map(element=>({tag:element.tagName,className:element.className,text:element.textContent.slice(0,60),right:element.getBoundingClientRect().right}))}));if(sizes.width>sizes.viewport+1)throw new Error(label+' 가로 넘침 '+JSON.stringify(sizes))}
    };
    try {
      await (${specification.operation.toString()})(target,h,${JSON.stringify(specification.input ?? null)});
      h.assert(attempted.length===0,'외부 요청 발생: '+attempted.join(', '));
      h.assert(permissionAttempts.length===0 && await target.evaluate(()=>window.__prototypePermissionCalls||0)===0,'기기 권한 요청 발생: '+permissionAttempts.join(', '));
      h.assert(pageErrors.length===0,'브라우저 오류: '+pageErrors.join(' / '));
      return {suite:${JSON.stringify(specification.name)},passed:true,browserVersion:context.browser().version(),externalRequests:attempted.length,permissionCalls:0};
    } catch(error) { await target.screenshot({path:${JSON.stringify(join(output, `failure-${specification.name}.png`))},fullPage:true}).catch(()=>{}); throw error; }
    finally { await context.close(); }
  }`;
}

const report = { cliPackage, nodeVersion: process.version, base, session, zoomChecks: 'Reader text 200% and CSS page zoom 2; native browser zoom is not automated.', startedAt: new Date().toISOString(), results: [] };
try {
  const version = await cli(['--version']); cacheReady = true; console.log(`Playwright CLI ${version.stdout.trim()} · ${base}`);
  await cli(['close'], { tolerateFailure: true }); await cli(['open', 'about:blank']);
  for (const specification of suites.filter(item => !selected || item.name === selected)) {
    process.stdout.write(`검증 ${specification.name}… `); const started = Date.now();
    try {
      const codePath = join(output, `${specification.name}.code.txt`); writeFileSync(codePath, browserCode(specification));
      const result = await cli(['run-code', '--filename', codePath]); writeFileSync(join(output, `${specification.name}.log`), result.stdout + result.stderr);
      const returned = result.stdout.match(/### Result\s*\r?\n([\s\S]*?)(?=\r?\n###|$)/)?.[1];
      const value = returned ? JSON.parse(returned) : null; if (value?.suite !== specification.name || value.passed !== true) throw new Error('CLI 성공 결과를 확인할 수 없습니다. 로그를 확인하세요.');
      report.results.push({ ...value, durationMs: Date.now() - started }); console.log('성공');
    } catch (error) { report.results.push({ suite: specification.name, passed: false, durationMs: Date.now() - started, error: error.message }); console.log('실패'); console.error(error.message); }
  }
  if (report.results.length === 0) throw new Error(`해당 검증 묶음이 없습니다: ${selected}`);
} catch (error) { report.error = error.message; console.error(error.message); }
finally { await cli(['close'], { tolerateFailure: true }).catch(() => {}); report.finishedAt = new Date().toISOString(); writeFileSync(join(output, reportFilename), JSON.stringify(report, null, 2)); }
const passed = report.results.filter(result => result.passed).length; console.log(`${passed}/${report.results.length} 검증 성공 · output/playwright/${reportFilename}`);
if (report.error || report.results.some(result => !result.passed)) process.exitCode = 1;
