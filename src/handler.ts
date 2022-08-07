import { addDefaultHeaders, changeUrl } from './util';
import { handleBuildsRequest } from './builds';
import { handleCodebrowserRequest } from './codebrowser';
import { handleDocsRequest } from './docs';
import { handleLearnRequest } from './learn';
import { handlePackagesRequest } from './packages';
import { handlePresentationsRequest } from './presentations';
import { handleRepoRequest } from './repo';
import { handleInstallScriptRequest } from './install-script';
import { handleWebsiteRequest } from './website';
import { handleGitHubRequest } from './github';
import config from './config';

/// Special handlers for all the domains except the main domain "clickhouse.com".
const hostname_mapping = new Map([
  ['builds.clickhouse.com', handleBuildsRequest],
  ['repo.clickhouse.com', handleRepoRequest],
  ['repo.clickhouse.tech', handleRepoRequest],
  ['packages.clickhouse.com', handlePackagesRequest],
  ['staging.clickhouse.com', handleWebsiteRequest],
]);

/// Prefixes for paths on the main domain "clickhouse.com".
/// Map data type in TypeScript is unordered, so we cannot use it.
const prefix_mapping = [
  /// This is being used by the new Docs on Docusaurus, see the preview at https://docs-content.clickhouse.tech/
  /// We proxy it on https://clickhouse.com/docs/ for convenience.
  ['/docs', handleDocsRequest],
  ['/codebrowser', handleCodebrowserRequest],
  ['/presentations/', handlePresentationsRequest],
  ['/learn', handleLearnRequest],
  ['/data', handleGitHubRequest],
];

export async function handleRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);

  const hostname_handler = hostname_mapping.get(url.hostname);
  if (hostname_handler) {
    return hostname_handler(request);
  }

  /// Redirect from the old benchmark page to ClickBench.
  if (url.pathname == '/benchmark' || url.pathname == '/benchmark/' || url.pathname.startsWith('/benchmark/dbms')) {
    return Response.redirect('https://benchmark.clickhouse.com/', 301);
  }
  if (url.pathname.startsWith('/benchmark/hardware')) {
    return Response.redirect('https://benchmark.clickhouse.com/hardware/', 301);
  }
  if (url.pathname.startsWith('/benchmark/versions')) {
    return Response.redirect('https://benchmark.clickhouse.com/versions/', 301);
  }

  for (const [prefix, prefix_handler] of prefix_mapping) {
    if (url.pathname.startsWith(prefix)) {
      return prefix_handler(request);
    }
  }
  
  /// curl https://clickhouse.com/ will output an install script. Note: HTTP2 has headers in lowercase.
  /// This is the most important part of our website, because it allows users to install ClickHouse.
  const user_agent = request.headers.get('User-Agent') || request.headers.get('user-agent') || '';

  if (url.pathname === '/' && user_agent.startsWith('curl/')) {
    return handleInstallScriptRequest(request);
  }

  /// This is our main websites. It covers everything that is not covered by special handlers above.
  return handleWebsiteRequest(request, config.production)
}
