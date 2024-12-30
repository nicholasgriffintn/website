import { Button } from "@/components/ui/button";

export function SignInForm() {
    return (
        <form method="GET" className="flex flex-col gap-2">
            <Button
                formAction="/api/auth/github"
                type="submit"
                variant="outline"
                size="lg"
            >
                Sign in with GitHub
            </Button>
        </form>
    );
}
