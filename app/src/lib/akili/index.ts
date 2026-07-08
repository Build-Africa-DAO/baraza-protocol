// Compatibility barrel — re-exports akili module for @/lib/akili path
// Some test files and PR branches import from @/lib/akili which resolves to
// app/src/lib/akili/. This barrel forwards all exports to the canonical
// location at @/akili (app/src/akili/).
export * from '@/akili';
