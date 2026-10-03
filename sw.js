// Service worker: เก็บตัวแอปไว้ในเครื่อง เปิดได้แม้สัญญาณหลุด (ข้อมูลจากชีตยังต้องออนไลน์ ยกเว้นที่แคชไว้ตอนเข้าครั้งล่าสุด)
const CACHE = 'bps-shell-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                              // คำสั่งเขียนข้อมูล (POST) ไปหลังบ้านโดยตรงเสมอ
  const url = new URL(req.url);
  if (url.hostname === 'script.google.com' || url.hostname.endsWith('googleusercontent.com')) return;   // ไม่แคชข้อมูลจากหลังบ้าน
  if (url.origin === location.origin) {
    // ไฟล์ของแอป: ลองออนไลน์ก่อน (ได้เวอร์ชันใหม่เสมอ) ถ้าไม่ได้ใช้ที่แคช
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // ฟอนต์/ไลบรารีภายนอก: ใช้ของแคชก่อนแล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => hit); return hit || net; }));
});
