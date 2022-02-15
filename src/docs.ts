import { addDefaultHeaders, changeUrl, round } from './util';
import config from './config';

function getRatingKey(url: URL): string | null {
  const url_match = url.pathname.match(
    /^\/docs(?:\/v[0-9]+\.[0-9]+)?(?:\/[a-z]{2})(.*)/,
  );
  if (url_match && url_match.length > 1) {
    let key = url_match[1];
    if (key.endsWith('amp/')) {
      key = key.slice(0, -4);
    }
    if (key.length > 2) {
      key = key.replace(/^\/|\/$/g, '');
    }
    return key;
  }
  return null;
}

async function handleArticleRating(request: Request): Promise<Response> {
  let url = new URL(request.url);
  let key = getRatingKey(url);
  if (key) {
    if (key.length > 5) {
      key = key.slice(0, -5); // cut /rate
    } else {
      key = '/';
    }
    let args = await request.json();
    let rating = Math.round(args.rating);
    if (rating >= 1 && rating <= 5) {
      let ratings_object;
      const ip = request.headers.get('cf-connecting-ip');
      const ip_key = `${ip}_${key}`;
      const rating_per_ip = await RATING_PER_IP.get(ip_key);
      if (!rating_per_ip) {
        // TODO: allow to update vote
        const ratings_kv = await RATING.get(key);

        if (ratings_kv) {
          ratings_object = JSON.parse(ratings_kv);
        } else {
          ratings_object = {
            ratings: new Array(5).fill(0),
          };
        }
        ratings_object.ratings[rating - 1] += 1;
        const data = JSON.stringify(ratings_object);
        await RATING.put(key, data); // no CAS, unfortunately
        await RATING_PER_IP.put(ip_key, JSON.stringify(args));
      }
      return new Response('{}', {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      });
    }
  }
  return new Response('Bad request', {
    status: 400,
    statusText: 'Bad request',
  });
}

export async function handleDocsRequest(request: Request): Promise<Response> {
  let url = new URL(request.url);
  if (request.method == 'POST' && url.pathname.endsWith('/rate/')) {
    return handleArticleRating(request);
  }
  url.hostname = config.origins.github;
  let response = await fetch(changeUrl(request, url));
  if (
    response.status === 200 &&
    response.headers.get('content-type') === 'text/html; charset=utf-8' &&
    url.pathname.indexOf('/single/') === -1
  ) {
    let text = await response.text();
    let redirect_prefix = '<!--[if IE 6]> Redirect: ';
    if (text.startsWith(redirect_prefix)) {
      let target = new URL(request.url);
      target.pathname = text
        .substring(redirect_prefix.length)
        .split(' <![endif]-->', 1)[0];
      return Response.redirect(target.toString(), 301);
    } else {
      let rating_count = 1;
      let rating_value = 4;
      let key = getRatingKey(url);
      if (key) {
        const ratings = await RATING.get(key);
        if (ratings) {
          const scores = JSON.parse(ratings).ratings;
          if (scores.length == 5) {
            const sum = (a: number, b: number) => a + b;
            const mul_inc = (a: number, b: number) => a * (b + 1);
            rating_count = scores.reduce(sum, 0);
            if (rating_count) {
              rating_value = round(
                scores.map(mul_inc).reduce(sum, 0) / rating_count,
                1,
              );
            }
          }
        }
      }
      const rating_int = Math.round(rating_value);
      let stars = '★'.repeat(rating_int) + '☆'.repeat(5 - rating_int);
      text = text
        .replace(/RATING_VALUE/g, rating_value.toString())
        .replace(/RATING_COUNT/g, rating_count.toString())
        .replace(/RATING_STARS/g, stars);
      response = new Response(text, response);
      addDefaultHeaders(response);
      return response;
    }
  }
  if (response.status === 404) {
    let version_match = url.pathname.match(/^\/docs\/(v[0-9]+\.[0-9]+)\//);
    if (version_match && version_match.length > 1) {
      let target = new URL(request.url);
      target.pathname = url.pathname.replace(version_match[1] + '/', '');
      return Response.redirect(target.toString(), 301);
    }
  }
  response = new Response(response.body, response);
  addDefaultHeaders(response);
  return response;
}
