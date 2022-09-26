// The source of the file is got from:
// + https://github.com/skymethod/denoflare/blob/v0.5.8/examples/r2-public-read-worker/worker.ts
// + https://github.com/skymethod/denoflare/blob/v0.5.8/examples/r2-public-read-worker/listing.ts
// License: MIT
export const TEXT_PLAIN_UTF8 = 'text/plain; charset=utf-8';
export const TEXT_HTML_UTF8 = 'text/html; charset=utf-8';

export function tryParseRange(headers: Headers): R2Range | undefined {
  const m = /^bytes=(\d*)-(\d*)$/.exec(headers.get('range') || '');
  if (!m) return undefined;
  const lhs = m[1] === '' ? undefined : parseInt(m[1]);
  const rhs = m[2] === '' ? undefined : parseInt(m[2]);
  if (lhs === undefined && typeof rhs === 'number') return { suffix: rhs };
  if (typeof lhs === 'number' && rhs === undefined) return { offset: lhs };
  if (typeof lhs === 'number' && typeof rhs === 'number') {
    const length = rhs - lhs + 1;
    return length > 0 ? { offset: lhs, length } : undefined;
  }
}

export function computeObjResponse(obj: R2Object, status: number, opts: { range?: R2Range, onlyIf?: R2Conditional, disableRangeRequests?: boolean } = {}): Response {
  const { onlyIf } = opts;
  let body: ReadableStream | undefined;
  if (isR2ObjectBody(obj)) {
    body = obj.body;
  } else if (onlyIf) {
    if (onlyIf.etagDoesNotMatch) return unmodified();
    if (onlyIf.uploadedAfter) return unmodified();
    if (onlyIf.etagMatches) return preconditionFailed();
    if (onlyIf.uploadedBefore) return preconditionFailed();
  }

  const headers = computeHeaders(obj, opts);

  // non-standard cloudflare ResponseInit property indicating the response is already encoded
  // required to prevent the cf frontend from double-encoding it, or serving it encoded without a content-encoding header
  const encodeBody = headers.has('content-encoding') ? 'manual' : undefined;
  return new Response(body, { status, headers, encodeBody });
}

export function tryParseR2Conditional(headers: Headers): R2Conditional | undefined {
  // r2 bug: onlyIf takes Headers, but processes them incorrectly (see if-modified-since below)
  // so we need to do them by hand for now

  const ifNoneMatch = headers.get('if-none-match') || undefined;
  const etagDoesNotMatch = ifNoneMatch ? stripEtagQuoting(ifNoneMatch) : undefined;

  const ifMatch = headers.get('if-match') || undefined;
  const etagMatches = ifMatch ? stripEtagQuoting(ifMatch) : undefined;

  const ifModifiedSince = headers.get('if-modified-since') || undefined;
  // if-modified-since date format (rfc 1123) is at second resolution, uploaded is at millis resolution
  // workaround for now is to add a second to the provided value
  const uploadedAfter = ifModifiedSince ? addingOneSecond(new Date(ifModifiedSince)) : undefined; 

  const ifUnmodifiedSince = headers.get('if-unmodified-since') || undefined;
  const uploadedBefore = ifUnmodifiedSince ? new Date(ifUnmodifiedSince) : undefined;

  return etagDoesNotMatch || etagMatches || uploadedAfter || uploadedBefore ? { etagDoesNotMatch, etagMatches, uploadedAfter, uploadedBefore } : undefined;
}

function stripEtagQuoting(str: string): string {
  const m = /^(W\/)?"(.*)"$/.exec(str);
  return m ? m[2] : str;
}

function addingOneSecond(time: Date): Date {
  return new Date(time.getTime() + 1000);
}

export function unmodified(): Response {
  return new Response(undefined, { status: 304 });
}

export function preconditionFailed(): Response {
  return new Response('precondition failed', { status: 412 });
}

export function badRequest(message: string): Response {
  return new Response(message, { status: 400 });
}

export function permanentRedirect(opts: { location: string }): Response {
  const { location } = opts;
  return new Response(undefined, { status: 308, headers: { 'location': location } });
}

export function temporaryRedirect(opts: { location: string }): Response {
  const { location } = opts;
  return new Response(undefined, { status: 307, headers: { 'location': location } });
}

export function isR2ObjectBody(obj: R2Object): obj is R2ObjectBody {
  return 'body' in obj;
}

