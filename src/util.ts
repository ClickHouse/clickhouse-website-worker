import config from './config';

export function addDefaultHeaders(response: Response) {
  const to_delete = [
    'x-served-by',
    'x-cache',
    'x-cache-hits',
    'x-cache-lab',
    'x-timer',
    'via',
    'x-fastly-request-id',
    'x-github-request-id',
    'x-pages-group',
    'x-proxy-cache',
  ];
  for (let idx in to_delete) {
    response.headers.delete(to_delete[idx]);
  }
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-xss-protection', '1; mode=block');
  response.headers.set(
    'content-security-policy',
    `default-src 'none'; script-src 'self' 'unsafe-eval' cdn.ampproject.org ajax.cloudflare.com static.cloudflareinsights.com *.algolia.net *.algolianet.com mc.yandex.ru; style-src 'self' 'unsafe-inline'; img-src 'self' blog-images.clickhouse.tech data: mc.yandex.ru; object-src 'self' blog-images.clickhouse.tech; connect-src 'self' mc.yandex.ru cdn.ampproject.org *.algolia.net *.algolianet.com *.ingest.sentry.io hn.algolia.com www.reddit.com; child-src blob: mc.yandex.ru; frame-src blob: mc.yandex.ru www.youtube.com datalens.yandex blog-images.clickhouse.tech; font-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors webvisor.com metrika.yandex.ru; prefetch-src 'self'`,
  );
  const location = response.headers.get('location');
  if (location && location.indexOf(config.origin) >= 0) {
    response.headers.set(
      'location',
      location.replace(config.origin, config.domain),
    );
  }
}

export function changeUrl(req: Request, new_url: URL): Request {
  const { headers, method, redirect, referrer, referrerPolicy, body } = req;

  return new Request(new_url.toString(), {
    headers,
    method,
    redirect,
    referrer,
    referrerPolicy,
    body,
  });
}

export function round(value: number, digits: number) {
  const multiplicator = Math.pow(10, digits);
  value = parseFloat((value * multiplicator).toFixed(11));
  const result = Math.round(value) / multiplicator;
  return +result.toFixed(digits);
}
