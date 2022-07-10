export default {
  domain: 'clickhouse.com',

  origins: {
    /// The content of this part of the website is hosted by GitHub Pages.
    /// We only proxy it on clickhouse.com.
    github: 'content.clickhouse.com',
    github_docs_content: 'docs-content.clickhouse.tech',

    /// The content of this part of the website is hosted by external company.
    pantheon: 'live-clickhouse.pantheonsite.io',
    pantheon_staging: 'dlico9114pefj.cloudfront.net',
  },

  redirects: {
    github: 'clickhouse.com',
    pantheon: 'clickhouse.com',
    pantheon_staging: 'staging.clickhouse.com',
  },

  codebrowser: 'clickhouse-test-reports.s3.amazonaws.com',

  production: true,
};
