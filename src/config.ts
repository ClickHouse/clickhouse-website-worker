export default {
  domain: 'clickhouse.com',

  origins: {
    /// The content of this part of the website is hosted by GitHub Pages.
    /// We only proxy it on clickhouse.com.
    github: 'raw.githubusercontent.com',
    github_docs_content: 'docs-content.clickhouse.tech',

    /// The content of this part of our new website.
    website: 'production-marketing-website.vercel.app',
    website_staging: 'marketing-website-git-main-clickhouse.vercel.app',
    website_staging2: 'dlico9114pefj.cloudfront.net',
  },

  redirects: {
    github: 'clickhouse.com',
    website: 'clickhouse.com',
    website_staging: 'staging.clickhouse.com',
  },

  codebrowser: 'clickhouse-test-reports.s3.amazonaws.com',

  production: true,
};
