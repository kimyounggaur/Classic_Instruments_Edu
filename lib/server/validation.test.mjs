import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyState, validateStatePatch, safeHttps, canManageClassroom, hasClassroomAccess, validateMission } from './validation.ts';
const timestamp='2026-10-14T00:00:00.000Z';
test('all workspace fields validate, preserving resume page and metadata',()=>{
 const state={...emptyState(),progress:{violin:{chapterId:'chapter-1',page:3,percent:25,updatedAt:timestamp}},bookmarks:{violin:[1,3,3]},registry:[{id:'custom-1',name:'운지 연습',instrument:'violin',category:'strings',appType:'trainer',url:'https://example.com/practice',description:''}],videos:[{id:'clip-1',title:'기본 자세',instrument:'violin',topic:'posture',front:'https://example.com/front.mp4',side:'',pov:''}],reviews:[{id:'review-1',instrument:'violin',note:'전문가 확인 요청',status:'pending',createdAt:timestamp}],questions:[{id:'q-1',instrument:'violin',text:'질문',createdAt:timestamp}],reports:[{id:'log-1',instrument:'violin',minutes:15,note:'연습',createdAt:timestamp}]};
 const result=validateStatePatch(state);assert.equal(result.progress.violin.page,3);assert.deepEqual(result.bookmarks.violin,[1,3]);assert.equal(result.videos[0].side,'');
});
test('URLs cannot introduce script schemes, credentials, or local endpoints',()=>{
 for(const url of ['javascript:alert(1)','http://example.com','https://user:secret@example.com','https://localhost','https://127.0.0.1','https://2130706433','https://192.168.1.1','https://[::1]'])assert.throws(()=>safeHttps(url));
 assert.equal(safeHttps('https://example.com/video.mp4'),'https://example.com/video.mp4');
});
test('clients cannot issue expert certification or inject arbitrary state keys',()=>{
 assert.throws(()=>validateStatePatch({reviews:[{id:'r',instrument:'flute',note:'',status:'approved',createdAt:timestamp}]}));
 assert.throws(()=>validateStatePatch({role:'teacher'}));
 assert.throws(()=>validateStatePatch(JSON.parse('{"progress":{"__proto__":{}}}')));
 assert.throws(()=>validateStatePatch({progress:{violin:{chapterId:'1',page:0,percent:5,updatedAt:timestamp}}}));
 assert.throws(()=>validateStatePatch({favorites:Array(201).fill('violin')}));
});
test('classroom ownership and participant isolation',()=>{
 assert.equal(canManageClassroom('teacher','teacher'),true);
 assert.equal(canManageClassroom('teacher','student'),false);
 assert.equal(canManageClassroom('',''),false);
 assert.equal(hasClassroomAccess('teacher','student',['student']),true);
 assert.equal(hasClassroomAccess('teacher','stranger',['student']),false);
 assert.equal(hasClassroomAccess('teacher','',['']),false);
});
test('mission is bounded and valid',()=>{
 assert.equal(validateMission({title:'5분 운지 연습',targetMinutes:5}).targetMinutes,5);
 assert.throws(()=>validateMission({title:'',targetMinutes:5}));
 assert.throws(()=>validateMission({title:'연습',targetMinutes:999}));
});
