import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const artifacts = process.env.MAGIDESK_ARTIFACTS;
async function setup(t, options = {}) {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const context = await browser.newContext({viewport:{width:1440,height:1000},...options});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(`${base}/projects/magidesk`);
  await page.getByRole('heading', {level:1}).waitFor();
  return page;
}
const main = page => page.getByRole('group',{name:'主功能',exact:true});
const stage = page => page.locator('#experience [data-demo]');
const selected = (page,name) => main(page).getByRole('button',{name:new RegExp(name)});
async function screenshot(page,name,fullPage=false) {if(artifacts){await mkdir(artifacts,{recursive:true});await page.screenshot({path:`${artifacts}/${name}.png`,fullPage});}}
async function choose(page,name) {await selected(page,name).click();await stage(page).scrollIntoViewIfNeeded();}
async function sub(page,name) {await page.getByRole('group',{name:/子能力$/}).getByRole('button',{name,exact:true}).click();}

test('hover debounce, pinned selection, single playback, replay and offscreen pause', {timeout:60000}, async t => {
  const page = await setup(t);
  await screenshot(page,'desktop-hero');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await selected(page,'快速网格').hover();
  await page.waitForTimeout(90);
  assert.equal(await selected(page,'窗口拖动').getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(220);
  assert.equal(await selected(page,'快速网格').getAttribute('aria-pressed'),'true');
  await stage(page).hover();
  assert.equal(await selected(page,'快速网格').getAttribute('aria-pressed'),'true');
  await choose(page,'窗口拖动');
  await selected(page,'Dock').hover();
  await page.waitForTimeout(300);
  assert.equal(await selected(page,'窗口拖动').getAttribute('aria-pressed'),'true');
  await sub(page,'右键缩放');
  await page.getByRole('button',{name:'重播当前演示',exact:true}).click();
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='2');
  assert.ok(await page.locator('[data-running=true]').count()<=1);
  await screenshot(page,'desktop-experience');
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForTimeout(100);
  const phase = await stage(page).getAttribute('data-phase');
  await page.waitForTimeout(1200);
  assert.equal(await stage(page).getAttribute('data-phase'),phase);
  assert.equal(await page.locator('[data-running=true]').count(),0);
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  await page.waitForTimeout(500);
  assert.equal(await stage(page).getAttribute('data-phase'),'3');
  await page.getByRole('button',{name:'重播当前演示',exact:true}).click();
  assert.equal(await stage(page).getAttribute('data-phase'),'0');
  await choose(page,'窗口分区');await choose(page,'桌面盒子');await choose(page,'浏览器微标');
  assert.equal(await stage(page).getAttribute('data-demo'),'badges:avatar');
  assert.equal(await page.locator('#experience [data-demo]').count(),1);
  await page.getByRole('group',{name:/子能力$/}).getByRole('button',{name:'头像样式'}).focus();
  assert.equal(await stage(page).getAttribute('data-demo'),'badges:style');
});

test('all capabilities render static final states and controls alter real visual outcomes', {timeout:60000}, async t => {
  const page = await setup(t,{reducedMotion:'reduce'});
  const matrix = [
    ['窗口拖动',['任意位置移动','右键缩放']],
    ['边缘吸附',['工作区边缘','其他窗口边缘','对齐线提示']],
    ['窗口分区',['拖动入区','编辑布局','切换布局','多屏分配']],
    ['快速网格',['当前屏幕','多个屏幕','窗口居中']],
    ['浏览器微标',['尺寸与名称','浏览器位置','头像样式','穿透与复制']],
    ['Dock',['Dock 与任务栏','换行与滚动','分组样式']],
    ['桌面盒子',['手动整理','折叠与展开','自动归类']],
  ];
  for(const [name,capabilities] of matrix){
    await choose(page,name);
    for(const capability of capabilities){await sub(page,capability);assert.equal(await stage(page).getAttribute('data-phase'),'3');assert.equal(await stage(page).getAttribute('data-running'),'false');}
    await screenshot(page,`reduced-${await stage(page).getAttribute('data-demo')}`.replace(':','-'));
  }
  await choose(page,'快速网格');await sub(page,'多个屏幕');

  await choose(page,'浏览器微标');await sub(page,'尺寸与名称');
  assert.equal(await stage(page).locator('[data-sim-badge][data-has-name=false]').count(),2);
  await choose(page,'Dock');
  assert.equal(await stage(page).locator('[data-dock-mode=taskbar]').count(),1);
  await choose(page,'桌面盒子');await sub(page,'折叠与展开');
  assert.equal(await stage(page).locator('[data-box]').count(),2);
  assert.equal(await stage(page).locator('[data-collapsed=false]').count(),1);
  await sub(page,'自动归类');
  assert.equal(await stage(page).locator('[data-classification-tabs]').count(),1);
  assert.equal(await page.locator('[data-running=true]').count(),0);
});

