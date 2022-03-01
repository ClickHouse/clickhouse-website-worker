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
