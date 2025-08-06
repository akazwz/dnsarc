import { useQuery } from "@tanstack/react-query";
import {
	BadgeCheckIcon,
	LoaderIcon,
	LogOutIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { authClient } from "~/connect";
import { useAuthStore } from "~/stores/auth";

export default function Account() {
	const {
		data: user,
		isLoading,
		isLoadingError,
	} = useQuery({
		queryKey: ["account"],
		queryFn: async () => {
			const res = await authClient.whoAmI({});
			const user = res.user;
			if (!user) {
				throw new Error("Failed to get user");
			}
			return user;
		},
	});
	const navigate = useNavigate();

	function logout() {
		useAuthStore.getState().signOut();
		navigate("/auth");
	}

	return (
		<div className="flex flex-1 flex-col h-full">
			<div className="flex border-b border-muted h-12 p-3 items-center">
				<h1 className="text-md font-bold">Account</h1>
			</div>
			{isLoading && (
				<div className="h-full flex flex-col gap-2 items-center justify-center">
					<LoaderIcon className="animate-spin" />
				</div>
			)}
			{isLoadingError && (
				<div className="h-full flex flex-col gap-2 items-center justify-center">
					<TriangleAlertIcon />
					<span className="text-sm font-medium">Something went wrong</span>
					<div>
						<Button
							size="lg"
							variant="secondary"
							className="w-full"
							onClick={logout}
						>
							<LogOutIcon className="size-4" />
							Logout
						</Button>
					</div>
				</div>
			)}
			{user && (
				<div className="p-4 flex flex-col gap-4 max-w-4xl w-full mx-auto">
					<div className="flex items-center gap-2 p-4 bg-muted rounded-2xl">
						<Avatar className="size-12">
							<AvatarImage src={user?.avatar} />
							<AvatarFallback>
								{user?.email?.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-1">
							<Badge
								variant="secondary"
								className="bg-blue-500 text-white dark:bg-blue-600"
							>
								<BadgeCheckIcon />
								Premium
							</Badge>
							<p className="text-sm font-medium">{user?.email}</p>
						</div>
					</div>
					<div>
						<Button
							size="lg"
							variant="outline"
							className="w-full"
							onClick={logout}
						>
							<LogOutIcon className="size-4" />
							Logout
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
