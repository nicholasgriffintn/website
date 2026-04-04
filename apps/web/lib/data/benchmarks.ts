export async function getBenchmarkData() {
  const { default: benchmarkData } = await import("@/lib/data/ai-benchmarks.json");
  return benchmarkData;
}
