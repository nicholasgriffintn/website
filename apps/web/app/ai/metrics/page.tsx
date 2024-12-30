import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { MetricsDashboard } from "./components/dashboard";
import { MetricsControls } from "./components/controls";
import { getAiMetrics } from "@/lib/data/ai/metrics";

export const metadata = {
	title: "AI Metrics",
	description:
		"See the performance metrics from my AI assistant and how it responds across different models.",
};

export default async function AIMetrics({ searchParams }) {
	const params = await searchParams;
	const status = typeof params.status === "string" ? params.status : "success";
	const limit =
		typeof params.limit === "string" ? Number.parseInt(params.limit, 10) : 100;
	const interval =
		typeof params.interval === "string"
			? Number.parseInt(params.interval, 10)
			: 30;
	const timeframe =
		typeof params.timeframe === "string"
			? Number.parseInt(params.timeframe, 10)
			: 24;

	const metrics =
		(await getAiMetrics({
			token: "",
			status,
			limit,
			interval,
			timeframe,
		})) ?? [];

	return (
		<PageLayout>
			<InnerPage>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl md:text-4xl font-bold">AI Metrics</h1>
						</div>
						<MetricsControls
							initialValues={{
								status,
								limit,
								interval,
								timeframe,
							}}
						/>
					</div>
					{metrics.length > 0 ? (
						<MetricsDashboard
							metrics={metrics}
							interval={interval}
							limit={limit}
						/>
					) : (
						<div className="text-center text-muted-foreground">
							No metrics found
						</div>
					)}
				</div>
			</InnerPage>
		</PageLayout>
	);
}
