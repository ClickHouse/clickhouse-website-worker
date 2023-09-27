export default {
  domain: 'clickhouse.com',

  origins: {
    /// The content of this part of the website is hosted by GitHub Pages.
    /// We only proxy it on clickhouse.com.
    github: 'raw.githubusercontent.com',
    github_docs_content: 'clickhouse-docs.vercel.app',

    /// The content of this part of our new website.
    website: 'production-marketing-website.vercel.app',
    website_staging: 'marketing-website-git-main-clickhouse.vercel.app',
    website_cookie:
      'marketing-website-git-securiti-cookie-consent-sep26-clickhouse.vercel.app',
  },

  redirects: {
    github: 'clickhouse.com',
    website: 'clickhouse.com',
    website_staging: 'staging.clickhouse.com',
    website_cookie: 'cookie.clickhouse.com',
  },

  codebrowser: 'clickhouse-test-reports.s3.amazonaws.com',

  production: true,
};
