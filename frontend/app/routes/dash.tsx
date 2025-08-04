import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Zone } from "gen/zone/v1/zone_pb";
import {
	GlobeIcon,
	Loader2Icon,
	LogOutIcon,
	PlusIcon,
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
	zoneName: z.string().min(1).max(255),
});

import { useAuthStore } from "~/stores/auth";

export default function Dash() {
	const navigate = useNavigate();
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

	const logout = () => {
		useAuthStore.getState().signOut();
		navigate("/login");
	};
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});
	const onSubmit = (values: z.infer<typeof schema>) => {
		mutation.mutate(values);
	};
	const mutation = useMutation({
		mutationFn: async (values: z.infer<typeof schema>) => {
			const response = await zoneClient.createZone({
				zoneName: values.zoneName,
			});
			return response.zone;
		},
	});

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="backdrop-blur-sm bg-background/80 border-b border-border sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3 group">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
								<span className="text-primary-foreground font-bold text-sm">D</span>
							</div>
							<span className="text-xl font-semibold text-foreground tracking-tight">
								DNSARC
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="flex items-center space-x-2"
							onClick={logout}
						>
							<LogOutIcon className="size-4" />
							<span>Sign Out</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="max-w-6xl mx-auto p-6">

				{/* User Section */}
				<div className="bg-card rounded-xl shadow-lg p-6 mb-8 border border-border">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="relative">
								<Avatar className="size-16 ring-4 ring-background shadow-lg">
									<AvatarImage src="https://github.com/akazwz.png" />
									<AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
										{user?.email?.charAt(0).toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
									<div className="bg-background rounded-full size-2"></div>
								</div>
							</div>
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									Welcome back
									{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
								</h1>
								<p className="text-muted-foreground flex items-center">
									<UserIcon className="size-4 mr-1" />
									{user?.email || "Loading..."}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				<div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
					<div className="bg-card rounded-xl shadow-lg p-6 border border-border">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">Total Zones</p>
								<p className="text-3xl font-bold text-foreground">
									{zonesLoading ? "..." : zones?.length || 0}
								</p>
							</div>
							<div className="bg-muted p-3 rounded-xl">
								<GlobeIcon className="size-6 text-muted-foreground" />
							</div>
						</div>
					</div>
				</div>

				{/* Nameserver Information */}
				<div className="bg-muted/50 rounded-xl p-6 mb-8">
					<div className="flex items-center space-x-4">
						<div className="bg-muted p-3 rounded-xl">
							<GlobeIcon className="size-6 text-muted-foreground" />
						</div>
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-foreground mb-3">
								Nameservers
							</h3>
							<div className="flex flex-wrap gap-3">
								<code className="bg-card px-4 py-2 rounded-lg text-sm font-mono text-foreground border border-border">
									ns1.dnsarc.com
								</code>
								<code className="bg-card px-4 py-2 rounded-lg text-sm font-mono text-foreground border border-border">
									ns2.dnsarc.com
								</code>
							</div>
							<p className="text-sm text-muted-foreground mt-3">
								Update these at your domain registrar
							</p>
						</div>
					</div>
				</div>

				{/* Zones Section */}
				<div className="bg-card rounded-xl shadow-lg p-6 border border-border">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-xl font-semibold text-foreground flex items-center">
								<GlobeIcon className="size-5 mr-2 text-muted-foreground" />
								DNS Zones
							</h2>
							<p className="text-muted-foreground">
								Manage your domain zones and DNS records
							</p>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
									<PlusIcon className="size-4" />
									<span>Create Zone</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)}>
										<DialogHeader>
											<DialogTitle className="flex items-center">
												<GlobeIcon className="size-5 mr-2 text-muted-foreground" />
												Create a new zone
											</DialogTitle>
											<DialogDescription>
												Input the domain name of the zone you want to create.
											</DialogDescription>
										</DialogHeader>
										<FormField
											control={form.control}
											name="zoneName"
											render={({ field }) => (
												<FormItem className="my-4">
													<FormLabel>Zone Name</FormLabel>
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
												className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
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
							<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
							<span className="ml-3 text-muted-foreground">Loading zones...</span>
						</div>
					) : zones?.length === 0 ? (
						<div className="text-center py-12">
							<div className="bg-muted rounded-full size-20 flex items-center justify-center mx-auto mb-4">
								<GlobeIcon className="size-10 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-medium text-foreground mb-2">
								No zones found
							</h3>
							<p className="text-muted-foreground mb-6">
								Get started by creating your first DNS zone.
							</p>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
										<PlusIcon className="size-4" />
										<span>Create Your First Zone</span>
									</Button>
								</DialogTrigger>
								<DialogContent>
									<Form {...form}>
										<form onSubmit={form.handleSubmit(onSubmit)}>
											<DialogHeader>
												<DialogTitle className="flex items-center">
													<GlobeIcon className="size-5 mr-2 text-muted-foreground" />
													Create your first zone
												</DialogTitle>
												<DialogDescription>
													Input the domain name of the zone you want to create.
												</DialogDescription>
											</DialogHeader>
											<FormField
												control={form.control}
												name="zoneName"
												render={({ field }) => (
													<FormItem className="my-4">
														<FormLabel>Zone Name</FormLabel>
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
													className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
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
						<div className="space-y-3">
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
		navigate(`/dash/${zone.zoneName}`);
	}

	function handleDelete(e: React.MouseEvent) {
		e.stopPropagation();
		mutation.mutate();
	}

	return (
		<div
			className="group relative bg-card rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 cursor-pointer border border-border"
			onClick={handleClick}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3 flex-1 min-w-0">
					<div className="bg-muted p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
						<GlobeIcon className="size-5 text-muted-foreground" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-foreground truncate transition-colors">
							{zone.zoneName}
						</h3>
						<p className="text-sm text-muted-foreground">DNS Zone</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleDelete}
					disabled={mutation.isPending}
					className="text-red-600 hover:text-red-700 hover:bg-red-50"
					title="Delete zone"
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>
		</div>
	);
}
