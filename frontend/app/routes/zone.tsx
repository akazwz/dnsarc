import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DNSRecord } from "gen/dns_record/v1/dns_record_pb";
import { DatabaseIcon, GlobeIcon, Loader2Icon, PlusIcon } from "lucide-react";
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
import type { Route } from "./+types/zone";

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
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="max-w-6xl mx-auto p-6">
				{/* Header Section */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="bg-blue-100 p-3 rounded-lg">
								<GlobeIcon className="size-8 text-blue-600" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									DNS Records
								</h1>
								<p className="text-gray-600 flex items-center">
									<DatabaseIcon className="size-4 mr-1" />
									Managing records for {zone?.zoneName}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								className="flex items-center space-x-2"
								onClick={() => navigate("/dash")}
							>
								<GlobeIcon className="size-4" />
								<span>Back to Zones</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total Records
								</p>
								<p className="text-3xl font-bold text-gray-900">
									{isLoading ? "..." : data?.length || 0}
								</p>
							</div>
							<div className="bg-blue-100 p-3 rounded-lg">
								<DatabaseIcon className="size-6 text-blue-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">A Records</p>
								<p className="text-3xl font-bold text-green-600">
									{isLoading
										? "..."
										: data?.filter((r) => r.type === "A").length || 0}
								</p>
							</div>
							<div className="bg-green-100 p-3 rounded-lg">
								<div className="size-6 bg-green-500 rounded"></div>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									CNAME Records
								</p>
								<p className="text-3xl font-bold text-purple-600">
									{isLoading
										? "..."
										: data?.filter((r) => r.type === "CNAME").length || 0}
								</p>
							</div>
							<div className="bg-purple-100 p-3 rounded-lg">
								<div className="size-6 bg-purple-500 rounded"></div>
							</div>
						</div>
					</div>
				</div>

				{/* Records Section */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-xl font-semibold text-gray-900 flex items-center">
								<DatabaseIcon className="size-5 mr-2 text-blue-600" />
								DNS Records
							</h2>
							<p className="text-gray-600">
								Manage your DNS records for {zone?.zoneName}
							</p>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
									<PlusIcon className="size-4" />
									<span>Create Record</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)}>
										<DialogHeader>
											<DialogTitle className="flex items-center">
												<DatabaseIcon className="size-5 mr-2 text-blue-600" />
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
												className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
							<Loader2Icon className="size-6 animate-spin text-blue-600" />
							<span className="ml-3 text-gray-600">Loading records...</span>
						</div>
					) : data?.length === 0 ? (
						<div className="text-center py-12">
							<div className="bg-gray-100 rounded-full size-20 flex items-center justify-center mx-auto mb-4">
								<DatabaseIcon className="size-10 text-gray-400" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No DNS records found
							</h3>
							<p className="text-gray-500 mb-6">
								Get started by creating your first DNS record for {zone?.zoneName}.
							</p>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
										<PlusIcon className="size-4" />
										<span>Create Your First Record</span>
									</Button>
								</DialogTrigger>
								<DialogContent>
									<Form {...form}>
										<form onSubmit={form.handleSubmit(onSubmit)}>
											<DialogHeader>
												<DialogTitle className="flex items-center">
													<DatabaseIcon className="size-5 mr-2 text-blue-600" />
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
													className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
		<div className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 hover:border-blue-300 hover:bg-blue-50/50">
			<div className="flex items-start justify-between">
				<div className="flex items-center space-x-3 flex-1">
					<div className="text-2xl">{getTypeIcon(record.type)}</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center space-x-2 mb-2">
							<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
								{record.name}
							</span>
							<span
								className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(record.type)}`}
							>
								{record.type}
							</span>
							<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
								TTL: {record.ttl}s
							</span>
						</div>
						<div className="text-sm text-gray-900 font-mono break-all">
							{record.content}
						</div>
					</div>
				</div>
				<div className="flex items-center space-x-2 ml-4">
					<Button
						variant="outline"
						size="sm"
						className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
						title="Edit"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
						title="Delete"
						onClick={() => deleteMutation.mutate(record.id)}
						disabled={deleteMutation.isPending}
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</Button>
				</div>
			</div>

			{/* Hover indicator */}
			<div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
		</div>
	);
}
