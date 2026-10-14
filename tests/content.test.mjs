import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const textbooks=JSON.parse(fs.readFileSync('public/data/textbooks.json','utf8'));
const registry=JSON.parse(fs.readFileSync('public/data/webapp_registry.json','utf8'));
test('all 14 actual books and all 631 pages are present with searchable original content',()=>{
 assert.equal(Object.keys(textbooks).length,14);
 assert.equal(Object.values(textbooks).reduce((n,b)=>n+b.pages.length,0),631);
 for(const [id,book] of Object.entries(textbooks)){
  assert.equal(book.pages.length,book.pageCount);
  assert.ok(['drive.google.com','docs.google.com'].includes(new URL(book.sourceUrl).hostname));assert.ok(book.sourceUrl.includes(book.driveId));
  assert.ok(book.toc.every(t=>Number.isInteger(t.page)&&t.page>=1&&t.page<=book.pages.length));
  for(const [i,page] of book.pages.entries()){
   assert.equal(page.number,i+1,`${id} order`);
   assert.ok(typeof page.text==='string'&&page.text.trim().length>0,`${id} ${i} text`);
   const p=path.resolve('public',page.image.slice(1));
   assert.ok(p.startsWith(root+'/public/textbooks/'));
   const bytes=fs.statSync(p).size;assert.ok(bytes>100&&bytes<25*1024*1024);
   const svg=fs.readFileSync(p,'utf8');assert.ok(svg.includes('<svg'));assert.ok(!/<script\b/i.test(svg));
  }
 }
});
test('all 38 source URLs are distinct HTTPS registry entries across five app families',()=>{
 assert.equal(registry.length,38);assert.equal(new Set(registry.map(a=>a.id)).size,38);assert.equal(new Set(registry.map(a=>a.url)).size,38);
 const counts={};for(const app of registry){assert.equal(new URL(app.url).protocol,'https:');counts[app.category]=(counts[app.category]||0)+1;}
 assert.deepEqual(counts,{strings:2,woodwinds:9,brass:1,folk:14,studio:12});
});
