import { addDefaultHeaders, changeUrl } from './util';
import { handleBuildsRequest } from './builds';
import { handleCodebrowserRequest } from './codebrowser';
import { handleDocsRequest } from './docs';
import { handleFaviconRequest } from './favicon';
import { handleLearnRequest } from './learn';
import { handleMeetFormRequest } from './meet_form';
import { handleMetrikaCounterRequest } from './metrika';
import { handlePackagesRequest } from './packages';
import { handlePlaygroundRequest } from './playground';
import { handlePresentationsRequest } from './presentations';
import { handleRepoRequest } from './repo';
import { handlePantheonRequest } from './pantheon';
import { handleGitHubRequest } from './github';
import config from './config';

const hostname_mapping = new Map([
  ['builds.clickhouse.com', handleBuildsRequest],
  ['play.clickhouse.com', handlePlaygroundRequest],
  ['play.clickhouse.tech', handlePlaygroundRequest],
  ['repo.clickhouse.com', handleRepoRequest],
  ['repo.clickhouse.tech', handleRepoRequest],
  ['packages.clickhouse.com', handlePackagesRequest],
  ['staging.clickhouse.com', handlePantheonRequest],
]);

const pathname_mapping = new Map([
  ['/meet-form/', handleMeetFormRequest],
  ['/js/metrika.js', handleMetrikaCounterRequest],
]);

const prefix_mapping = new Map([
  ['/docs', handleDocsRequest],
  ['/codebrowser', handleCodebrowserRequest],
  ['/favicon/', handleFaviconRequest],
  ['/presentations/', handlePresentationsRequest],
  ['/learn', handleLearnRequest],
  ['/benchmark', handleGitHubRequest],
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

  return handlePantheonRequest(request, config.production)
}
