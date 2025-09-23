module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:8888/',
        'http://localhost:8888/directorio',
        'http://localhost:8888/meeting'
      ],
      // Number of runs
      numberOfRuns: 3,
      // Start server command
      startServerCommand: 'npm run preview',
      // Wait for server to start
      startServerReadyPattern: 'Local:',
      // Wait time for server to start
      startServerReadyTimeout: 30000
    },
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': 'warn'
      },
      // Budget assertions
      budgets: [
        {
          resourceSizes: [
            {
              resourceType: 'script',
              budget: 500
            },
            {
              resourceType: 'total',
              budget: 1000
            }
          ]
        }
      ]
    },
    upload: {
      // Upload to GitHub as PR comment
      target: 'github',
      token: process.env.LHCI_GITHUB_APP_TOKEN,
      // Upload to temporary public storage
      serverBaseUrl: 'https://lhci-canary.appspot.com/',
      // GitHub settings
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      // Upload settings
      ignoreDuplicateBuildFailure: true
    },
    server: {
      // Use Netlify's Lighthouse CI server
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lighthouse-ci.db'
      }
    }
  }
}
