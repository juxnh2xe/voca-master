// VocaMaster Service Worker for Full Offline Support
const CACHE_NAME = 'vocamaster-cache-v1';

// 핵심 기본 정적 자원 목록
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. 설치(Install): 핵심 에셋 캐싱 및 즉시 활성화 준비
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. 활성화(Activate): 이전 버전 캐시 정리 및 제어권 즉시 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 네트워크 가로채기(Fetch): 오프라인 지원
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 요청만 캐싱 처리 (POST, PUT 등 API 요청은 네트워크 직통)
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Supabase API 등 외부 데이터베이스 통신은 캐시하지 않고 직접 통신
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // (1) 페이지 이동/새로고침 (HTML navigation)
  // 인터넷이 끊겼을 때도 캐시된 index.html을 반환하여 앱이 즉시 렌더링되도록 함
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 온라인이면 최신 HTML 캐시 업데이트 후 반환
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // 오프라인이면 캐시된 index.html 반환
          const cached = await caches.match('/index.html');
          return cached || caches.match('/');
        })
    );
    return;
  }

  // (2) 정적 파일(JS, CSS, 이미지, 폰트 등)
  // Cache First with Network Fallback & Dynamic Cache
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // 캐시에 있으면 즉시 반환하고, 백그라운드에서 최신 버전 fetch 시도 (Stale-While-Revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {
            // 오프라인 시 백그라운드 fetch 실패는 조용히 무시
          });
        return cachedResponse;
      }

      // 캐시에 없으면 네트워크에서 받아온 뒤 캐시에 저장
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // 이미지 등의 오프라인 대체가 필요한 경우
          if (request.destination === 'image') {
            return caches.match('/favicon.svg');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
