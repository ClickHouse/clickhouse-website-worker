import { addDefaultHeaders, changeUrl, round } from './util';
import config from './config';

export async function handlePantheonRequest(request: Request, production: boolean = false) {
  let url = new URL(request.url);
  const path = url.pathname;
  url.hostname = config.origins.pantheon

  if (!production) {
    url.hostname = config.origins.pantheon_staging;
  }

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