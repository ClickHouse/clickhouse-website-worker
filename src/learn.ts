import { addDefaultHeaders, changeUrl } from './util';

/** Proxy requests to
  * https://clickhouse.com/learn/*
  * from
  * https://clickhouselearn.github.io/home/*
  *
  */
export async function handleLearnRequest(request: Request) {

  let url = new URL(request.url);
  url.hostname = 'clickhouselearn.github.io';
  url.pathname = url.pathname.replace('learn','home');

  const proxy = await fetch(url.toString());

  let response =  new Response(proxy.body, {
    status: proxy.status,
    statusText: proxy.statusText,
    headers: proxy.headers
  });

  addDefaultHeaders(response);

  return response;
  
}
