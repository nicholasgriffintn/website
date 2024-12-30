import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import benchmarkData from "@/lib/data/ai-benchmarks.json";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";

type Message = {
	role: string;
	content: string;
};

type ModelResponse = {
	model?: string;
	request: {
		model: string;
		message: string;
		chatId?: string;
		mode?: string;
		role?: string;
		max_tokens?: number;
		timestamp?: string;
	};
	response?: Message | Message[] | null;
	status?: string;
	reason?: string | null;
};

type Benchmark = {
	id: string;
	prompt: string;
	description: string;
	models: ModelResponse[];
};

export const metadata = {
	title: "AI Benchmarks",
	description:
		"Compare responses from different AI models from my personal testing.",
};

async function getData(): Promise<Benchmark[]> {
	return benchmarkData;
}

export default async function Home() {
	const data = await getData();

	return (
		<PageLayout>
			<InnerPage>
				<div className="grid grid-cols-5 gap-4 h-full">
					<div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
						<div className="text-primary-foreground lg:max-w-[75%]">
							<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
								AI Benchmarks
							</h1>
							<p>
								Compare responses from different AI models from my personal
								testing.
							</p>
						</div>
					</div>
				</div>
				{data.map((benchmark: Benchmark) => (
					<Card key={benchmark.id} className="mb-6">
						<CardHeader>
							<CardTitle>{benchmark.description}</CardTitle>
							<CardDescription>Prompt: {benchmark.prompt}</CardDescription>
						</CardHeader>
						<CardContent>
							<Accordion type="single" collapsible className="w-full">
								{benchmark.models.map((model: ModelResponse, modelIndex) => (
									<AccordionItem
										key={`${benchmark.id}-${modelIndex}`}
										value={`item-${modelIndex}`}
									>
										<AccordionTrigger>{model.request.model}</AccordionTrigger>
										<AccordionContent>
											<div className="flex flex-col md:flex-row">
												<ScrollArea className="h-[400px] md:w-1/2 rounded-md border p-4 mr-0 md:mr-2 mb-4 md:mb-0">
													<div className="mb-4">
														<div className="font-semibold">User:</div>
														<div className="whitespace-pre-wrap">
															{model.request.message}
														</div>
													</div>
													{model.response && Array.isArray(model.response) ? (
														model.response.map((message, messageIndex) => (
															<div
																key={`${benchmark.id}-${modelIndex}-${messageIndex}`}
																className="mb-4"
															>
																<div className="font-semibold">
																	{message.role}:
																</div>
																<div className="whitespace-pre-wrap">
																	{message.content}
																</div>
															</div>
														))
													) : model.response ? (
														<div className="mb-4">
															<div className="font-semibold">
																{model.response.role}:
															</div>
															<div className="whitespace-pre-wrap">
																{model.response.content}
															</div>
														</div>
													) : null}
												</ScrollArea>
												<div className="md:w-1/2 md:ml-2">
													{model.status === "failed" && (
														<div className="">
															<h4 className="text-sm font-semibold mb-2 text-red-500">
																Failed benchmark ({model.reason}).
															</h4>
														</div>
													)}
													{model.response &&
														(Array.isArray(model.response)
															? model.response.some((message) =>
																	message.content.includes("<svg"),
																)
															: model.response.content.includes("<svg")) && (
															<div className="h-[400px] rounded-md border p-4 bg-white">
																<h4 className="text-sm font-semibold mb-2 text-black">
																	Generated SVG:
																</h4>
																<div className="w-full h-[calc(100%-2rem)] flex items-center justify-center">
																	<div
																		// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
																		dangerouslySetInnerHTML={{
																			__html:
																				(Array.isArray(model.response)
																					? model.response.find((message) =>
																							message.content.includes("<svg"),
																						)?.content
																					: model.response.content
																				)
																					?.match(/<svg[\s\S]*?<\/svg>/)?.[0]
																					?.replace(
																						/<svg/,
																						'<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"',
																					) ?? "",
																		}}
																	/>
																</div>
															</div>
														)}
												</div>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</CardContent>
					</Card>
				))}
			</InnerPage>
		</PageLayout>
	);
}
