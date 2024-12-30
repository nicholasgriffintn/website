import { Button } from "@/components/ui/button";

export function SignInForm({ redirectUrl }: { redirectUrl: string }) {
    return (
        <form action={`/api/auth/github`} method="GET" className="flex flex-col gap-2">
            <input type="hidden" name="redirectUrl" value={redirectUrl} />
            <Button
                type="submit"
                variant="outline"
                size="lg"
            >
                Sign in with GitHub
            </Button>
        </form>
    );
}
