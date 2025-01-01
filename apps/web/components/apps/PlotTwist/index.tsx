import { NarrativeGame } from "@/components/apps/NarrativeGame";
import type { User as DBUser } from "@/types/auth";

export function PlotTwist({
	user,
}: {
	user: DBUser;
}) {
	if (!user.username || !user.name) {
		return <div>Loading...</div>;
	}

	return (
		<NarrativeGame playerId={user.username} playerName={user.name} />
	);
}
