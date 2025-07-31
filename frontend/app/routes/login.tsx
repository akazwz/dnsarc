import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, redirect, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authClient } from "~/connect";
import { useAuthStore } from "~/stores/auth";

const schema = z.object({
	email: z.email(),
	password: z.string().min(6),
});

export async function clientLoader() {
	const accessToken = useAuthStore.getState().accessToken;
	if (accessToken) {
		return redirect("/dash");
	}
	return null;
}

export default function Login() {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: async (values: z.infer<typeof schema>) => {
			const response = await authClient.login({
				email: values.email,
				password: values.password,
			});
			if (!response.user) {
				throw new Error("Failed to login");
			}
			return {
				user: response.user,
				accessToken: response.accessToken,
			};
		},
		onSuccess(data, _variables, _context) {
			useAuthStore.getState().signIn(data.user, data.accessToken);
			toast.success("Logged in successfully", {
				richColors: true,
				position: "top-center",
			});
			navigate("/");
		},
		onError(error, _variables, _context) {
			console.error(error);
			toast.error("Invalid email or password", {
				richColors: true,
				position: "top-center",
			});
		},
	});

	function onSubmit(values: z.infer<typeof schema>) {
		mutation.mutate(values);
	}

	return (
		<div className="p-2 flex flex-col h-dvh justify-center">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="max-w-sm mx-auto w-full space-y-4"
				>
					<div className="flex flex-col gap-2 justify-center items-center mb-4">
						<h1 className="text-xl font-bold">Welcome back</h1>
						<span className="text-sm text-muted-foreground">
							Enter your email and password to login
						</span>
					</div>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="w-full"
						disabled={mutation.isPending}
					>
						{mutation.isPending ? "Logging in..." : "Login"}
					</Button>
					<div className="flex justify-center items-center gap-2">
						<span className="text-sm text-muted-foreground">
							Don't have an account?
						</span>
						<Link to="/register" className="text-sm text-primary underline">
							Register
						</Link>
					</div>
				</form>
			</Form>
		</div>
	);
}
