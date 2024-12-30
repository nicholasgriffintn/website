import NextLink from "next/link";
import { clsx } from "clsx";
import { ExternalLink } from "lucide-react";

export function Link({
	href,
	children,
	underline = true,
	className,
	muted = false,
	target = "_self",
	showExternalIcon = true,
	...props
}: {
	href: string;
	children: React.ReactNode;
	underline?: boolean;
	className?: string;
	muted?: boolean;
	target?: string;
	showExternalIcon?: boolean;
	[key: string]: unknown;
}) {
	return (
		<NextLink
			{...props}
			href={href}
			target={target}
			className={clsx(
				className,
				"inline font-bold p-0 transition-colors hover:underline hover:outline-none decoration-1 decoration-skip-ink-none underline-offset-[0.25em] hover:decoration-2",
				{
					underline: underline,
				},
				muted ? "text-muted-foreground" : "text-primary-foreground",
			)}
			prefetch={false}
		>
			{children}
			{showExternalIcon && target === "_blank" && (
				<ExternalLink className="inline ml-1" size={12} />
			)}
		</NextLink>
	);
}
