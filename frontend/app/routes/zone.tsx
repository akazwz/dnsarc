import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DNSRecord } from "gen/dns_record/v1/dns_record_pb";
import {
	DatabaseIcon,
	EditIcon,
	GlobeIcon,
	Loader2Icon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { dnsRecordClient, zoneClient } from "~/connect";
import type { Route } from "./dash/+types";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	return {
		zoneName: params.zoneName,
	};
}

const schema = z.object({
	name: z.string().min(1).max(255),
	type: z.string().min(1),
	content: z.string().min(2).max(255),
	ttl: z.number().min(300).max(86400),
});

export default function Records({ loaderData }: Route.ComponentProps) {
	const { zoneName } = loaderData;
	const navigate = useNavigate();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const { data: zone } = useQuery({
		queryKey: ["zone", zoneName],
		queryFn: async () => {
			const response = await zoneClient.getZoneByName({
				zoneName: zoneName,
			});
			return response.zone;
		},
	});

	function onSubmit(values: z.infer<typeof schema>) {
		createMutation.mutate(values);
	}

	const createMutation = useMutation({
		mutationFn: async (values: z.infer<typeof schema>) => {
			console.log("create mutation", values);
			if (!zone) {
				throw new Error("Zone not found");
			}
			const resp = await dnsRecordClient.createDNSRecord({
				zoneId: zone.id,
				name: values.name,
				type: values.type,
				content: values.content,
				ttl: values.ttl,
			});
			return resp.record;
		},
	});

	const { data, isLoading } = useQuery({
		queryKey: ["dns_records"],
		queryFn: async () => {
			if (!zone) {
				throw new Error("Zone not found");
			}
			const response = await dnsRecordClient.listDNSRecords({
				zoneId: zone.id,
			});
			return response.records;
		},
		enabled: !!zone,
	});

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="backdrop-blur-sm bg-background/80 border-b border-border sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3 group">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
								<span className="text-primary-foreground font-bold text-sm">
									D
								</span>
							</div>
							<span className="text-xl font-semibold text-foreground tracking-tight">
								DNSARC
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="flex items-center"
							onClick={() => navigate("/dash")}
						>
							<GlobeIcon className="size-4" />
							<span>Back to Zones</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="max-w-6xl mx-auto p-6">
				{/* Zone Section */}
				<div className="bg-card rounded-xl shadow-lg p-6 mb-8 border border-border">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="bg-muted p-3 rounded-xl">
								<GlobeIcon className="size-8 text-muted-foreground" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									DNS Records
								</h1>
								<p className="text-muted-foreground flex items-center">
									<DatabaseIcon className="size-4 mr-1" />
									Managing records for {zone?.zoneName}
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
								<p className="text-sm font-medium text-muted-foreground">
									Total Records
								</p>
								<p className="text-3xl font-bold text-foreground">
									{isLoading ? "..." : data?.length || 0}
								</p>
							</div>
							<div className="bg-muted p-3 rounded-xl">
								<DatabaseIcon className="size-6 text-muted-foreground" />
							</div>
						</div>
					</div>
				</div>

				{/* Records Section */}
				<div className="bg-card rounded-xl shadow-lg p-6 border border-border">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-xl font-semibold text-foreground flex items-center">
								<DatabaseIcon className="size-5 mr-2 text-muted-foreground" />
								DNS Records
							</h2>
							<p className="text-muted-foreground">
								Manage your DNS records for {zone?.zoneName}
							</p>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
									<PlusIcon className="size-4" />
									<span>Create Record</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)}>
										<DialogHeader>
											<DialogTitle className="flex items-center">
												<DatabaseIcon className="size-5 mr-2 text-muted-foreground" />
												Create DNS Record
											</DialogTitle>
											<DialogDescription>
												Add a new DNS record for {zone?.zoneName}
											</DialogDescription>
										</DialogHeader>
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem className="my-4">
													<FormLabel>Record Name</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="Enter record name, root name is @"
															className="text-lg"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="type"
											render={({ field }) => (
												<FormItem className="my-4">
													<FormLabel>Record Type</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select a record type" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="A">A Record</SelectItem>
															<SelectItem value="CNAME">
																CNAME Record
															</SelectItem>
															<SelectItem value="MX">MX Record</SelectItem>
															<SelectItem value="TXT">TXT Record</SelectItem>
															<SelectItem value="AAAA">AAAA Record</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="content"
											render={({ field }) => (
												<FormItem className="my-4">
													<FormLabel>Value</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="Enter record value"
															className="text-lg"
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="ttl"
											render={({ field }) => (
												<FormItem className="my-4">
													<FormLabel>TTL (Time To Live)</FormLabel>
													<FormControl>
														<Input
															type="number"
															value={field.value}
															onChange={(e) =>
																field.onChange(Number(e.target.value))
															}
															onBlur={field.onBlur}
															name={field.name}
															placeholder="300"
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
												disabled={createMutation.isPending}
												className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
											>
												{createMutation.isPending
													? "Creating..."
													: "Create Record"}
											</Button>
										</DialogFooter>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</div>

					{/* Records List */}
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
							<span className="ml-3 text-muted-foreground">
								Loading records...
							</span>
						</div>
					) : data?.length === 0 ? (
						<div className="text-center py-12">
							<div className="bg-muted rounded-full size-20 flex items-center justify-center mx-auto mb-4">
								<DatabaseIcon className="size-10 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-medium text-foreground mb-2">
								No DNS records found
							</h3>
							<p className="text-muted-foreground mb-6">
								Get started by creating your first DNS record for{" "}
								{zone?.zoneName}.
							</p>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
										<PlusIcon className="size-4" />
										<span>Create Your First Record</span>
									</Button>
								</DialogTrigger>
								<DialogContent>
									<Form {...form}>
										<form onSubmit={form.handleSubmit(onSubmit)}>
											<DialogHeader>
												<DialogTitle className="flex items-center">
													<DatabaseIcon className="size-5 mr-2 text-muted-foreground" />
													Create your first DNS record
												</DialogTitle>
												<DialogDescription>
													Add a new DNS record for {zone?.zoneName}
												</DialogDescription>
											</DialogHeader>
											<FormField
												control={form.control}
												name="type"
												render={({ field }) => (
													<FormItem className="my-4">
														<FormLabel>Record Type</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select a record type" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="A">A Record</SelectItem>
																<SelectItem value="CNAME">
																	CNAME Record
																</SelectItem>
																<SelectItem value="MX">MX Record</SelectItem>
																<SelectItem value="TXT">TXT Record</SelectItem>
																<SelectItem value="AAAA">
																	AAAA Record
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="content"
												render={({ field }) => (
													<FormItem className="my-4">
														<FormLabel>Value</FormLabel>
														<FormControl>
															<Input
																{...field}
																placeholder="Enter record value"
																className="text-lg"
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="ttl"
												render={({ field }) => (
													<FormItem className="my-4">
														<FormLabel>TTL (Time To Live)</FormLabel>
														<FormControl>
															<Input
																type="number"
																value={field.value}
																onChange={(e) =>
																	field.onChange(Number(e.target.value))
																}
																onBlur={field.onBlur}
																name={field.name}
																placeholder="300"
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
													disabled={createMutation.isPending}
													className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
												>
													{createMutation.isPending
														? "Creating..."
														: "Create Record"}
												</Button>
											</DialogFooter>
										</form>
									</Form>
								</DialogContent>
							</Dialog>
						</div>
					) : (
						<div className="space-y-3">
							{data?.map((record) => (
								<RecordCard key={record.id} record={record} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function RecordCard({ record }: { record: DNSRecord }) {
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await dnsRecordClient.deleteDNSRecord({
				id: id,
			});
		},
	});
	const getTypeIcon = (type: string) => {
		switch (type.toUpperCase()) {
			case "A":
				return "🌐";
			case "CNAME":
				return "🔗";
			case "MX":
				return "📧";
			case "TXT":
				return "📝";
			case "AAAA":
				return "🌐";
			case "NS":
				return "🏢";
			case "PTR":
				return "🔄";
			case "SRV":
				return "🎯";
			default:
				return "📋";
		}
	};

	const getTypeColor = (type: string) => {
		switch (type.toUpperCase()) {
			case "A":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "CNAME":
				return "bg-green-100 text-green-800 border-green-200";
			case "MX":
				return "bg-purple-100 text-purple-800 border-purple-200";
			case "TXT":
				return "bg-orange-100 text-orange-800 border-orange-200";
			case "AAAA":
				return "bg-indigo-100 text-indigo-800 border-indigo-200";
			case "NS":
				return "bg-red-100 text-red-800 border-red-200";
			case "PTR":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "SRV":
				return "bg-pink-100 text-pink-800 border-pink-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	return (
		<div className="group relative bg-card rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 border border-border">
			<div className="flex items-start justify-between">
				<div className="flex items-center space-x-3 flex-1">
					<div className="text-2xl">{getTypeIcon(record.type)}</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center space-x-2 mb-2">
							<span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
								{record.name}
							</span>
							<span
								className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(record.type)}`}
							>
								{record.type}
							</span>
							<span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
								TTL: {record.ttl}s
							</span>
						</div>
						<div className="text-sm text-foreground font-mono break-all">
							{record.content}
						</div>
					</div>
				</div>
				<div className="flex items-center space-x-2 ml-4">
					<Button
						variant="outline"
						size="sm"
						className="size-8 p-0"
						title="Edit"
					>
						<EditIcon className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="size-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
						title="Delete"
						onClick={() => deleteMutation.mutate(record.id)}
						disabled={deleteMutation.isPending}
					>
						<Trash2Icon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
