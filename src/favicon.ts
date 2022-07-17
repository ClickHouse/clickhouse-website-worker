import { addDefaultHeaders, changeUrl } from './util';

export async function handleFaviconRequest(request: Request) {
  const domain = new URL(request.url).pathname.replace('/favicon/', '');
  const url = new URL(`https://www.google.com/s2/favicons?domain=${domain}`);
  const cf = {
    cf: {
      cacheEverything: true,
      cacheTtl: 86400 * 7,
    },
  };
  let response = await fetch(changeUrl(request, url), cf);
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  response.headers.set('cache-control', 'public, max-age=604800');
  response.headers.delete('expires');
  response.headers.delete('set-cookie');
  response.headers.delete('p3p');
  response.headers.delete('server');
  return response;
}
