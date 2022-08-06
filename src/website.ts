import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleWebsiteRequest(request: Request, production: boolean = false) {
  let url = new URL(request.url);
  let delete_headers = [
    'x-robots-tag'
  ];
  const path = url.pathname;
  url.hostname = config.origins.website

  if (!production) {
    delete_headers = [];
    url.hostname = config.origins.website_staging;
  }

  const cf = {
    cf: {
      cacheEverything: false,
    },
  };
  let response = await fetch(changeUrl(request, url), cf);
  response = new Response(response.body, response);
  addDefaultHeaders(response, delete_headers);
  return response;
}
