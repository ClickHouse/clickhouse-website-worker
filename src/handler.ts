import { addDefaultHeaders, changeUrl } from './util';
import { handleBuildsRequest } from './builds';
import { handleCodebrowserRequest } from './codebrowser';
import { handleDocsRequest } from './docs';
import { handleFaviconRequest } from './favicon';
import { handleLearnRequest } from './learn';
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

/// Map data type in TypeScript is unordered, so please note that "for" loops will be not in this order.
const prefix_mapping = new Map([
  ['/docs/css', handleGitHubRequest],
  ['/docs/js', handleGitHubRequest],
  ['/docs/images', handleGitHubRequest],
  
  ['/docs/ru', handleGitHubRequest],
  ['/docs/zh', handleGitHubRequest],
  ['/docs/ja', handleGitHubRequest],
  
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
  for (const [prefix, prefix_handler] of prefix_mapping.entries()) {
    if (url.pathname.startsWith(prefix)) {
      return prefix_handler(request);
    }
  }
  
  /// The new docs have lowest priority, because they should not shadow the old assets on the website.
  if (url.pathname.startsWith('/docs')) {
    return handleDocsRequest(request);
  }

  // curl https://clickhouse.com/ will output an install script. Note: HTTP2 has headers in lowercase.
  const user_agent = request.headers.get('User-Agent') || request.headers.get('user-agent') || '';

  if (url.pathname === '/' && user_agent.startsWith('curl/')) {
    return handleInstallScriptRequest(request);
  }

  return handlePantheonRequest(request, config.production)
}