test('touch layout, download destinations and keyboard access', {timeout:60000}, async t => {
  const page = await setup(t,{viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await screenshot(page,'mobile-full',true);
  await choose(page,'窗口分区');await sub(page,'多屏分配');
  await screenshot(page,'mobile-monitors');
  await choose(page,'Dock');
  await sub(page,'Dock 与任务栏');
  assert.equal(await stage(page).locator('[data-dock-mode=taskbar]').count(),1);
  await choose(page,'窗口拖动');await sub(page,'右键缩放');
  assert.equal(await stage(page).locator('kbd').first().textContent(),'Alt');
  assert.equal(await page.getByRole('link',{name:'下载测试版',exact:true}).getAttribute('href'),'/downloads/magidesk/windows');
  assert.equal(await page.getByRole('link',{name:'反馈问题 ↗',exact:true}).getAttribute('href'),'https://github.com/ninetyeights/MagiDesk/issues');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'重播当前演示',exact:true}).tap();
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  assert.equal(await stage(page).getAttribute('data-phase'),'3');
});




test('zone editor reproduces reset, equal distribution and linked versus local divider motion', {timeout:90000}, async t => {
  const page=await setup(t);
  await choose(page,'窗口分区');await sub(page,'编辑布局');
  const actions=page.getByRole('group',{name:'编辑操作',exact:true});
  const waitPhase=async phase=>page.waitForFunction(value=>document.querySelector('#experience [data-demo]')?.dataset.phase===value,String(phase));
  const selectAction=async name=>{await actions.getByRole('button',{name,exact:true}).click();await stage(page).scrollIntoViewIfNeeded();};
  await page.getByRole('button',{name:'重播当前演示',exact:true}).click();
  await stage(page).scrollIntoViewIfNeeded();
  await waitPhase(1);
  assert.equal(await stage(page).locator('[data-reset-popover]').count(),1);
  assert.equal(await stage(page).locator('[data-zone-cell]').count(),4);
  assert.equal(await stage(page).locator('[data-reset-rows]').textContent(),'2');
  assert.equal(await stage(page).locator('[data-reset-columns]').textContent(),'2');
  await waitPhase(2);
  assert.equal(await stage(page).locator('[data-zone-cell]').count(),6);
  assert.equal(await stage(page).locator('[data-reset-columns]').textContent(),'3');
  await waitPhase(3);
  assert.equal(await stage(page).locator('[data-zone-cell]').count(),9);
  assert.equal(await stage(page).locator('[data-reset-rows]').textContent(),'3');
  assert.equal(await page.getByRole('combobox').count(),0);
  await screenshot(page,'editor-reset');
  await selectAction('平均分配');
  await waitPhase(0);
  const original=await stage(page).locator('[data-zone-cell]').evaluateAll(nodes=>nodes.map(node=>parseFloat(node.style.width)));
  assert.notEqual(original[0],original[2]);
  await waitPhase(1);
  assert.equal(await stage(page).locator('[data-zone-selected=true]').count(),4);
  assert.equal(await stage(page).locator('[data-zone-marquee]').evaluate(node=>node.style.opacity),'1');
  await screenshot(page,'editor-even-selection');
  await waitPhase(3);
  const distributed=await stage(page).locator('[data-zone-cell]').evaluateAll(nodes=>nodes.map(node=>({w:parseFloat(node.style.width),h:parseFloat(node.style.height)})));
  assert.equal(distributed.length,6);
  assert.ok(distributed.slice(0,4).every(rect=>rect.w===36&&rect.h===50));
  assert.deepEqual(distributed.slice(4),[{w:28,h:64},{w:28,h:36}]);
  await screenshot(page,'editor-even');
  for(const [name,action,linked] of [['设为全局联动','global',true],['取消联动','local',false]]) {
    await selectAction(name);await waitPhase(1);
    assert.equal(await stage(page).locator('[data-divider-menu]').count(),1);
    assert.match(await stage(page).textContent(),/右键分割线/);
    await screenshot(page,`editor-${action}-menu`);
    await waitPhase(3);
    assert.equal(await stage(page).locator('[data-divider-menu]').count(),0);
    const top=await stage(page).locator('[data-divider=top]').evaluate(node=>parseFloat(node.style.left));
    const bottom=await stage(page).locator('[data-divider=bottom]').evaluate(node=>parseFloat(node.style.left));
    assert.equal(top,64);
    assert.equal(bottom,linked?64:48);
    assert.equal(await stage(page).locator('[data-editor-action]').getAttribute('data-linked'),String(linked));
    await screenshot(page,`editor-${action}-result`);
  }
  await selectAction('切割与调整');
  await waitPhase(1);
  await page.waitForTimeout(200);
  const splitting=await stage(page).locator('[data-zone-cell]').evaluateAll(nodes=>{
    const container=nodes[0].parentElement.getBoundingClientRect();
    return nodes.map(node=>{const rect=node.getBoundingClientRect();return {width:rect.width/container.width,left:rect.left,right:rect.right};});
  });
  assert.ok(splitting[0].width>.5&&splitting[0].width<1, 'first zone is shrinking');
  assert.ok(splitting[1].width>0&&splitting[1].width<.5, 'second zone is expanding, not appearing at final width');
  assert.ok(Math.abs(splitting[0].right-splitting[1].left)<2, 'both zones share the moving divider');
  await waitPhase(3);
  assert.equal(await stage(page).locator('[data-zone-cell]').count(),2);
  await page.emulateMedia({reducedMotion:'reduce'});
  await selectAction('重置网格');
  assert.equal(await stage(page).locator('[data-zone-cell]').count(),9);
  await page.setViewportSize({width:390,height:844});
  await selectAction('取消联动');
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  assert.equal(await stage(page).getAttribute('data-running'),'false');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  assert.equal(await stage(page).locator('[data-divider-menu]').count(),0);
  await screenshot(page,'editor-mobile-local');
  await selectAction('重置网格');
  await stage(page).scrollIntoViewIfNeeded();
  await screenshot(page,'editor-mobile-reset');
});





