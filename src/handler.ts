import { addDefaultHeaders, changeUrl } from './util';
import { handleBuildsRequest } from './builds';
import { handleCodebrowserRequest } from './codebrowser';
import { handleDocsRequest } from './docs';
import { handleFaviconRequest } from './favicon';
import { handleLearnRequest } from './learn';
import { handleMetrikaCounterRequest } from './metrika';
import { handlePackagesRequest } from './packages';
import { handlePresentationsRequest } from './presentations';
import { handleRepoRequest } from './repo';
import { handleInstallScriptRequest } from './install-script';
import { handlePantheonRequest } from './pantheon';
import { handleGitHubRequest } from './github';
import config from './config';

const hostname_mapping = new Map([
  ['builds.clickhouse.com', handleBuildsRequest],
  ['repo.clickhouse.com', handleRepoRequest],
  ['repo.clickhouse.tech', handleRepoRequest],
  ['packages.clickhouse.com', handlePackagesRequest],
  ['staging.clickhouse.com', handlePantheonRequest],
]);

const pathname_mapping = new Map([
  ['/js/metrika.js', handleMetrikaCounterRequest],
]);

const prefix_mapping = new Map([
  ['/docs', handleDocsRequest],
  ['/codebrowser', handleCodebrowserRequest],
  ['/favicon/', handleFaviconRequest],
  ['/presentations/', handlePresentationsRequest],
  ['/learn', handleLearnRequest],
  ['/benchmark', handleGitHubRequest],
  ['/js', handleGitHubRequest],
  ['/css', handleGitHubRequest],
  ['/fonts', handleGitHubRequest],
  ['/data', handleGitHubRequest],
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

  // curl https://clickhouse.com/ will output an install script. Note: HTTP2 has headers in lowercase.
  const user_agent = request.headers.get('User-Agent') || request.headers.get('user-agent') || '';

  if (url.pathname === '/' && user_agent.startsWith('curl/')) {
    return handleInstallScriptRequest(request);
  }

  return handlePantheonRequest(request, config.production)
}
