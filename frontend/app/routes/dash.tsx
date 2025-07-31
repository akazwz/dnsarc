import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Zone } from "gen/zone/v1/zone_pb";
import {
	GlobeIcon,
	Loader2Icon,
	PlusIcon,
	SettingsIcon,
	Trash2Icon,
	UserIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authClient, zoneClient } from "~/connect";

const schema = z.object({
	domain: z.string().min(2).max(255),
});

export default function Dash() {
	const { data: user, isLoading: userLoading } = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const response = await authClient.whoAmI({});
			if (!response.user) {
				throw new Error("Failed to get user");
			}
			return response.user;
		},
	});
	const { data: zones, isLoading: zonesLoading } = useQuery({
		queryKey: ["zones"],
		queryFn: async () => {
			const response = await zoneClient.listZones({});
			return response.zones;
		},
	});
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});
	const onSubmit = (values: z.infer<typeof schema>) => {
		mutation.mutate(values);
	};
	const mutation = useMutation({
		mutationFn: async (values: z.infer<typeof schema>) => {
			const response = await zoneClient.createZone({
				domain: values.domain,
			});
			return response.zone;
		},
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="max-w-6xl mx-auto p-6">
				{/* Header Section */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<Avatar className="size-16 ring-4 ring-white shadow-lg">
									<AvatarImage src="https://github.com/akazwz.png" />
									<AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
										{user?.email?.charAt(0).toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
									<div className="bg-white rounded-full size-2"></div>
								</div>
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									Welcome back
									{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
								</h1>
								<p className="text-gray-600 flex items-center">
									<UserIcon className="size-4 mr-1" />
									{user?.email || "Loading..."}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								className="flex items-center space-x-2"
							>
								<SettingsIcon className="size-4" />
								<span>Settings</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">Total Zones</p>
								<p className="text-3xl font-bold text-gray-900">
									{zonesLoading ? "..." : zones?.length || 0}
								</p>
							</div>
							<div className="bg-blue-100 p-3 rounded-lg">
								<GlobeIcon className="size-6 text-blue-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Active Zones
								</p>
								<p className="text-3xl font-bold text-green-600">
									{zonesLoading ? "..." : zones?.length || 0}
								</p>
							</div>
							<div className="bg-green-100 p-3 rounded-lg">
								<div className="size-6 bg-green-500 rounded-full"></div>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total Records
								</p>
								<p className="text-3xl font-bold text-purple-600">
									{zonesLoading ? "..." : "0"}
								</p>
							</div>
							<div className="bg-purple-100 p-3 rounded-lg">
								<div className="size-6 bg-purple-500 rounded"></div>
							</div>
						</div>
					</div>
				</div>

				{/* Zones Section */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-xl font-semibold text-gray-900 flex items-center">
								<GlobeIcon className="size-5 mr-2 text-blue-600" />
								DNS Zones
							</h2>
							<p className="text-gray-600">
								Manage your domain zones and DNS records
							</p>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
									<PlusIcon className="size-4" />
									<span>Create Zone</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)}>
										<DialogHeader>
											<DialogTitle className="flex items-center">
												<GlobeIcon className="size-5 mr-2 text-blue-600" />
												Create a new zone
											</DialogTitle>
											<DialogDescription>
												Input the domain name of the zone you want to create.
											</DialogDescription>
										</DialogHeader>
										<FormField
											control={form.control}
											name="domain"
											render={({ field }) => (
												<FormItem className="my-4">
													<FormLabel>Domain Name</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="example.com"
															className="text-lg"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<DialogFooter>
											<DialogClose asChild>
												<Button type="button" variant="outline">
													Cancel
												</Button>
											</DialogClose>
											<Button
												type="submit"
												disabled={mutation.isPending}
												className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
											>
												{mutation.isPending ? "Creating..." : "Create Zone"}
											</Button>
										</DialogFooter>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>

					{/* Zones List */}
					{zonesLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2Icon className="size-6 animate-spin text-blue-600" />
							<span className="ml-3 text-gray-600">Loading zones...</span>
						</div>
					) : zones?.length === 0 ? (
						<div className="text-center py-12">
							<div className="bg-gray-100 rounded-full size-20 flex items-center justify-center mx-auto mb-4">
								<GlobeIcon className="size-10 text-gray-400" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No zones found
							</h3>
							<p className="text-gray-500 mb-6">
								Get started by creating your first DNS zone.
							</p>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
										<PlusIcon className="size-4" />
										<span>Create Your First Zone</span>
									</Button>
								</DialogTrigger>
								<DialogContent>
									<Form {...form}>
										<form onSubmit={form.handleSubmit(onSubmit)}>
											<DialogHeader>
												<DialogTitle className="flex items-center">
													<GlobeIcon className="size-5 mr-2 text-blue-600" />
													Create your first zone
												</DialogTitle>
												<DialogDescription>
													Input the domain name of the zone you want to create.
												</DialogDescription>
											</DialogHeader>
											<FormField
												control={form.control}
												name="domain"
												render={({ field }) => (
													<FormItem className="my-4">
														<FormLabel>Domain Name</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="example.com"
																className="text-lg"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<DialogFooter>
												<DialogClose asChild>
													<Button type="button" variant="outline">
														Cancel
													</Button>
												</DialogClose>
												<Button
													type="submit"
													disabled={mutation.isPending}
													className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
												>
													{mutation.isPending ? "Creating..." : "Create Zone"}
												</Button>
											</DialogFooter>
										</form>
									</Form>
								</DialogContent>
							</Dialog>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{zones?.map((zone) => (
								<ZoneCard key={zone.id} zone={zone} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function ZoneCard({ zone }: { zone: Zone }) {
	const navigate = useNavigate();
	const mutation = useMutation({
		mutationFn: async () => {
			await zoneClient.deleteZone({
				id: zone.id,
			});
		},
	});

	function handleClick() {
		navigate(`/dash/${zone.domain}`);
	}

	function handleDelete(e: React.MouseEvent) {
		e.stopPropagation();
		mutation.mutate();
	}

	return (
		<div
			className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50"
			onClick={handleClick}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3 flex-1 min-w-0">
					<div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
						<GlobeIcon className="size-5 text-blue-600" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
							{zone.domain}
						</h3>
						<p className="text-sm text-gray-500">DNS Zone</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleDelete}
					disabled={mutation.isPending}
					className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
					title="Delete zone"
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>

			{/* Hover indicator */}
			<div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
		</div>
	);
}
