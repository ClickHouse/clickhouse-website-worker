import { changeUrl } from './util';

export async function handleInstallScriptRequest(
  request: Request,
): Promise<Response> {
  let url = new URL(request.url);
  url.pathname = '/data/install.sh';
  let response = await fetch(changeUrl(request, url));
  response.headers.set('cache-control', 'no-transform');
  const to_delete = [
    'x-amz-request-id',
    'x-amz-meta-computed_md5',
    'content-security-policy',
    'x-robots-tag',
    'access-control-allow-origin',
  ];
  for (let idx in to_delete) {
    response.headers.delete(to_delete[idx]);
  }
  return response;
}
