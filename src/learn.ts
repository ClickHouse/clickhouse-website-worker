import { addDefaultHeaders, changeUrl } from './util';

/** Proxy requests to
  * https://clickhouse.com/learn/*
  * from
  * https://clickhouselearn.github.io/home/*
  *
  */
export async function handleLearnRequest(request: Request) {

  let url = new URL(request.url);

  let proxy = null;

  if (request.url.includes("/data/xAPI")) {
    // The request is for the Learning Record Store
    // and looks like https://clickhouse.com/learn/data/xAPI
    // and we want it to proxy to http://3.15.84.174/data/xAPI
    url.hostname = '18.188.68.69';
    url.protocol = 'http';
    url.pathname = url.pathname.replace('/learn', '');

    let xapiRequest = new Request(url.toString(), request);
    proxy = await fetch(xapiRequest);

  } else {
    url.hostname = 'clickhouselearn.github.io';
    url.pathname = url.pathname.replace('learn', 'home');
    proxy = await fetch(url.toString());
  }

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
