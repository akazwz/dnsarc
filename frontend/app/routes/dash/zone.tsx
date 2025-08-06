import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	DatabaseIcon,
	EditIcon,
	LoaderIcon,
	PlusIcon,
	Trash2Icon,
	TriangleAlertIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { z } from "zod";
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
import {
	Dialog,
	DialogClose,
	DialogContent,
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
import { dnsRecordClient } from "~/connect";
import type { Route } from "./+types/zone";

const schema = z.object({
	name: z
		.string()
		.min(1, { message: "Name is required" })
		.max(255, { message: "Name must be at most 255 characters" }),
	type: z.string().min(1, { message: "Type is required" }),
	content: z
		.string()
		.min(2, { message: "Content is required" })
		.max(255, { message: "Content must be at most 255 characters" }),
	ttl: z
		.number()
		.min(300, { message: "TTL must be at least 300" })
		.max(86400, { message: "TTL must be at most 86400" }),
});

const editSchema = z.object({
	id: z.string(),
	content: z
		.string()
		.min(2, { message: "Content is required" })
		.max(255, { message: "Content must be at most 255 characters" }),
	ttl: z
		.number()
		.min(300, { message: "TTL must be at least 300" })
		.max(86400, { message: "TTL must be at most 86400" }),
});

export default function Zone({ params }: Route.ComponentProps) {
	const queryClient = useQueryClient();
	const dialogCloseRef = useRef<HTMLButtonElement>(null);
	const editDialogCloseRef = useRef<HTMLButtonElement>(null);
	const [editingRecord, setEditingRecord] = useState<any>(null);

	const zoneName = params.name;

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			type: "A",
			content: "",
			ttl: 300,
		},
	});

	const editForm = useForm<z.infer<typeof editSchema>>({
		resolver: zodResolver(editSchema),
		defaultValues: {
			id: "",
			content: "",
			ttl: 300,
		},
	});

	function onSubmit(values: z.infer<typeof schema>) {
		createMutation.mutate(values);
	}

	function onEditSubmit(values: z.infer<typeof editSchema>) {
		editMutation.mutate(values);
	}

	const createMutation = useMutation({
		mutationFn: async (values: z.infer<typeof schema>) => {
			console.log("create mutation", values);
			const resp = await dnsRecordClient.createDNSRecord({
				zoneName: zoneName,
				name: values.name,
				type: values.type,
				content: values.content,
				ttl: values.ttl,
			});
			return resp.record;
		},
		onSuccess: () => {
			form.reset();
			if (dialogCloseRef.current) {
				dialogCloseRef.current.click();
			}
			queryClient.invalidateQueries({
				queryKey: ["dns_records", zoneName],
			});
		},
	});

	const editMutation = useMutation({
		mutationFn: async (values: z.infer<typeof editSchema>) => {
			console.log("edit mutation", values);
			const resp = await dnsRecordClient.updateDNSRecord({
				id: values.id,
				content: values.content,
				ttl: values.ttl,
			});
			return resp.record;
		},
		onSuccess: () => {
			editForm.reset();
			setEditingRecord(null);
			if (editDialogCloseRef.current) {
				editDialogCloseRef.current.click();
			}
			queryClient.invalidateQueries({
				queryKey: ["dns_records", zoneName],
			});
		},
	});

	const {
		data: records,
		isLoading,
		isLoadingError,
	} = useQuery({
		queryKey: ["dns_records", zoneName],
		queryFn: async () => {
			const response = await dnsRecordClient.listDNSRecordsByZoneName({
				zoneName: zoneName,
			});
			return response.records;
		},
	});

	const _deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await dnsRecordClient.deleteDNSRecord({
				id: id,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["dns_records", zoneName],
			});
		},
	});

	return (
		<div className="flex flex-1 flex-col h-full">
			<div className="flex border-b border-muted h-12 p-3 gap-3 items-center">
				<Button asChild variant="ghost">
					<Link to="/dash/zones">
						<ArrowLeftIcon className="size-4" />
					</Link>
				</Button>
				<h1 className="text-md font-bold">{params.name}</h1>
				<div className="flex-1" />
				<Dialog onOpenChange={() => form.reset()}>
					<DialogTrigger asChild>
						<Button size="icon">
							<PlusIcon />
						</Button>
					</DialogTrigger>
					<DialogContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)}>
								<DialogHeader>
									<DialogTitle className="flex items-center">
										<DatabaseIcon />
									</DialogTitle>
								</DialogHeader>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="my-4">
											<FormLabel>Record Name</FormLabel>
											<FormControl>
												<div className="flex items-center">
													<Input
														{...field}
														placeholder="Root name is @"
														className="rounded-r-none h-10"
													/>
													<span className="p-1 border bg-muted h-10 flex items-center">
														.{params.name}
													</span>
												</div>
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
													<SelectItem value="CNAME">CNAME Record</SelectItem>
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
												<Input {...field} placeholder="Enter record value" />
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
													value={field.value}
													onChange={(e) =>
														field.onChange(Number(e.target.value))
													}
													onBlur={field.onBlur}
													name={field.name}
													placeholder="300"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<DialogFooter>
									<DialogClose asChild ref={dialogCloseRef}>
										<Button type="button" variant="outline">
											Cancel
										</Button>
									</DialogClose>
									<Button type="submit" disabled={createMutation.isPending}>
										Submit
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
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
			<div className="p-4">
				{records && records.length > 0 ? (
					<div className="space-y-3">
						{records.map((record) => (
							<div key={record.id} className="rounded-xl p-4 border shadow-md">
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 flex flex-col gap-2">
										<div className="flex items-center gap-4">
											<Badge variant="default">{record.type}</Badge>
											<Badge variant="outline">{record.ttl}</Badge>
										</div>
										<div className="space-y-1">
											<div>
												<span className="text-xs text-muted-foreground block">
													Name
												</span>
												<span className="text-sm font-normal">
													{record.name}
												</span>
											</div>
											<div>
												<span className="text-xs text-muted-foreground block">
													Content
												</span>
												<span
													className="text-sm font-normal"
													title={record.content}
												>
													{record.content}
												</span>
											</div>
										</div>
									</div>
									<div className="flex-shrink-0 flex flex-col">
										<Dialog
											onOpenChange={(open) => {
												if (open) {
													setEditingRecord(record);
													editForm.reset({
														id: record.id,
														content: record.content,
														ttl: record.ttl,
													});
												} else {
													setEditingRecord(null);
													editForm.reset();
												}
											}}
										>
											<DialogTrigger asChild>
												<Button variant="ghost" size="icon">
													<EditIcon />
												</Button>
											</DialogTrigger>
											<DialogContent>
												<Form {...editForm}>
													<form onSubmit={editForm.handleSubmit(onEditSubmit)}>
														<DialogHeader>
															<DialogTitle className="flex items-center gap-2">
																<EditIcon className="size-5" />
																Edit DNS Record
															</DialogTitle>
														</DialogHeader>
														{/* Read-only fields */}
														<div className="space-y-4 mb-4">
															<div>
																<label className="text-sm font-medium text-muted-foreground">
																	Name
																</label>
																<div className="text-sm font-normal bg-muted p-2 rounded border">
																	{editingRecord?.name}
																</div>
															</div>
															<div>
																<label className="text-sm font-medium text-muted-foreground">
																	Type
																</label>
																<div className="text-sm font-normal bg-muted p-2 rounded border">
																	<Badge variant="default">
																		{editingRecord?.type}
																	</Badge>
																</div>
															</div>
														</div>
														<FormField
															control={editForm.control}
															name="content"
															render={({ field }) => (
																<FormItem className="my-4">
																	<FormLabel>Value</FormLabel>
																	<FormControl>
																		<Input
																			{...field}
																			placeholder="Enter record value"
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={editForm.control}
															name="ttl"
															render={({ field }) => (
																<FormItem className="my-4">
																	<FormLabel>TTL (Time To Live)</FormLabel>
																	<FormControl>
																		<Input
																			value={field.value}
																			onChange={(e) =>
																				field.onChange(Number(e.target.value))
																			}
																			onBlur={field.onBlur}
																			name={field.name}
																			placeholder="300"
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<DialogFooter>
															<DialogClose asChild ref={editDialogCloseRef}>
																<Button type="button" variant="outline">
																	Cancel
																</Button>
															</DialogClose>
															<Button
																type="submit"
																disabled={editMutation.isPending}
															>
																{editMutation.isPending
																	? "Updating..."
																	: "Update"}
															</Button>
														</DialogFooter>
													</form>
												</Form>
											</DialogContent>
										</Dialog>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="ghost" size="icon">
													<Trash2Icon />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Are you absolutely sure?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This action cannot be undone. This will permanently
														delete this record: {record.name}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														disabled={_deleteMutation.isPending}
														onClick={(_e) => {
															_deleteMutation.mutate(record.id);
														}}
													>
														Confirm
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8">
						<p className="text-gray-500">No records found</p>
					</div>
				)}
			</div>
		</div>
	);
}
