import { addDefaultHeaders, changeUrl, round } from './util';

export async function handleBuildsRequest(request: Request) {
  let url = new URL(request.url);
  const path = url.pathname;
  url.hostname = 's3.amazonaws.com';
  url.pathname = '/clickhouse-builds/' + path;
  const cf = {
    cf: {
      cacheEverything: true,
      cacheTtl: 86400 * 3,
    },
  };
  let response = await fetch(changeUrl(request, url), cf);
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
