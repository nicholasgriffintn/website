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

type Choice = {
	index: number;
	message: Message;
	finish_reason: string;
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
	response?: Message | Message[] | { choices: Choice[] } | null;
	status?: string;
	reason?: string | null;
};

type Benchmark = {
	id: string;
	prompt: string | { type?: string; text: string } | any;
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

// Helper function to safely display content
const safeContent = (content: any): string => {
	if (content === null || content === undefined) return '';
	if (typeof content === 'string') return content;
	try {
		return JSON.stringify(content);
	} catch (e) {
		return '[Object cannot be displayed]';
	}
};

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
							<CardDescription>
								<span suppressHydrationWarning>
									Prompt: {typeof benchmark.prompt === 'string' 
										? benchmark.prompt 
										: typeof benchmark.prompt === 'object' && benchmark.prompt !== null && 'text' in benchmark.prompt 
											? String(benchmark.prompt.text) 
											: '[Complex prompt]'}
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Accordion type="single" collapsible className="w-full">
								{benchmark.models.map((model: ModelResponse, modelIndex) => (
									<AccordionItem
										key={`${benchmark.id}-${modelIndex}`}
										value={`item-${modelIndex}`}
									>
										<AccordionTrigger suppressHydrationWarning>{model.request.model}</AccordionTrigger>
										<AccordionContent>
											<div className="flex flex-col md:flex-row">
												<ScrollArea className="h-[400px] md:w-1/2 rounded-md border p-4 mr-0 md:mr-2 mb-4 md:mb-0">
													<div className="mb-4">
														<div className="font-semibold">User:</div>
														<div className="whitespace-pre-wrap" suppressHydrationWarning>
															{safeContent(model.request.message)}
														</div>
													</div>
													{model.response && typeof model.response === "object" && "choices" in model.response ? (
														// Handle choices format
														model.response.choices.map((choice: any, choiceIndex) => (
															<div
																key={`${benchmark.id}-${modelIndex}-choice-${choiceIndex}`}
																className="mb-4"
															>
																<div className="font-semibold" suppressHydrationWarning>
																	{choice.message?.role || 'Assistant'}:
																</div>
																<div className="whitespace-pre-wrap" suppressHydrationWarning>
																	{safeContent(choice.message?.content)}
																</div>
															</div>
														))
													) : model.response && Array.isArray(model.response) ? (
														model.response.map((message, messageIndex) => (
															<div
																key={`${benchmark.id}-${modelIndex}-${messageIndex}`}
																className="mb-4"
															>
																<div className="font-semibold" suppressHydrationWarning>
																	{message.role || 'Unknown'}:
																</div>
																<div className="whitespace-pre-wrap" suppressHydrationWarning>
																	{safeContent(message.content)}
																</div>
															</div>
														))
													) : model.response && typeof model.response === "object" && "role" in model.response ? (
														<div className="mb-4">
															<div className="font-semibold" suppressHydrationWarning>
																{model.response.role || 'Unknown'}:
															</div>
															<div className="whitespace-pre-wrap" suppressHydrationWarning>
																{safeContent(model.response.content)}
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
														((typeof model.response === "object" && "choices" in model.response && 
															model.response.choices?.some((choice: any) => 
																typeof choice.message?.content === "string" && choice.message?.content?.includes("<svg"))) ||
														(Array.isArray(model.response)
															? model.response.some((message) =>
																	typeof message.content === "string" && message.content?.includes("<svg"),
																)
															: typeof model.response === "object" && "content" in model.response && 
																typeof model.response.content === "string" && model.response.content?.includes("<svg"))) && (
															<div className="h-[400px] rounded-md border p-4 bg-white">
																<h4 className="text-sm font-semibold mb-2 text-black">
																	Generated SVG:
																</h4>
																<div className="w-full h-[calc(100%-2rem)] flex items-center justify-center">
																	<div
																		// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
																		dangerouslySetInnerHTML={{
																			__html:
																				(typeof model.response === "object" && "choices" in model.response
																					? model.response.choices.find((choice: any) =>
																							typeof choice.message?.content === "string" && choice.message?.content?.includes("<svg")
																						)?.message?.content
																					: Array.isArray(model.response)
																					? model.response.find((message) =>
																							typeof message?.content === "string" && message?.content?.includes("<svg"),
																						)?.content
																					: typeof model.response === "object" && "content" in model.response && typeof model.response.content === "string"
																						? model.response.content
																						: ""
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
