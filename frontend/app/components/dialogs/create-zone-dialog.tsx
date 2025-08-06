import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { GlobeIcon, PlusIcon } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { zoneClient } from "~/connect";

const schema = z.object({
	zoneName: z
		.string()
		.min(1, { message: "Zone name is required." })
		.max(255)
		.refine(
			(value) =>
				/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
					value,
				),
			{
				message: "Invalid domain name format.",
			},
		),
});

export function CreateZoneDialog() {
	const closeRef = useRef<HTMLButtonElement>(null);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			zoneName: "",
		},
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
		onSuccess(_data, _variables, _context) {
			form.reset();
			closeRef.current?.click();
		},
	});
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button size="icon">
					<PlusIcon />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader>
							<GlobeIcon />
						</DialogHeader>
						<FormField
							control={form.control}
							name="zoneName"
							render={({ field }) => (
								<FormItem className="my-4">
									<FormControl>
										<Input {...field} placeholder="example.com" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<DialogClose ref={closeRef} asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DialogClose>
							<Button
								type="submit"
								disabled={mutation.isPending}
								className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
							>
								Submit
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
