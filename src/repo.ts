import { changeUrl } from './util';

export async function handleRepoRequest(request: Request) {
  let url = new URL(request.url);
  const path = url.pathname;
  url.hostname = 'repo.yandex.ru';
  url.pathname = '/clickhouse' + path;
  if (path.endsWith('.deb') || path.endsWith('.rpm') || path.endsWith('.tgz')) {
    const cf = {
      cf: {
        cacheEverything: true,
        cacheTtl: 7 * 86400
      },
    };
    return fetch(changeUrl(request, url), cf);
  } else {
    return fetch(changeUrl(request, url));
  }
}

export async function recordDownload(request: Request)  {
  if (request.method.toUpperCase() != 'GET') {
    return;
  }
  const url = new URL(request.url)
  const path = url.pathname;
  if (path.endsWith('.deb') || path.endsWith('.rpm') || path.endsWith('.tgz')) {
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    const payload = {
      host: url.hostname,
      path: path,
      protocol: url.protocol,
      package_kind: path.substr(-3, 3),
      country: request.headers.get('cf-ipcountry') || '',
      device_type: request.headers.get('cf-device-type') || '',
      raw_ip: request.headers.get('cf-connecting-ip') || '',
      raw_forwarded_for: request.headers.get('x-forwarded-for') || '',
      user_agent: request.headers.get('user-agent') || '',
      cf_timestamp: new Date().toISOString().substring(0, 19).replace('T', ' '),
      token: FUNCTIONS_TOKEN
    };
    const request_init = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: headers
    };
    return fetch(
      'https://functions.yandexcloud.net/d4e55euogu41qm63ev3o/',
      request_init
    )
  }
}
