import { addDefaultHeaders, changeUrl } from './util';

/** Proxy requests to
  * https://clickhouse.com/partners/aws/*
  * from
  * https://clickhouselearn.github.io/partners/aws/*
  *
  */
export async function handleAwsPartnersRequest(request: Request) {
  let url = new URL(request.url);

  let proxy = null;

  url.hostname = 'clickhouselearn.github.io';
  proxy = await fetch(url.toString());

  let response =  new Response(proxy.body, {
    status: proxy.status,
    statusText: proxy.statusText,
    headers: proxy.headers
  });

  addDefaultHeaders(response);

  response.headers.set(
    'Access-Control-Allow-Origin',
    '*'
  );

  response.headers.set(
    'Access-Control-Allow-Methods',
    'POST, PUT, GET, OPTIONS'
  );

  return response;
}
