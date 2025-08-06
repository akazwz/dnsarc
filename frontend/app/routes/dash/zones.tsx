import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BadgeCheckIcon,
	BadgeXIcon,
	GlobeIcon,
	LoaderIcon,
	Trash2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { Link } from "react-router";
import { CreateZoneDialog } from "~/components/dialogs/create-zone-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { zoneClient } from "~/connect";

export default function Zones() {
	const queryClient = useQueryClient();

	const {
		data: zones,
		isLoading,
		isLoadingError,
	} = useQuery({
		queryKey: ["zones"],
		queryFn: async () => {
			const response = await zoneClient.listZones({});
			const zones = response.zones;
			return zones;
		},
	});

	const _deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await zoneClient.deleteZone({
				id: id,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["zones"],
			});
		},
	});

	return (
		<div className="flex flex-1 flex-col h-full">
			<div className="flex border-b border-muted h-12 p-3 items-center">
				<h1 className="text-md font-bold">Zones</h1>
				<div className="flex-1" />
				<CreateZoneDialog />
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
				</div>
			)}
			<ScrollArea className="flex-1 flex flex-col overflow-y-auto">
				<div className="p-2 flex flex-col gap-2">
					{zones?.map((zone) => (
						<div key={zone.id} className="relative">
							<Button
								variant="ghost"
								size="lg"
								className="h-fit p-6 w-full border shadow-sm"
								asChild
							>
								<Link to={`/dash/zone/${zone.zoneName}`}>
									<GlobeIcon className="size-6" />
									<div className="flex flex-col gap-1">
										<p className="text-sm font-medium">{zone.zoneName}</p>
										{zone.isActive ? (
											<Badge
												variant="secondary"
												className="bg-green-500 text-white dark:bg-green-600"
											>
												<BadgeCheckIcon />
												Active
											</Badge>
										) : (
											<Badge
												variant="secondary"
												className="bg-red-500 text-white dark:bg-red-600"
											>
												<BadgeXIcon />
												Inactive
											</Badge>
										)}
									</div>
									<div className="flex-1" />
								</Link>
							</Button>
							<div className="absolute right-2 top-1/2 -translate-y-1/2">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="outline" size="sm">
											<Trash2Icon className="size-4" />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Are you absolutely sure?
											</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently
												delete this zone: {zone.zoneName}
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												disabled={_deleteMutation.isPending}
												onClick={(_e) => {
													_deleteMutation.mutate(zone.id);
												}}
											>
												Confirm
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					))}
				</div>
				<div className="h-16" />
			</ScrollArea>
		</div>
	);
}
