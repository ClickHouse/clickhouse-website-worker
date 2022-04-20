import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleDocsRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);

  url.hostname = config.origins.github;
  let response = await fetch(changeUrl(request, url));
  if (
    response.status === 200 &&
    response.headers.get('content-type') === 'text/html; charset=utf-8' &&
    url.pathname.indexOf('/single/') === -1
  ) {
    let text = await response.text();
    let redirect_prefix = '<!--[if IE 6]> Redirect: ';
    if (text.startsWith(redirect_prefix)) {
      let target = new URL(request.url);
      let path = text
          .substring(redirect_prefix.length)
          .split(' <![endif]-->', 1)[0];
      let absolute_prefix = `https://${config.domain}`;

      if (path.startsWith(absolute_prefix)) {
        path = path.substring(absolute_prefix.length, path.length)
      }

      target.pathname = path;

      return Response.redirect(target.toString(), 301);
    } else {
      response = new Response(text, response);
      addDefaultHeaders(response);
      return response;
    }
  }
  if (response.status === 404) {
    let version_match = url.pathname.match(/^\/docs\/(v[0-9]+\.[0-9]+)\//);
    if (version_match && version_match.length > 1) {
      let target = new URL(request.url);
      target.pathname = url.pathname.replace(version_match[1] + '/', '');
      return Response.redirect(target.toString(), 301);
    }
  }
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
