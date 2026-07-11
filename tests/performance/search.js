import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuration du test (VUs, durée, thresholds)
export const options = {
    vus: 10,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500'], // p95 < 500ms
        http_req_failed: ['rate<0.01'],    // error rate < 1%
    },
};

// 2. Scénario que chaque VU exécute en boucle
export default function () {
    const res = http.get('https://api.deezer.com/search?q=daft+punk');
    const body = JSON.parse(res.body);

  // 3. Vérifications ponctuelles (pas des thresholds globaux)
    check(res, {
        'status is 200': (r) => r.status === 200,
        'not rate limited': () => !body.error,
        'has results': () => body.data && body.data.length > 0,
    });

    sleep(1); // pause de 1 seconde entre les itérations
}