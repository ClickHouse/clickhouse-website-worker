import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleWebsiteRequest(
  request: Request,
  production: boolean = false,
) {
  let url = new URL(request.url);
  let delete_headers = ['x-robots-tag'];
  const path = url.pathname;

  if (!production) {
    delete_headers = [];
    if (request.headers.has('rsc') && url.hostname.startsWith('staging.')) {
      const deleteRequestHeaders = ['rsc', 'next-router-state-tree', 'next-router-prefetch']
      for (const param of deleteRequestHeaders) {
        request.headers.delete(param);
      }
    }
    url.hostname = url.hostname.startsWith('staging2')
      ? config.origins.website_staging2
      : config.origins.website_staging;
  } else {
     url.hostname = config.origins.website; 
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
