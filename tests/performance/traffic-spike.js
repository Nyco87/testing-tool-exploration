import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

export const options = {
    stages: [
        { duration: '2m', target: 50 },
    ],
    thresholds: {
        true_errors: ['rate<0.01'], // less than 1% of true errors
    },
};

const trueErrorRate = new Rate('true_errors');
const rateLimitHits = new Counter('rate_limit_hits');

export default function () {
    const res = http.get('https://api.deezer.com/search?q=daft+punk');
    let body;
    let isTrueError;

    try {
        body = JSON.parse(res.body);
    } catch (e) {
        trueErrorRate.add(true);
        check(res, { 'no true error': () => false });
        return;
    }

    if (res.status !== 200) {
        isTrueError = true;
    } else if (body.error && body.error.code !== 4) {
        isTrueError = true;
    } else if (body.error && body.error.code === 4) {
        rateLimitHits.add(1);
        isTrueError = false;
    } else {
        isTrueError = false;
    }

    trueErrorRate.add(isTrueError);

    check(res, {
        'no true error': () => !isTrueError,
    });

    sleep(1);
}

export function handleSummary(data) {
    return { 'summary-traffic-spike.json': JSON.stringify(data) };
}