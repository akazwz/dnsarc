import { ArrowLeftIcon } from "lucide-react";
import { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { authClient } from "~/connect";
import { useAuthStore } from "~/stores/auth";
import type { Route } from "./+types/auth";

export async function loader() {
	const response = await authClient.googleLoginURL({});
	const url = response.url;
	return {
		url,
	};
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
	const { url } = await serverLoader();
	const accessToken = useAuthStore.getState().accessToken;
	if (accessToken) {
		return redirect("/dash");
	}
	return {
		url,
	};
}

export default function AuthPage({ loaderData }: Route.ComponentProps) {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");
	const navigate = useNavigate();
	useEffect(() => {
		if (token) {
			useAuthStore.getState().signIn(token);
			toast.success("Login successful");
			navigate("/dash");
		}
	}, [token, navigate]);
	return (
		<div className="h-dvh flex flex-col p-4">
			<div>
				<Button variant="ghost" asChild>
					<Link to="/" viewTransition>
						<ArrowLeftIcon />
						Back Home
					</Link>
				</Button>
			</div>
			<div className="flex flex-col items-center justify-center flex-1">
				<h1 className="text-xl font-bold mb-4">
					Welcome to
					<span className="mx-1 text-blue-500">DNSARC</span>
				</h1>
				<p className="text-muted-foreground mb-8">Sign in below to continue</p>
				<Button size="lg" className="w-full mx-auto max-w-sm h-12" asChild>
					<Link to={loaderData.url}>
						<FcGoogle className="mr-2 size-4" />
						Continue with Google
					</Link>
				</Button>
				<span className="text-sm text-muted-foreground mt-6">
					By continuing, you agree to our
					<Link to="/terms" className="text-primary hover:underline mx-1">
						Terms of Service
					</Link>
					and
					<Link to="/privacy" className="text-primary hover:underline mx-1">
						Privacy Policy
					</Link>
				</span>
			</div>
		</div>
	);
}
