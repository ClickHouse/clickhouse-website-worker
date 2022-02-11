import { handleRequest } from './handler';
import config from './config';
import { changeUrl } from './util';
import { sendExceptionToSentry } from './sentry';
import { recordDownload } from './repo'

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
  event.waitUntil(recordDownload(event.request));
});

async function handleEvent(event: FetchEvent) {
  try {
    return await handleRequest(event.request);
  } catch (e) {
    event.waitUntil(sendExceptionToSentry(e, event.request));
    return fallbackResponse(event.request);
  }
}

async function fallbackResponse(request: Request): Promise<Response> {
  let url = new URL(request.url);
  url.hostname = config.origin_pantheon;
  return await fetch(changeUrl(request, url));
}
