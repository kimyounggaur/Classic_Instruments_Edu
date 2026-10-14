import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeWorkspace, sameState, cacheStorageKey } from './state-sync.ts';
const empty=()=>({progress:{},bookmarks:{},favorites:[],registry:[],videos:[],reviews:[],questions:[],reports:[]});
const report=(id,note=id)=>({id,instrument:'violin',minutes:5,note,createdAt:'2026-10-14T00:00:00Z'});
test('initial remote hydration is unchanged and needs no write',()=>{
 const remote={...empty(),favorites:['violin'],reports:[report('remote')]};
 assert.ok(sameState(mergeWorkspace(remote,remote,remote),remote));
});
test('concurrent additions from two devices survive conflict rebase',()=>{
 const base=empty();const local={...base,reports:[report('local')],favorites:['cello']};const remote={...base,reports:[report('remote')],favorites:['violin']};
 const merged=mergeWorkspace(base,local,remote);
 assert.deepEqual(merged.reports.map(x=>x.id),['remote','local']);assert.deepEqual(merged.favorites,['violin','cello']);
});
test('only explicitly changed map entries and deletions overwrite remote state',()=>{
 const base={...empty(),bookmarks:{violin:[1],cello:[2]},favorites:['violin','cello'],reports:[report('a'),report('b')]};
 const local={...base,bookmarks:{violin:[1,3],cello:[2]},favorites:['cello'],reports:[report('b')]};
 const remote={...base,bookmarks:{violin:[1],cello:[2,4],flute:[3]},favorites:['violin','cello','flute'],reports:[report('a'),report('b','changed remotely'),report('c')]};
 const merged=mergeWorkspace(base,local,remote);
 assert.deepEqual(merged.bookmarks,{violin:[1,3],cello:[2,4],flute:[3]});
 assert.deepEqual(merged.favorites,['cello','flute']);assert.deepEqual(merged.reports.map(x=>x.id),['b','c']);assert.equal(merged.reports[0].note,'changed remotely');
});
test('edits made while a PUT is in flight survive normalized server response',()=>{
 const sent={...empty(),reports:[report('a',' note ')]};
 const pending={...sent,reports:[...sent.reports,report('b')]};
 const server={...sent,reports:[report('a','note')]};
 const merged=mergeWorkspace(sent,pending,server);
 assert.equal(merged.reports[0].note,'note');assert.equal(merged.reports[1].id,'b');
});
test('cache namespaces isolate verified accounts and reject unknown identities',()=>{
 assert.notEqual(cacheStorageKey('a'.repeat(32)),cacheStorageKey('b'.repeat(32)));
 for(const key of ['', 'guest', '../other-user', 'a'.repeat(31)])assert.throws(()=>cacheStorageKey(key));
});
