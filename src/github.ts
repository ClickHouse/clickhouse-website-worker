import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

const install_path = 'ClickHouse/ClickHouse/master/docs/_includes/install/universal.sh';
const paths = new Map([
  ['/data/install.sh', install_path],
  ['/data/version_date.tsv', '/ClickHouse/ClickHouse/master/utils/list-versions/version_date.tsv'],
]);

export async function handleGitHubRequest(request: Request) {
  let url = new URL(request.url);
  url.hostname = config.origins.github;
  url.pathname = paths.get(url.pathname) || install_path;
  const cf = {
    cf: {
      cacheEverything: true,
      cacheTtl: 60 * 30, // a half hour
    },
  };
  let response = await fetch(changeUrl(request, url), cf);
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
