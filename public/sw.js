// Only cache immutable public textbook assets. Never cache identities or API records.
const CACHE='lesson-textbooks-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith('/textbooks/'))return;event.respondWith(caches.open(CACHE).then(async cache=>{const found=await cache.match(event.request);try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response}catch{if(found)return found;return Response.error()}}))});