test('layout switches by illustrated wheel during drag and names the active layout', {timeout:30000}, async t => {
  const page=await setup(t);
  await choose(page,'窗口分区');
  await sub(page,'切换布局');
  await stage(page).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
  assert.equal(await stage(page).locator('[data-layout-name]').textContent(),'主辅布局');
  assert.equal(await stage(page).locator('[data-sim-window]').count(),1);
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='2');
  assert.equal(await stage(page).locator('[data-layout-name]').textContent(),'三栏布局');
  assert.equal(await stage(page).locator('[data-wheel-cue]').count(),1);
  await screenshot(page,'layout-wheel');
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  assert.equal(await stage(page).locator('[data-wheel-cue]').count(),0);
  assert.equal(await stage(page).locator('[data-sim-window]').evaluate(el=>el.style.width),'30%');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await stage(page).locator('[data-layout-name]').textContent(),'三栏布局');
});

test('each monitor contains a window that fills its own layout', {timeout:30000}, async t=>{
  const page=await setup(t);
  await choose(page,'窗口分区');await sub(page,'多屏分配');
  await stage(page).scrollIntoViewIfNeeded();
  assert.equal(await stage(page).locator('[data-sim-window]').count(),2);
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  for(const [monitor,width] of [['1','46%'],['2','59%']]){
    const window=stage(page).locator('[data-monitor="'+monitor+'"] [data-sim-window]');
    assert.equal(await window.evaluate(el=>el.style.width),width);
    assert.equal(await window.evaluate(el=>el.style.height),'92%');
  }
  await page.waitForTimeout(1100);
  await screenshot(page,'monitors-windows');
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await stage(page).scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await screenshot(page,'monitors-mobile');
});

