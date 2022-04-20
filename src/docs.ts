import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleDocsRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);

  /// The URLs like https://clickhouse.com/docs/xyz
  /// are mapped to https://docs-content.clickhouse.tech/xyz
  /// (note the removal of the docs/ component from the path)

  /// But the URLs like https://clickhouse.com/xyz
  /// are mapped to https://clickhouse.com/xyz

  /// This is needed to support absolute URLs to /assets/{js,css} from the /docs/

  url.hostname = config.origins.github_docs_content;
  url.path = url.path.replace("/docs", "");

  let response = await fetch(changeUrl(request, url));

  if (response.status === 200) {

    /// The docs have a quite strange mechanics of redirects.
    /// It generates a static file with JS redirect.
    /// Then we match and check if this is that type of file.
    /// And if it is, we replace the HTTP headers with regular HTTP redirect.

    /// Note: the mention of IE 6 is completely misleading.
    /// IE 6 is old enough and it will not open our website due to lack of modern TLS support.

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
