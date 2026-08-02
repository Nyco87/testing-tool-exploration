import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 10,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<1000'], // p95 < 1000ms
        http_req_failed: ['rate<0.01'],    // error rate < 1%
    },
};

export default function () {
    const res = http.get('https://api.deezer.com/chart/0');
    const body = JSON.parse(res.body);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'not rate limited': () => !body.error,
        'charts has tracks': () => body.tracks && body.tracks.data.length > 0,
        'charts has artists': () => body.artists && body.artists.data.length > 0,
        'charts has albums': () => body.albums && body.albums.data.length > 0,
        'charts has playlists': () => body.playlists && body.playlists.data.length > 0,
        'charts has podcasts': () => body.podcasts && body.podcasts.data.length > 0,
    });

    sleep(1); 
}

export function handleSummary(data) {
    return { 'summary-charts.json': JSON.stringify(data) };
}