test('quick grid automatically shows distinct 16:9 display grids', {timeout:30000}, async t=>{
  const page=await setup(t);
  await choose(page,'快速网格');await stage(page).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
  assert.equal(await stage(page).locator('[data-screen]').count(),1);
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  assert.equal(await stage(page).locator('[data-screen]').count(),1);
  await sub(page,'多个屏幕');
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
  assert.equal(await stage(page).locator('[data-screen]').count(),3);
  await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
  assert.equal(await page.getByRole('group',{name:'目标屏幕',exact:true}).count(),0);
  assert.equal(await page.getByRole('group',{name:'网格密度',exact:true}).count(),0);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    await stage(page).scrollIntoViewIfNeeded();
    for(const [id,cols,rows] of [['3',2,2],['2',4,3],['1',6,4]]){
      const screen=stage(page).locator('[data-screen="'+id+'"]');
      assert.equal(await screen.getAttribute('data-cols'),String(cols));
      assert.equal(await screen.getAttribute('data-rows'),String(rows));
      const box=await screen.boundingBox();
      assert.ok(Math.abs(box.width/box.height-16/9)<.03);
    }
    await screenshot(page,'quick-grid-auto-'+width);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await stage(page).locator('[data-screen]').count(),3);
});

test('browser badges automatically demonstrate settings without editable controls', {timeout:30000}, async t=>{
 const page=await setup(t);
 await choose(page,'浏览器微标');await stage(page).scrollIntoViewIfNeeded();
 assert.equal(await page.locator('#experience input').count(),0);
 const chrome=()=>stage(page).locator('[data-badge-browser=chrome]');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
 assert.equal(await chrome().evaluate(el=>el.style.getPropertyValue('--badge-size')),'40px');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='2');
 assert.equal(await chrome().evaluate(el=>el.style.getPropertyValue('--badge-size')),'64px');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.equal(await chrome().getAttribute('data-has-name'),'false');
 await page.emulateMedia({reducedMotion:'reduce'});
 await sub(page,'浏览器位置');
 assert.equal(await chrome().evaluate(el=>el.style.right),'20%');
 assert.equal(await stage(page).locator('[data-badge-browser=edge]').evaluate(el=>el.style.right),'38%');
 await sub(page,'头像样式');
 assert.equal(await stage(page).locator('[data-avatar-image]').count(),1);
 await screenshot(page,'badges-auto');
 await page.setViewportSize({width:390,height:844});
 await stage(page).scrollIntoViewIfNeeded();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await screenshot(page,'badges-auto-mobile');
});

test('badge copy demonstrates pass-through, Ctrl click and copy feedback', {timeout:20000}, async t=>{
 const page=await setup(t);
 await choose(page,'浏览器微标');await sub(page,'穿透与复制');await stage(page).scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
 assert.equal(await stage(page).locator('[data-copy-badge]').getAttribute('data-pass-through'),'true');
 assert.equal(await stage(page).locator('[data-under-tab]').getAttribute('data-under-tab'),'true');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='2');
 assert.equal(await stage(page).locator('[data-copy-badge]').getAttribute('data-pass-through'),'false');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.match(await stage(page).locator('[data-copy-result]').textContent(),/已复制：工作 · 林/);
 assert.equal(await stage(page).locator('[data-copy-badge]').getAttribute('data-pass-through'),'true');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await stage(page).scrollIntoViewIfNeeded();
 await screenshot(page,'badge-copy-mobile');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
});

