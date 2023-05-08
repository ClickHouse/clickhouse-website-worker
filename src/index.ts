import { handleRequest } from './handler';
import config from './config';
import { changeUrl } from './util';
import { sendExceptionToSentry } from './sentry';

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event: FetchEvent) {
  try {
    return await handleRequest(event.request);
  } catch (e) {
    if (e instanceof TypeError) {
      if ( e.message === "Request with a GET or HEAD method cannot have a body." ) {
        return fallbackResponse(event.request);
      }
    }
    event.waitUntil(sendExceptionToSentry(e, event.request));
    return fallbackResponse(event.request);
  }
}

async function fallbackResponse(request: Request): Promise<Response> {
  let url = new URL(request.url);
  url.hostname = config.origins.website;
  return await fetch(changeUrl(request, url));
}
