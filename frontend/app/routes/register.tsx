import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
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

export default function Register() {
	const [showPassword, setShowPassword] = useState(false);
	
	const navigate = useNavigate();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const mutation = useMutation({
		mutationFn: async (values: z.infer<typeof schema>) => {
			const response = await authClient.register({
				email: values.email,
				password: values.password,
			});
			if (!response.user) {
				throw new Error("Failed to register");
			}
			return {
				user: response.user,
				accessToken: response.accessToken,
			};
		},
		onSuccess(data, _variables, _context) {
			useAuthStore.getState().signIn(data.user, data.accessToken);
			toast.success("Registered successfully", {
				richColors: true,
				position: "top-center",
			});
			navigate("/dash");
		},
		onError(error, _variables, _context) {
			console.error(error);
			toast.error("Failed to register", {
				richColors: true,
				position: "top-center",
			});
		},
	});

	function onSubmit(values: z.infer<typeof schema>) {
		mutation.mutate(values);
	}

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
						<div className="flex items-center space-x-4">
							<Button variant="ghost" asChild>
								<Link to="/login">
									Sign In
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link to="/">
									Home
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="relative flex items-center justify-center min-h-[calc(100vh-80px)] p-6 overflow-hidden">
				{/* Background decoration */}
				<div className="absolute inset-0 -z-10">
					<div className="absolute top-1/4 right-1/4 w-72 h-72 bg-green-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
					<div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{animationDelay: "2s"}}></div>
				</div>
				
				<div className="w-full max-w-md relative">
					{/* Status badge */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center px-3 py-1 bg-muted/50 backdrop-blur-sm rounded-full text-xs font-medium text-muted-foreground mb-4">
							<span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
							Private Beta
						</div>
					</div>
					
					<div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border/50">
						<div className="text-center mb-8">
							<h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
							<p className="text-muted-foreground">
								Enter your email and password to get started with DNSARC
							</p>
						</div>
						
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
									<div className="relative">
										<Input {...field} type={showPassword ? "text" : "password"} />
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() => setShowPassword((prev) => !prev)}
										>
											{showPassword ? (
												<EyeOffIcon className="size-4 text-muted-foreground" />
											) : (
												<EyeIcon className="size-4 text-muted-foreground" />
											)}
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="w-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
						disabled={mutation.isPending}
					>
						{mutation.isPending ? "Creating account..." : "Create Account"}
					</Button>
					<div className="text-center pt-4 border-t border-border">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link to="/login" className="text-primary hover:underline font-medium">
								Sign in
							</Link>
						</p>
					</div>
							</form>
						</Form>
					</div>
				</div>
			</main>
		</div>
	);
}