export function computeHeaders(obj: R2Object, opts: { range?: R2Range, disableRangeRequests?: boolean }): Headers {
  const { range, disableRangeRequests } = opts;
  const headers = new Headers();
  // writes content-type, content-encoding, content-disposition, i.e. the values from obj.httpMetadata
  obj.writeHttpMetadata(headers);
  console.log('writeHttpMetadata', [...headers].map(v => v.join(': ')).join(', ')); // for debugging, writeHttpMetadata was buggy in the past

  // obj.size represents the full size, but seems to be clamped by the cf frontend down to the actual number of bytes in the partial response
  // exactly what we want in a content-length header
  headers.set('content-length', String(obj.size));

  headers.set('etag', obj.httpEtag); // the version with double quotes, e.g. "96f20d7dc0d24de9c154d822967dcae1"
  headers.set('last-modified', obj.uploaded.toUTCString()); // toUTCString is the http date format (rfc 1123)

  if (!disableRangeRequests) headers.set('accept-ranges', 'bytes'); // beware: cf frontend seems to remove this for 200s if auto-compressing
  if (range) headers.set('content-range', computeContentRange(range, obj.size));
  return headers;
}

function computeContentRange(range: R2Range, size: number) {
  const offset = 'offset' in range ? range.offset : undefined;
  const length = 'length' in range ? range.length : undefined;
  const suffix = 'suffix' in range ? range.suffix : undefined;

  const startOffset = typeof suffix === 'number' ? size - suffix
    : typeof offset === 'number' ? offset
      : 0;
      const endOffset = typeof suffix === 'number' ? size
        : typeof length === 'number' ? startOffset + length
          : size;

          return `bytes ${startOffset}-${endOffset - 1}/${size}`;
}

// Listing of directory

export function computeDirectoryListingHtml(objects: R2Objects, opts: { prefix: string, cursor?: string, directoryListingLimitParam?: string }): string {
  const { prefix, cursor, directoryListingLimitParam } = opts;
  const lines = ['<!DOCTYPE html>', '<html>', '<head>', '<style>', STYLE, '</style>', '</head>', '<body>'];

  lines.push('<div id="contents">');
  lines.push(`<div class="full">${computeBreadcrumbs(prefix)}</div>`);
  lines.push('<div class="full">&nbsp;</div>');
  if (objects.delimitedPrefixes.length > 0) {
    for (const delimitedPrefix of objects.delimitedPrefixes) {
      lines.push(`<a class="full" href="${encodeXml('/' + delimitedPrefix)}">${encodeXml(delimitedPrefix.substring(prefix.length))}</a>`);
    }
    lines.push('<div class="full">&nbsp;</div>');
  }
  for (const obj of objects.objects) {
    lines.push(`<a href="${encodeXml('/' + obj.key)}">${encodeXml(obj.key.substring(prefix.length))}</a><div class="ralign">${obj.size.toLocaleString()}</div><div class="ralign">${computeBytesString(obj.size)}</div><div>${obj.uploaded.toISOString()}</div>`);
  }
  if (cursor) {
    lines.push('<div class="full">&nbsp;</div>');
    lines.push(`<div class="full"><a href="?${directoryListingLimitParam ? `directoryListingLimit=${directoryListingLimitParam}&` : ''}cursor=${encodeXml(cursor)}">next ➜</a></div>`);
  }
  lines.push('</div>');

  lines.push('</body>','</html>');
  return lines.join('\n');
}

//

const STYLE = `
body { margin: 3rem; font-family: sans-serif; }
a { text-decoration: none; text-underline-offset: 0.2rem; }
a:hover { text-decoration: underline; }
.ralign { text-align: right; }
#contents { display: grid; grid-template-columns: 1fr 6rem auto auto; gap: 0.5rem 1.5rem; white-space: nowrap; }
#contents .full { grid-column: 1 / span 4; }
@media (prefers-color-scheme: dark) {
  body {background: #121212; color: #f5f5f5; }
  a { color: #bb86fc; }
}
`;

const MAX_TWO_DECIMALS = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function computeBytesString(bytes: number): string {
  if (bytes < 1024) return '';
  let amount = bytes / 1024;
  for (const unit of ['kb', 'mb', 'gb']) {
    if (amount < 1024) return `(${MAX_TWO_DECIMALS.format(amount)} ${unit})`;
    amount = amount / 1024;
  }
  return `(${MAX_TWO_DECIMALS.format(amount)} tb)`;
}

function computeBreadcrumbs(prefix: string): string {
  const tokens = ('/' + prefix).split('/').filter((v, i) => i === 0 || v !== '');
  return tokens.map((v, i) => `${i === 0 ? '' : ` ⟩ `}${i === tokens.length - 1 ? (i === 0 ? 'root' : encodeXml(v)) : `<a href="${tokens.slice(0, i + 1).join('/') + '/'}">${i === 0 ? 'root' : encodeXml(v)}</a>`}`).join('');
}

function encodeXml(unencoded: string): string {
  return unencoded.replaceAll(/[&<>'']/g, (char) => {
    return UNENCODED_CHARS_TO_ENTITIES[char];
  });
}

const UNENCODED_CHARS_TO_ENTITIES: { [char: string]: string } = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '\'': '&#39;', // '&#39;' is shorter than '&apos;'
  '"': '&#34;', // '&#34;' is shorter than '&quot;'
};
