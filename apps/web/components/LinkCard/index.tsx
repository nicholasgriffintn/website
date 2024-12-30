import { Link } from "@/components/Link";

export function LinkCard({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) {
    return (
        <Link underline={false} href={href} className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <h3 className="font-semibold text-lg mb-0">{title}</h3>
            </div>
            <p className="text-muted-foreground">
                {description}
            </p>
        </Link>
    )
}