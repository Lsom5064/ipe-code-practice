'use strict';
const CACHE = 'ipe-code-practice-v1-360-pages';
const PREFIX = 'ipe-code-practice-';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(p=>new URL(p,self.location.href).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
    await self.clients.claim();
    for(const client of await self.clients.matchAll())client.postMessage({type:'OFFLINE_READY'});
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='STATUS')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const ready=(await Promise.all(ASSETS.map(p=>cache.match(new URL(p,self.location.href).href)))).every(Boolean);
    if(ready)event.source?.postMessage({type:'OFFLINE_READY'});
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>response.ok?response:caches.match(new URL('./index.html',self.location.href).href)).catch(()=>caches.match(new URL('./index.html',self.location.href).href)));
  }else{
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
  }
});
