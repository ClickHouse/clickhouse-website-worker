export default {
  domain: 'clickhouse.com',

  origins: {
    /// The content of this part of the website is hosted by GitHub Pages.
    /// We only proxy it on clickhouse.com.
    github: 'content.clickhouse.com',
    github_docs_content: 'docs-content.clickhouse.tech',

    /// The content of this part of our new website.
    website: 'dhqgwvxng9vgy.cloudfront.net',
    website_staging: 'dlico9114pefj.cloudfront.net',
    website_staging2: 'staging-marketing-website-clickhouse.vercel.app',
  },

  redirects: {
    github: 'clickhouse.com',
    website: 'clickhouse.com',
    website_staging: 'staging.clickhouse.com',
  },

  codebrowser: 'clickhouse-test-reports.s3.amazonaws.com',

  production: true,
};
