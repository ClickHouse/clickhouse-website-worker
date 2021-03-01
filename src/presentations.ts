import { changeUrl } from './util';

/** Redirect from
  * https://clickhouse.tech/presentations/*
  * to
  * https://presentations.clickhouse.tech/*
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
export async function handlePresentationsRequest(request: Request) {
  // Permanent redirect
  const statusCode = 301;

  let destinationURL = new URL(request.url);
  destinationURL.hostname = 'presentations.clickhouse.tech';
  destinationURL.pathname = destinationURL.pathname.replace('presentations/', '');

  return Response.redirect(destinationURL, statusCode)
}
