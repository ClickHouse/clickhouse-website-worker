import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleDocsRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);

  /// The URLs like https://clickhouse.com/docs/xyz
  /// are mapped to https://docs-content.clickhouse.tech/docs/xyz
  url.hostname = config.origins.github_docs_content;

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

  /// If Docusaurus produced a redirect, let's replace the domain back to clickhouse.com.

  if (response.status === 301) {
    return Response.redirect(response.headers.location.replace(config.origins.github_docs_content, config.origins.domain), 301);
  }

  /// Let Docusaurus handle all the remaining cases of 404 pages.

  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
