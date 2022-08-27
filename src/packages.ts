import { addDefaultHeaders, changeUrl } from './util';

const pathPrefix = '/artifactory';
const slash = `<!DOCTYPE html>
<html>
<head><title>Index of /</title></head>
<body>
<h1>Index of /</h1>
<pre><a href="deb/">deb/</a>
<a href="rpm/">rpm/</a>
<a href="tgz/">tgz/</a></pre>
</body></html>`

export async function handlePackagesRequest(request: Request) {
  const domain = JFROG_DOMAIN;
  let url = new URL(request.url);
  // hostname in the request
  const hostname = url.hostname;
  // Redirect http to https
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  };
  // Return pre-generated page for the home page
  if (url.pathname === '/') {
    const init = {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    };
    return new Response(slash, init);
  }
  request = new Request(url.toString(), request);
  request.headers.set('X-JFrog-Art-Api', JFROG_ART_API_KEY);
  request.headers.set('User-Agent', 'curl');

  // Generate new URL
  const path = url.pathname;
  url.hostname = domain;
  url.pathname = pathPrefix + path;
  if (path.endsWith('.deb') || path.endsWith('.rpm') || path.endsWith('.tgz')) {
    return getRedirectedPackage(request, url, `https://${origin}/${url.pathname}`, 0);
  }

  // For redirects we rewrite location to a proper domain
  const init = {
    cf: {
      cacheTtlByStatus: {
        "200-299": 300,
        "301-302": 20,
        "400-599": 10,
      },
    }
  }
  let response = await fetch(changeUrl(request, url), init);
  response = new Response(response.body, response);
  const location = response.headers.get('location');
  const toReplace = domain + pathPrefix;
  if (location && location.indexOf(toReplace) >= 0) {
    response.headers.set('location', location.replace(toReplace, origin));
  }
  return response;
}

async function getRedirectedPackage(request: Request, url: URL, cacheKey: string, redirects: number):Promise<Response> {
  // Jfrog put big files to S3 and redirects original requests there
  // The 5 redirects is the maximum depth
  let maxRedirects = 5;
  const cf = {
    cf: {
      cacheTtlByStatus: {
        // Return files with 14d TTL
        "200-299": 14 * 86400,
        "301-302": 0,
        "400-599": 10,
      },
      cacheKey: cacheKey,
      cacheEverything: true,
    },
  };
  let response = await fetch(changeUrl(request, url), cf);
  const location = response.headers.get('location');
  if (location && redirects < maxRedirects) {
    return getRedirectedPackage(request, new URL(location), cacheKey, redirects+1);
  }
  return response;
}
