import { addDefaultHeaders, changeUrl } from './util';
import { handleCodebrowserRequest } from './codebrowser';
import { handleDocsRequest } from './docs';
import { handleFaviconRequest } from './favicon';
import { handleMeetFormRequest } from './meet_form';
import { handleMetrikaCounterRequest } from './metrika';
import { handlePlaygroundRequest } from './playground';
import { handleRepoRequest } from './repo';
import { handlePresentationsRequest } from './presentations';
import { handleLearnRequest } from './learn';
import config from './config';

const hostname_mapping = new Map([
  ['play.clickhouse.com', handlePlaygroundRequest],
  ['play.clickhouse.tech', handlePlaygroundRequest],
  ['repo.clickhouse.com', handleRepoRequest],
  ['repo.clickhouse.tech', handleRepoRequest]
]);

const pathname_mapping = new Map([
  ['/meet-form/', handleMeetFormRequest],
  ['/js/metrika.js', handleMetrikaCounterRequest],
]);

const prefix_mapping = new Map([
  ['/docs', handleDocsRequest],
  ['/blog', handleDocsRequest],  // TODO maybe split up to separate handler
  ['/codebrowser', handleCodebrowserRequest],
  ['/favicon/', handleFaviconRequest],
  ['/presentations/', handlePresentationsRequest],
  ['/learn', handleLearnRequest],
]);

export async function handleRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);
  const hostname_handler = hostname_mapping.get(url.hostname);
  if (hostname_handler) {
    return hostname_handler(request);
  }
  const pathname_handler = pathname_mapping.get(url.pathname);
  if (pathname_handler) {
    return pathname_handler(request);
  }
  for (const [prefix, prefix_handler] of prefix_mapping.entries()) {
    if (url.pathname.startsWith(prefix)) {
      return prefix_handler(request);
    }
  }
  url.hostname = config.origin;
  let response = await fetch(changeUrl(request, url));
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
