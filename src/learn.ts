import { changeUrl } from './util';

/** Redirect from
  * https://clickhouse.com/learn/*
  * to
  * https://clickhouselearn.github.io/home/*
  *
  * Reference: https://developers.cloudflare.com/workers/examples/redirect
  *
  * Note: we are using redirects instead of proxying (fetch),
  * because we don't want to keep multiple URLs for the same content.
  *
  * Note: we may use Cloudflare "Page Rules" for this purpose and it would be way more easy,
  * but "Page Rules" cannot work if "Web Workers" are already used,
  * so we have to extend the "Web Workers" code.
  */
export async function handleLearnRequest(request: Request) {

  let url = new URL(request.url);
  url.hostname = 'clickhouselearn.github.io';
  url.pathname = url.pathname.replace('learn/', 'home/');

  const response = await fetch(url.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText
  });
  
}
