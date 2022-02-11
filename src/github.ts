import { addDefaultHeaders, changeUrl, round } from './util';
import config from './config';

export async function handleGitHubRequest(request: Request) {
  let url = new URL(request.url);
  const path = url.pathname;
  url.hostname = config.origin
  const cf = {
    cf: {
      cacheEverything: true,
      cacheTtl: 60 * 30, // a half hour
    },
  };
  let response = await fetch(changeUrl(request, url), cf);
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