test('Dock automatically switches mode, wraps, scrolls and styles groups', {timeout:30000}, async t=>{
 const page=await setup(t);
 await choose(page,'Dock');await stage(page).scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
 assert.equal(await stage(page).locator('[data-dock-mode=floating]').count(),1);
 const dockTop=(await stage(page).locator('[data-dock-mode]').boundingBox()).y;
 const windowTop=(await stage(page).locator('[data-sim-window]').boundingBox()).y;
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.equal(await stage(page).locator('[data-dock-mode=taskbar]').count(),1);
 assert.equal(await stage(page).locator('[data-sim-window]').evaluate(el=>el.style.top),'24%');
 assert.ok(Math.abs((await stage(page).locator('[data-dock-mode]').boundingBox()).y-dockTop)<1);
 assert.ok((await stage(page).locator('[data-sim-window]').boundingBox()).y>windowTop);
 await sub(page,'换行与滚动');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
 assert.equal(await stage(page).locator('[data-wrapped=true]').count(),1);
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.equal(await stage(page).locator('[data-scrolled=true]').count(),1);
 assert.match(await stage(page).locator('[data-scrolled=true]').evaluate(el=>getComputedStyle(el).transform),/matrix\(1, 0, 0, 1, 0, 0\)/);
 await sub(page,'分组样式');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1');
 assert.equal(await stage(page).locator('[data-group-style=line]').count(),1);
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='2');
 assert.equal(await stage(page).locator('[data-group-style=label]').count(),1);
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.equal(await stage(page).locator('[data-group-style=border]').count(),1);
 assert.equal(await stage(page).locator('button,input,select').count(),0);
 await screenshot(page,'dock-groups-auto');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await stage(page).scrollIntoViewIfNeeded();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await screenshot(page,'dock-groups-mobile');
});

test('desktop boxes automatically organize, collapse and classify beside a second box', {timeout:30000}, async t=>{
 const page=await setup(t);
 await choose(page,'桌面盒子');await stage(page).scrollIntoViewIfNeeded();
 assert.equal(await stage(page).locator('[data-box]').count(),2);
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.match(await stage(page).locator('[data-box=design]').textContent(),/设计稿.fig/);
 await sub(page,'折叠与展开');await stage(page).scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='1',{},{timeout:8000});
 assert.equal(await stage(page).locator('[data-box=design]').getAttribute('data-collapsed'),'true');
 await page.waitForFunction(()=>document.querySelector('#experience [data-demo]')?.dataset.phase==='3');
 assert.equal(await stage(page).locator('[data-box=design]').getAttribute('data-collapsed'),'false');
 await page.emulateMedia({reducedMotion:'reduce'});
 await sub(page,'自动归类');
 assert.match(await stage(page).textContent(),/实际文件路径不变/);
 assert.equal(await page.locator('#experience input, #experience select').count(),0);
 await screenshot(page,'boxes-classify');
 await page.setViewportSize({width:390,height:844});
 await stage(page).scrollIntoViewIfNeeded();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await screenshot(page,'boxes-mobile');
});

test('project logos load from original assets on list and detail pages', {timeout:30000}, async t=>{
 const page=await setup(t);
 for(const path of ['/projects','/projects/audiodeviceswitcher','/projects/lyricdrop','/projects/magidesk']){
   await page.goto(base+path);
   const logos=page.locator('img[src*="/projects/"][src*="logo."]');
   assert.ok(await logos.count()>0);
   for(const logo of await logos.all()){
     await logo.scrollIntoViewIfNeeded();
     await logo.evaluate(img=>img.decode());
     assert.ok(await logo.evaluate(img=>img.naturalWidth>0));
   }
   await page.setViewportSize({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
   if(path==='/projects')await screenshot(page,'project-logos-mobile',true);
 }
});

test('latest downloads redirect to real platform files without opening release pages', {timeout:60000}, async t=>{
 const page=await setup(t);
 for(const [path,extension] of [['magidesk/windows','.exe'],['audiodeviceswitcher/windows','.exe'],['lyricdrop/macos','.dmg'],['lyricdrop/windows','.zip']]){
   const response=await page.request.get(base+'/downloads/'+path,{maxRedirects:0});
   assert.equal(response.status(),302,await response.text());
   const location=response.headers().location;
   assert.equal(new URL(location).origin,'https://github.com'); assert.ok(new URL(location).pathname.includes('/releases/download/'));
   assert.ok(location.endsWith(extension));
   assert.equal(response.headers()['cache-control'],'no-store');
 }
 const missing=await page.request.get(base+'/downloads/unknown/windows',{maxRedirects:0});
 assert.equal(missing.status(),404);
});
