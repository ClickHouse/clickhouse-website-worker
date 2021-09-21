export async function handlePlaygroundRequest(request: Request) {
  let url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    return fetch(request);
  }
  let version_match = url.pathname.match(/\/api\/(v[0-9]+\.[0-9]+)\//);
  if (version_match && version_match.length > 1) {
    let version = version_match[1];
    url.pathname = url.pathname.replace(`/api/${version}/`, '/');
    version = version.replace('.', '-');
    url.hostname = `play-api-${version}.clickhouse.com`;
  } else {
    url.hostname = 'play-api.clickhouse.com';
    url.pathname = url.pathname.replace('/api/', '/');
  }

  url.port = '8443';

  const init = {
    body: request.body,
    headers: request.headers,
    method: request.method
  };

  const response = await fetch(url.toString(), init);
  let headers = new Headers();
  const origin = request.headers.get('origin');
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
