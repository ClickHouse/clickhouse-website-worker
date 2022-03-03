import { changeUrl } from './util';

export async function handleInstallScriptRequest(
  request: Request,
): Promise<Response> {

  let url = new URL(request.url);
  url.pathname = '/data/install.sh';

  let response = await fetch(changeUrl(request, url));
  response = new Response(response.body, response);

  response.headers.set('cache-control', 'no-transform');
  return response;
}
