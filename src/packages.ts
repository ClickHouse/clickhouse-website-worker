// The source of the file is got from:
// + https://github.com/skymethod/denoflare/blob/v0.5.8/examples/r2-public-read-worker/worker.ts
// License: MIT
import { addDefaultHeaders, changeUrl } from './util';
import {
  TEXT_HTML_UTF8,
  computeDirectoryListingHtml,
  computeHeaders,
  computeObjResponse,
  permanentRedirect,
  temporaryRedirect,
  tryParseR2Conditional,
  tryParseRange,
} from './r2';

export async function handlePackagesRequest(request: Request) {
  let url = new URL(request.url);
  // hostname in the request
  const hostname = url.hostname;
  // Redirect http to https
  if (url.protocol === "http:") {
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  };
  const objectName = url.pathname.slice(1);
  const method = request.method;
  if (method != "GET" && method != "HEAD") {
    return new Response(`Unsupported method`, {
      status: 405
    })
  }
  const headers = request.headers;
  const { pathname, searchParams } = url;
  let key = pathname.substring(1); // strip leading slash
  let bucket : R2Bucket = PACKAGES_BUCKET;
  key = decodeURIComponent(key);

  console.log(`${request.method} object ${objectName}: ${request.url}`)
  let range = tryParseRange(headers);
  const onlyIf = tryParseR2Conditional(headers);
  let obj: R2Object | null = null;
  const getOrHead: (key: string, options?: R2GetOptions) => Promise<R2Object | null> = (key, options) => {
    console.log(`bucket.${method.toLowerCase()} ${key} ${JSON.stringify(options)}`);
    return method === 'GET' ? (options ? bucket.get(key, options) : bucket.get(key)) : bucket.head(key);
  };
  obj = key === '' ? null : await getOrHead(key, { range, onlyIf });

  if (!obj) {
    if (key === '' || key.endsWith('/')) { // object not found, append index.html and try again (like pages)
      key += 'index.html';
      obj = await getOrHead(key, { range, onlyIf });
    } else { // object not found, redirect non-trailing slash to trailing slash (like pages) if index.html exists
      key += '/index.html';
      obj = await bucket.head(key);
      if (obj) {
        return permanentRedirect({ location: pathname + '/' });
      }
    }
  }

  if (obj && !key.endsWith("/")) {
    // choose not to satisfy range requests for encoded content
    // unfortunately we don't know it's encoded until after the first request
    let disableRangeRequests = false;
    console.log("obj", JSON.stringify(obj))
    if (range && computeHeaders(obj, { range }).has('content-encoding')) {
      console.log(`re-request without range`);
      range = undefined;
      obj = await bucket.get(key);
      if (obj === null) throw new Error(`Object ${key} existed for .get with range, but not without`);
      disableRangeRequests = true;
    }
    return computeObjResponse(obj, range ? 206 : 200, { range, onlyIf, disableRangeRequests });
  }


  // R2 object not found, try listing a directory
  let prefix = pathname.substring(1);
  let redirect = false;
  if (prefix !== '' && !prefix.endsWith('/')) {
    prefix += '/';
    redirect = true;
  }
  const limit = 1000;
  const directoryListingLimitParam = searchParams.get('directoryListingLimit') || limit.toString();
  const options: R2ListOptions = { delimiter: '/', limit, prefix: prefix === '' ? undefined : prefix, cursor: searchParams.get('cursor') || undefined };
  console.log(`list: ${JSON.stringify(options)}`);
  const objects = await bucket.list(options);
  if (objects.delimitedPrefixes.length > 0 || objects.objects.length > 0) {
    const { cursor } = objects;
    console.log({ numPrefixes: objects.delimitedPrefixes.length, numObjects: objects.objects.length, truncated: objects.truncated, cursor });
    return redirect ? temporaryRedirect({ location: '/' + prefix }) : new Response(computeDirectoryListingHtml(objects, { prefix, cursor, directoryListingLimitParam }), { headers: { 'content-type': TEXT_HTML_UTF8 } });
  }

  return new Response(`Not found`, {
    status: 404
  })
}
