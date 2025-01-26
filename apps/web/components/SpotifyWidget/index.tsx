import { Suspense } from "react";

import { Image } from "@/components/Image";
import "./styles.css";

import ReturnImageFormattingUrl from "@/lib/returnImageFormattingUrl";
import type { RecentTracks } from "@/types/spotify";

export function SpotifyWidget({ data }: { data: RecentTracks | undefined }) {
	if (!data) {
		return null;
	}

	const tracksList = data?.recenttracks;

	const firstTrack = tracksList?.track?.length > 0 ? tracksList.track[0] : null;
	const firstTrackImage = firstTrack?.image?.find(
		(element) => element.size === "extralarge",
	)?.["#text"];

	return (
		<div id="spotify-widget">
			<Suspense fallback={<div>Loading...</div>}>
				{firstTrack ? (
					<>
						<div className="spotify-widget-latest">
							{firstTrackImage ? (
								<div
									className="spotify-widget-latest-background"
									style={{
										position: "relative",
									}}
								>
									<Image
										alt={firstTrack.name}
										src={ReturnImageFormattingUrl(firstTrackImage)}
										fill
										style={{
											objectFit: "cover",
										}}
										unoptimized
										width={700}
										height={245}
										loading="eager"
									/>
								</div>
							) : null}
							<div className="spotify-widget-latest-overlay">
								<h3>{firstTrack.name}</h3>
								<span>{firstTrack.artist["#text"]}</span>
								<span>{firstTrack.album["#text"]}</span>
								<a
									aria-label={`Play ${firstTrack.name}`}
									className="trackLinkPlay"
									rel="noopener noreferrer nofollow"
									target="_blank"
									href={firstTrack.url}
								>
									<svg
										role="presentation"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 60 60"
									>
										<path d="M45.563 29.174l-22-15A1 1 0 1 0 22 15v30a.999.999 0 0 0 1.563.826l22-15a1 1 0 0 0 0-1.652zM24 43.107V16.893L43.225 30 24 43.107z" />
										<path d="M30 0C13.458 0 0 13.458 0 30s13.458 30 30 30 30-13.458 30-30S46.542 0 30 0zm0 58C14.561 58 2 45.439 2 30S14.561 2 30 2s28 12.561 28 28-12.561 28-28 28z" />
									</svg>
								</a>
							</div>
							{firstTrack?.["@attr"]?.nowplaying === "true" ? (
								<div className="absolute left-0 bottom-0 z-10 bg-[#010517] text-primary-foreground px-1 py-1 text-sm">
									<span>Now Playing</span>
								</div>
							) : null}
						</div>
						<div className="spotify-widget-tracks">
							{tracksList?.track?.map((track, index) => {
								if (index !== 0) {
									const trackImage = track.image.find(
										(element) => element.size === "medium",
									)?.["#text"];

									return (
										<div
											className="spotify-widget-track-item"
											key={`${track.mbid}_${track.date.uts}`}
										>
											{trackImage ? (
												<div className="spotify-widget-track-item-image">
													<Image
														width="53"
														height="53"
														loading="lazy"
														alt={track.album["#text"]}
														src={ReturnImageFormattingUrl(trackImage)}
														style={{
															objectFit: "cover",
														}}
														unoptimized
													/>
												</div>
											) : null}
											<div className="spotify-widget-track-item-content">
												<a
													className="trackLinkPlay"
													rel="noopener noreferrer nofollow"
													target="_blank"
													href={track.url}
												>
													<h3>{track.name}</h3>
													<span>{track.artist["#text"]}</span>
													<span>{track.album["#text"]}</span>
												</a>
											</div>
										</div>
									);
								}
							})}
						</div>
					</>
				) : null}
			</Suspense>
		</div>
	);
}
