import { changeUrl } from './util';

export async function trackInGalaxy(): Promise<Response> {
  return fetch('https://qa.control-plane.clickhouse-dev.com/api/galaxy?sendGalaxyForensicEvent', {
    method: 'POST',
    body: JSON.stringify({
      rpcAction: 'sendGalaxyForensicEvent',
      data: [{
        "application": "MARKETING_WEBSITE",
        "timestamp": Date.now(),
        "event": "installScriptDownloaded",
        "namespace": 'marketing',
        "component": "workers",
        "message": "installScriptDownloaded",
        "properties": {},
        "userId": 'unauth:unknown'
      }]
    })
  });
}

export async function handleInstallScriptRequest(
  request: Request,
): Promise<Response> {

  let url = new URL(request.url);
  url.pathname = '/data/install.sh';

  let response = await fetch(changeUrl(request, url));
  response = new Response(response.body, response);

  try {
    await trackInGalaxy();
  } catch(error) {
    console.error(error);
  }

  response.headers.set('cache-control', 'no-transform');
  return response;
}
