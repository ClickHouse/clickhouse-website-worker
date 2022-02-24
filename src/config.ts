export default {
  domain: 'clickhouse.com',
  origins: {
    github: 'content.clickhouse.com',
    pantheon: 'content.clickhouse.com',
    pantheon_staging: 'staging-clickhouse.pantheonsite.io',
  },
  redirects: {
    github: 'clickhouse.com',
    pantheon: 'clickhouse.com',
    pantheon_staging: 'staging.clickhouse.com',
  },
  codebrowser: 'clickhouse-test-reports.s3.yandex.net',
  production: true,
};
