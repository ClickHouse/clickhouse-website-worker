import { addDefaultHeaders, changeUrl } from './util';
import config from './config';

export async function handleCodebrowserRequest(
  request: Request,
): Promise<Response> {
  let url = new URL(request.url);
  const cf = {
    cf: {
      cacheEverything: true,
      cacheTtl: 14400,
      minify: { javascript: true, css: true, html: false },
    },
  };
  url.hostname = config.codebrowser;
  let response = await fetch(changeUrl(request, url), cf);
  if (response.headers.get('content-type') === 'text/html; charset=utf-8') {
    let text = await response.text();
    text = text
      .split('https://clickhouse-test-reports.s3.amazonaws.com/')
      .join('/');
    text = text
      .split("a href='http")
      .join("a rel='external nofollow noreferrer' target='_blank' href='http");
    text = text.split('..//').join('../');
    response = new Response(text, { ...response, ...cf });
  } else {
    response = new Response(response.body, { ...response, ...cf });
  }
  addDefaultHeaders(response);
  response.headers.set('cache-control', 'no-transform');
  const to_delete = [
    'x-yc-s3-bucket-tags',
    'x-amz-request-id',
    'x-amz-meta-computed_md5',
    'content-security-policy',
    'x-robots-tag',
    'access-control-allow-origin',
  ];
  for (let idx in to_delete) {
    response.headers.delete(to_delete[idx]);
  }
  return response;
}
