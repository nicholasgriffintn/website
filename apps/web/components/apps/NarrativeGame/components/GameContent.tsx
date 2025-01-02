import type { User, NarrativeGameState } from "../types";
import { StoryContribution } from "./StoryContribution";
import { AISuggestions } from "./AISuggestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
	gameState: NarrativeGameState;
	users: User[];
	playerId: string;
	isLoading: boolean;
	onSubmitContribution: (contribution: string) => void;
	onVoteOnSuggestion: (index: number) => void;
	onRequestAIIntervention: () => void;
	onSubmitContributionVote: (contributionId: number) => void;
	onSubmitAlternativeEnding: (text: string) => void;
}

export function GameContent({
	gameState,
	users,
	playerId,
	isLoading,
	onSubmitContribution,
	onVoteOnSuggestion,
	onRequestAIIntervention,
	onSubmitContributionVote,
	onSubmitAlternativeEnding,
}: Props) {
	return (
		<div className="space-y-6">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						{gameState.hasEnded || gameState.isReviewPhase ? (
							<CardTitle className="text-2xl font-bold text-green-800">
								{gameState.hasEnded ? "Game Complete! 🎉" : "Review Phase"}
							</CardTitle>
						) : (
							<CardTitle className="text-2xl font-bold">
								Collaborate on the Story
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							{(gameState.hasEnded || gameState.isReviewPhase) && (
								<div>
									<h4 className="font-medium text-lg text-green-700 mb-4">
										Final Scores:
									</h4>
									<div className="space-y-2">
										{users
											.sort((a, b) => b.score - a.score)
											.map((user) => (
												<div
													key={user.id}
													className="flex justify-between items-center bg-card p-3 rounded-lg shadow-sm"
												>
													<span className="font-medium">{user.name}</span>
													<span className="text-lg font-bold text-green-600">
														{user.score} points
													</span>
												</div>
											))}
									</div>
								</div>
							)}

							<div className="space-y-4">
								<div className="bg-card rounded-lg shadow-sm border border-gray-100 p-4">
									<div className="flex items-center justify-between mb-2">
										<div className="font-medium text-muted-foreground">
											Story Prompt
										</div>
									</div>
									<p className="text-foreground whitespace-pre-wrap font-medium">
										{gameState.storyPrompt}
									</p>
								</div>
								{gameState.contributions.map((contribution, index) => {
									const review = gameState.contributionReviews.find(
										(r) => r.contributionId === index,
									);
									const hasVoted = review?.voters.includes(playerId);

									return (
										<div
											key={`${contribution.playerId}-${contribution.timestamp}`}
											className="bg-card rounded-lg p-4 border"
										>
											<div className="flex items-center justify-between mb-2">
												<span className="font-medium">
													{users.find((u) => u.id === contribution.playerId)
														?.name || "Unknown Player"}
												</span>
												{gameState.isReviewPhase && (
													<span className="text-sm text-muted-foreground">
														{review?.votes || 0} votes
													</span>
												)}

												<span className="text-sm text-muted-foreground">
													Submitted:{" "}
													{new Date(
														contribution.timestamp,
													).toLocaleTimeString()}
												</span>
											</div>
											<p className="mb-4">{contribution.text}</p>
											{gameState.isReviewPhase && (
												<Button
													onClick={() => onSubmitContributionVote(index)}
													disabled={hasVoted || isLoading}
													variant="outline"
													size="sm"
												>
													{hasVoted
														? "Already Voted"
														: "Vote for this contribution"}
												</Button>
											)}
										</div>
									);
								})}
							</div>

							{gameState.isReviewPhase && (
								<div className="space-y-4">
									<h4 className="font-medium text-lg">
										Suggest an Alternative Ending
									</h4>
									<form
										onSubmit={(e) => {
											e.preventDefault();
											const formData = new FormData(e.currentTarget);
											const text = formData.get("alternativeEnding") as string;
											if (text?.trim()) {
												onSubmitAlternativeEnding(text);
												e.currentTarget.reset();
											}
										}}
										className="space-y-4"
									>
										<Textarea
											name="alternativeEnding"
											placeholder="Write an alternative ending for the story..."
											rows={4}
											required
										/>
										<Button type="submit" disabled={isLoading}>
											Submit Alternative Ending
										</Button>
									</form>

									{gameState.alternativeEndings.length > 0 && (
										<div className="space-y-4">
											<h4 className="font-medium text-lg">
												Proposed Alternative Endings
											</h4>
											<div className="space-y-4">
												{gameState.alternativeEndings.map((ending) => (
													<div
														key={`${ending.playerId}-${ending.text.substring(0, 20)}`}
														className="bg-card rounded-lg p-4 border"
													>
														<div className="flex items-center justify-between mb-2">
															<span className="font-medium">
																{
																	users.find((u) => u.id === ending.playerId)
																		?.name
																}
															</span>
															<span className="text-sm text-muted-foreground">
																{ending.votes} votes
															</span>
														</div>
														<p>{ending.text}</p>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{gameState.aiSuggestions.length > 0 && (
				<AISuggestions
					suggestions={gameState.aiSuggestions}
					onVote={onVoteOnSuggestion}
					isLoading={isLoading}
				/>
			)}

			{gameState.isActive && (
				<Card>
					{gameState.currentTurn === playerId ? (
						<CardHeader>
							<CardTitle>Your Turn</CardTitle>
						</CardHeader>
					) : (
						<CardHeader>
							<CardTitle>
								{users.find((u) => u.id === gameState.currentTurn)?.name}'s
								Turn
							</CardTitle>
						</CardHeader>
					)}
					<CardContent>
						{gameState.currentTurn === playerId ? (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									const formData = new FormData(e.currentTarget);
									const contribution = formData.get("contribution") as string;
									if (contribution?.trim()) {
										onSubmitContribution(contribution);
										e.currentTarget.reset();
									}
								}}
								className="space-y-4"
							>
								<Textarea
									name="contribution"
									placeholder="Add to the story..."
									disabled={isLoading}
									rows={4}
									required
								/>
								<div className="flex justify-end">
									<Button type="submit" disabled={isLoading}>
										{isLoading ? "Submitting..." : "Submit Story"}
									</Button>
									<Button
										onClick={onRequestAIIntervention}
										disabled={
											isLoading ||
											(!!gameState.aiCooldownEnd &&
												gameState.aiCooldownEnd > Date.now())
										}
									>
										{isLoading
											? "Loading..."
											: !!gameState.aiCooldownEnd &&
													gameState.aiCooldownEnd > Date.now()
												? "AI is on cooldown. Please wait..."
												: "Request AI Help"}
									</Button>
								</div>
							</form>
						) : (
							<p>
								Waiting for{" "}
								{users.find((u) => u.id === gameState.currentTurn)?.name} to
								submit their contribution...
							</p>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
