import { changeUrl } from './util';

/** Proxy requests to
  * https://clickhouse.com/learn/*
  * from
  * https://clickhouselearn.github.io/home/*
  *
  */
export async function handleLearnRequest(request: Request) {

  let url = new URL(request.url);
  url.hostname = 'clickhouselearn.github.io';
  url.pathname = url.pathname.replace('learn', 'home');

  const response = await fetch(url.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText
  });
  
}
