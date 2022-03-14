import { addDefaultHeaders, changeUrl } from './util';

const domain = 'clickhousedb.jfrog.io';
const pathPrefix = '/artifactory';

export async function handlePackagesRequest(request: Request) {
  let url = new URL(request.url);
  const origin = url.hostname;
  // Add auth header and prevent redirecting to UI interface
  request = new Request(url.toString(), request);
  request.headers.set('X-JFrog-Art-Api', JFROG_API_KEY);
  request.headers.set('User-Agent', 'curl');

  // Generate new URL
  const path = url.pathname;
  url.hostname = domain;
  url.pathname = pathPrefix + path;
  if (path.endsWith('.deb') || path.endsWith('.rpm') || path.endsWith('.tgz')) {
    // Return files with 7d TTL
    const cf = {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: {
          "200-299": 7 * 86400,
          "300-599": 5,
        },
      },
    };
    return fetch(changeUrl(request, url), cf);
  }

  // For redirects we rewrite location to a proper domain
  let response = await fetch(changeUrl(request, url));
  response = new Response(response.body, response);
  const location = response.headers.get('location');
  const toReplace = domain + pathPrefix;
  if (location && location.indexOf(toReplace) >= 0) {
    response.headers.set('location', location.replace(toReplace, origin));
  }
  return response;
}
