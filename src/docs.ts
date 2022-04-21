import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleDocsRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);

  /// The URLs like https://clickhouse.com/docs/xyz
  /// are mapped to https://docs-content.clickhouse.tech/docs/xyz
  url.hostname = config.origins.github_docs_content;

  let response = await fetch(changeUrl(request, url));

  if (response.status === 200) {
    return response;
  }

  /// If Docusaurus produced a redirect, let's replace the domain back to clickhouse.com.

  if (response.status === 301) {
    let target = new URL(response.headers.get("location"));
    target.hostname = config.domain;
    return Response.redirect(target.toString(), 301);
  }

  /// Let Docusaurus handle all the remaining cases of 404 pages.

  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
