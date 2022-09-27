function getStacktrace(error: Error): Array<object> {
  const matcher = /at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/;
  const raw_stack = error.stack || '';
  return raw_stack
    .split('\n')
    .slice(1)
    .map((line) => {
      if (line.match(/^\s*[-]{4,}$/)) {
        return {
          filename: line,
        };
      }
      const lineMatch = line.match(matcher);

      if (!lineMatch) {
        return [];
      }

      return {
        function: lineMatch[1] || undefined,
        filename: lineMatch[2] || undefined,
        lineno: +lineMatch[3] || undefined,
        colno: +lineMatch[4] || undefined,
        in_app: lineMatch[5] !== 'native' || undefined,
      };
    })
    .filter(Boolean)
    .reverse();
}

export function sendExceptionToSentry(error: Error, request: Request): Promise<Response> {
  const sentry_key = '97b8a00a8d02479794e34ea6838ecd2e';
  const sentry_url = `https://o388870.ingest.sentry.io/api/5246652/store/?sentry_key=${sentry_key}&sentry_version=7`;
  const error_type = error.name;
  const error_message = error && error.message ? error.message : 'Unknown';
  let headers: { [name: string]: string; } = {};
  ["range", "user-agent", "host"].forEach(function (header: string) {
    const value = request.headers.get(header);
    if (value) {
      headers[header] = value;
    }
  });
  const body = {
    logger: 'javascript',
    platform: 'javascript',
    request: {
      method: request.method.toUpperCase(),
      url: request.url.toString(),
      headers: headers,
    },
    exception: {
      values: [
        {
          type: 'Error',
          value: `${error_type}: ${error_message}`,
          stacktrace: { frames: getStacktrace(error) },
        },
      ],
    },
  };
  return fetch(sentry_url, { body: JSON.stringify(body), method: 'POST' });
}
