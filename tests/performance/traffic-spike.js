import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
    stages: [
        { duration: '2m', target: 50 },
    ],
    thresholds: {
        true_errors: ['rate<0.01'], // less than 1% of true errors
        rate_limit_rate: ['rate<0.75'], // less than 75% of requests should be rate limited
    },
};

const trueErrorRate = new Rate('true_errors');
const rateLimitRate = new Rate('rate_limit_rate');

export default function () {
    const res = http.get('https://api.deezer.com/search?q=daft+punk');
    let body;
    let isTrueError;
    let isRateLimit;

    try {
        body = JSON.parse(res.body);
    } catch (e) {
        trueErrorRate.add(true);
        rateLimitRate.add(false);
        check(res, { 'no true error': () => false });
        return;
    }

    if (res.status !== 200) {
        isTrueError = true;
        isRateLimit = false;
    } else if (body.error && body.error.code !== 4) {
        isTrueError = true;
        isRateLimit = false;
    } else if (body.error && body.error.code === 4) {
        isTrueError = false;
        isRateLimit = true;
    } else {
        isTrueError = false;
        isRateLimit = false;
    }

    trueErrorRate.add(isTrueError);
    rateLimitRate.add(isRateLimit);

    check(res, {
        'no true error': () => !isTrueError,
    });

    sleep(1);
}

export function handleSummary(data) {
    return { 'summary-traffic-spike.json': JSON.stringify(data) };
}