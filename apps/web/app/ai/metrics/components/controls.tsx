import Form from "next/form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MetricsControlsProps {
	initialValues: {
		status: string;
		limit: number;
		interval: number;
		timeframe: number;
	};
}

export function MetricsControls({ initialValues }: MetricsControlsProps) {
	return (
		<Form action="/ai-metrics" className="flex items-end gap-4">
			<div className="w-[180px]">
				<Label htmlFor="status">Status</Label>
				<Select name="status" defaultValue={initialValues.status}>
					<SelectTrigger id="status">
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="success">Success</SelectItem>
						<SelectItem value="error">Error</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="w-[100px]">
				<Label htmlFor="limit">Limit</Label>
				<Input
					name="limit"
					type="number"
					defaultValue={initialValues.limit}
					min={1}
					max={1000}
					className="w-full"
				/>
			</div>
			<div className="w-[100px]">
				<Label htmlFor="interval">Interval</Label>
				<Input
					name="interval"
					type="number"
					defaultValue={initialValues.interval}
					min={1}
					max={1440}
					className="w-full"
				/>
			</div>
			<div className="w-[100px]">
				<Label htmlFor="timeframe">Timeframe</Label>
				<Input
					name="timeframe"
					type="number"
					defaultValue={initialValues.timeframe}
					min={1}
					max={168}
					className="w-full"
				/>
			</div>
			<Button type="submit" size="sm">
				Update
			</Button>
		</Form>
	);
}
