// Must run before anything imports React. React picks its dev vs production
// build from process.env.NODE_ENV at load time, and environments that export
// NODE_ENV=production (some CI runners do) would otherwise load the production
// build — where React.act does not exist and every component test crashes.
// Vitest only defaults NODE_ENV to 'test' when it is unset, so pin it here.
// (declared locally — the app tsconfig deliberately excludes node types)
declare const process: { env: Record<string, string | undefined> };
process.env.NODE_ENV = 'test';
