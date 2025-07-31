import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function Home() {
	return (
		<div className="flex flex-col h-dvh">
			<div className="flex p-2">
				<div className="flex-1" />
				<Link
					to="/login"
					className={cn(buttonVariants({ variant: "secondary" }))}
				>
					Login
				</Link>
			</div>
			<div className="flex-1 flex flex-col items-center justify-center gap-4">
				<h1 className="text-4xl font-bold">DNSARC</h1>
				<p className="text-sm text-muted-foreground">
					DNSARC is a platform for managing DNS records.
				</p>
			</div>
		</div>
	);
}
