export default {
  domain: 'clickhouse.com',
  origins: {
    github: 'content.clickhouse.com',
    pantheon: 'live-clickhouse.pantheonsite.io',
    pantheon_staging: 'staging-clickhouse.pantheonsite.io',
  },
  redirects: {
    github: 'clickhouse.com',
    pantheon: 'clickhouse.com',
    pantheon_staging: 'staging.clickhouse.com',
  },
  codebrowser: 'clickhouse-test-reports.s3.amazonaws.com',
  production: true,
};
