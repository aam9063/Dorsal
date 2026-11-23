/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-no-react',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: '^(react|react-dom|react-router|motion)(/|$)' },
    },
    {
      name: 'core-no-ui-layers',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: '^src/(app|features|worker|shared)/' },
    },
    {
      name: 'export-reader-only-from-worker',
      severity: 'error',
      from: { pathNot: ['^src/worker/', '^src/core/export-reader/'] },
      to: { path: '^src/core/export-reader/' },
    },
    {
      name: 'feature-imports-through-index',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.tsx?$'],
      },
    },
    {
      name: 'no-dev-dependency-in-src',
      severity: 'error',
      from: { path: '^src/', pathNot: '\\.(test|spec)\\.(ts|tsx)$' },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: ['\\.d\\.ts$', '(^|/)index\\.tsx?$', '\\.config\\.(ts|js)$'],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.(test|spec)\\.(ts|tsx)$' },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
