// Retire the previous textbook cache; rights-unconfirmed files are no longer public.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{await caches.delete('lesson-textbooks-v1');await self.registration.unregister();})()));
