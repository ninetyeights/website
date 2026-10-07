import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function setup(t) {
  const browser = await chromium.launch(); t.after(()=>browser.close());
  const page = await browser.newPage({permissions:['clipboard-read','clipboard-write']});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); t.after(()=>assert.deepEqual(errors,[]));
  await page.goto(`${base}/tools/link-extract`); return page;
}
async function paste(page, html) {
  await page.locator('#link-input').evaluate((el,html)=>{
    const data=new DataTransfer();data.setData('text/html',html);data.setData('text/plain','table');
    el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  },html);
  await page.waitForTimeout(400);
}

test('oversized merged ranges fail visibly and normal tables recover', {timeout:60000}, async t=>{
  const page=await setup(t);
  for (const html of [
    '<table><tr><td colspan="999999999">x</td></tr></table>',
    '<table><tr><td rowspan="10001">x</td></tr></table>',
    '<table><tr><td colspan="256" rowspan="0">x</td></tr>' + '<tr></tr>'.repeat(195) + '</table>',
    '<table>' + '<tr><td>x</td></tr>'.repeat(10001) + '</table>',
  ]) {
    await page.locator('#link-input').fill('');
    await paste(page,html);
    assert.match(await page.getByRole('main').getByRole('alert').textContent(), /容量限制/);
    assert.equal(await page.locator('#table-output').inputValue(),'');
    assert(await page.getByRole('button',{name:'导出表格 CSV'}).isDisabled());
  }
  await page.locator('#link-input').fill('');
  await paste(page,'<table><tr><td colspan="256">x</td></tr></table>');
  assert(await page.getByRole('button',{name:'导出表格 CSV'}).isEnabled());
  await page.locator('#link-input').fill('');
  await paste(page,'<table><tr><td colspan="250" rowspan="0">x</td></tr>' + '<tr></tr>'.repeat(199) + '</table>');
  assert.match(await page.getByRole('status').filter({hasText:'200 行'}).textContent(), /200 行 × 250/);
  assert(await page.getByRole('button',{name:'导出表格 CSV'}).isEnabled());
});
test('sparse table clipboard preserves rows, columns, duplicates and expands selected fields', {timeout:60000}, async t=>{
  const page=await setup(t);
  await paste(page,'<table><tr><td><a href="https://e.test/a">A</a></td><td></td><td><a href="https://e.test/a">A again</a></td></tr><tr><td></td><td></td><td></td></tr><tr><td>文字</td><td><a href="https://e.test/b">B</a> https://e.test/c</td><td></td></tr></table>');
  assert.equal(await page.getByLabel('无链接单元格保留文字',{exact:true}).isChecked(),false);
  assert.equal(await page.locator('#table-output').inputValue(),'https://e.test/a\t\thttps://e.test/a\n\t\t\n\t"https://e.test/b\nhttps://e.test/c"\t');
  await page.getByLabel('无链接单元格保留文字',{exact:true}).check();await page.waitForTimeout(400);
  await page.getByRole('button',{name:'复制完整表格'}).click();
  await page.getByText('已复制完整表格，可粘贴到表格软件。',{exact:true}).waitFor();
  const html=await page.evaluate(async()=>{const items=await navigator.clipboard.read();return (await items[0].getType('text/html')).text();});
  const shape=await page.evaluate(html=>{const t=document.createElement('template');t.innerHTML=html;return [...t.content.querySelectorAll('tr')].map(r=>[...r.children].map(c=>c.textContent));},html);
  assert.equal(shape.length,3);assert(shape.every(row=>row.length===3));assert.equal(shape[0][1],'');assert.equal(shape[2][0],'文字');
  await page.locator('summary').click(); await page.getByLabel('链接文字（标题）',{exact:true}).check();
  const preview=page.getByRole('region',{name:'表格预览',exact:true});
  assert.equal(await preview.locator('tr').first().locator('td').count(),6);
  await page.getByLabel('无链接单元格保留文字',{exact:true}).uncheck();await page.waitForTimeout(400);
  assert(! (await page.locator('#table-output').inputValue()).includes('文字'));
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出表格 CSV'}).click();
  assert.equal((await download).suggestedFilename(),'extracted-table.csv');
});
test('merged cells flatten with blanks; multiple tables fail visibly; TSV keeps horizontal and vertical layouts', {timeout:60000}, async t=>{
  const page=await setup(t);
  await paste(page,'<table><tr><td rowspan="2">A</td><td colspan="2">B</td></tr><tr><td>C</td><td>D</td></tr></table>');
  await page.getByLabel('无链接单元格保留文字',{exact:true}).check();await page.waitForTimeout(400);
  assert.equal(await page.locator('#table-output').inputValue(),'A\tB\t\n\tC\tD');
  await page.locator('#link-input').fill('<table><tr><td>A</td></tr></table><table><tr><td>B</td></tr></table>');await page.waitForTimeout(400);
  assert.match(await page.getByRole('main').getByRole('alert').textContent(),/多个或嵌套表格/);
  for(const input of ['A\tB\tC','A\nB\nC','\tA\t\n\t\t']){
    await page.locator('#link-input').fill(input);await page.waitForTimeout(400);
    assert.equal(await page.locator('#table-output').inputValue(),input);
  }
  await page.getByRole('button',{name:'链接列表',exact:true}).click();
  await page.getByRole('button',{name:'每行取最后一个（原版预设）'}).click();
  assert.equal(await page.getByRole('button',{name:'链接列表',exact:true}).getAttribute('aria-pressed'),'true');
});

test('plain spreadsheet paste selects table layout automatically and copies trailing blank columns', {timeout:60000}, async t=>{
  const page=await setup(t);
  const text='https://e.test/a\t\thttps://e.test/b\n\t\t';
  await page.evaluate(text=>navigator.clipboard.writeText(text),text);
  await page.locator('#link-input').focus();await page.keyboard.press('Control+V');
  await page.waitForTimeout(400);
  assert.equal(await page.getByRole('button',{name:'保留表格布局',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#table-output').inputValue(),text);
});
