export default {
  domain: 'clickhouse.com',
  /**
   * origins for github and pantheon are currently the same intentionally and should
   * remain so until the production WordPress site is launched. This will permit
   * us to test staging first without disrupting the existing production site.
   */
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
