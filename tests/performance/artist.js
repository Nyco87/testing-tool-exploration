import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 10,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500'], // p95 < 500ms
        http_req_failed: ['rate<0.01'],    // error rate < 1%
    },
};

export default function () {
    const res = http.get('https://api.deezer.com/artist/27');
    const body = JSON.parse(res.body);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'not rate limited': () => !body.error,
        'has name': () => body.name === 'Daft Punk',
    });

    sleep(1);
}