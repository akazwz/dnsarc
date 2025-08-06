import { LogInIcon, MapPinIcon, ScaleIcon, ZapIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export function meta() {
	return [
		{ title: "DNSARC - Smart DNS Management for Developers" },
		{
			name: "description",
			content:
				"Intelligent DNS solution with geo-routing, smart load balancing, and fast updates. Built for developers who need reliable DNS with modern features.",
		},
		{
			name: "keywords",
			content:
				"DNS, Smart DNS, Geo DNS, Load Balancing, DNS Management, Developer Tools, API",
		},
		{ property: "og:type", content: "website" },
		{ property: "og:url", content: "https://dnsarc.com/" },
		{
			property: "og:title",
			content: "DNSARC - Smart DNS Management for Developers",
		},
		{
			property: "og:description",
			content:
				"Intelligent DNS solution with geo-routing, smart load balancing, and fast updates.",
		},
		{
			name: "twitter:title",
			content: "DNSARC - Smart DNS Management for Developers",
		},
		{
			name: "twitter:description",
			content:
				"Intelligent DNS solution with geo-routing, smart load balancing, and fast updates.",
		},
	];
}

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
			{/* Header */}
			<header className="backdrop-blur-sm bg-white/80 border-b border-gray-200/60 sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3 group">
							<img
								src="/favicon-32.png"
								alt="DNSARC logo"
								className="w-8 h-8 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-200"
							/>
							<span className="text-xl font-semibold text-black tracking-tight">
								DNSARC
							</span>
						</div>
						<nav className="flex items-center space-x-8">
							<Button variant="ghost" asChild>
								<Link to="/auth" prefetch="viewport" viewTransition>
									<LogInIcon />
									Login
								</Link>
							</Button>
						</nav>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<main className="relative overflow-hidden">
				{/* Background decoration */}
				<div className="absolute inset-0 -z-10">
					<div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
					<div
						className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"
						style={{ animationDelay: "2s" }}
					></div>
				</div>

				<div className="max-w-6xl mx-auto px-6 py-32">
					<div className="text-center space-y-12">
						<div className="space-y-8">
							<div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 mb-8">
								<span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
								Private Beta
							</div>
							<h1 className="text-5xl md:text-7xl font-bold text-black leading-tight tracking-tight">
								Smart DNS
								<br />
								<span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
									Management
								</span>
							</h1>
							<p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
								Intelligent DNS solution with geo-routing, smart load balancing,
								and fast updates. Built for developers who need reliable DNS
								with modern features.
							</p>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-gray-200/60">
							<div className="text-center">
								<div className="text-2xl md:text-3xl font-bold text-black">
									&lt;100ms
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Update Propagation
								</div>
							</div>
							<div className="text-center">
								<div className="text-2xl md:text-3xl font-bold text-black">
									API
								</div>
								<div className="text-sm text-gray-600 mt-1">Full Control</div>
							</div>
							<div className="text-center">
								<div className="text-2xl md:text-3xl font-bold text-black">
									24/7
								</div>
								<div className="text-sm text-gray-600 mt-1">Monitoring</div>
							</div>
						</div>
					</div>

					{/* Features Grid */}
					<div className="mt-32 grid md:grid-cols-3 gap-8">
						<Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
							<CardHeader>
								<div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
									<MapPinIcon className="w-6 h-6 text-blue-600" />
								</div>
								<CardTitle className="text-lg">Geo DNS Routing</CardTitle>
								<CardDescription className="text-gray-600">
									Smart geographic routing directs users to the optimal server
									based on their location. Reduce latency and improve user
									experience with intelligent traffic distribution.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
							<CardHeader>
								<div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
									<ScaleIcon className="w-6 h-6 text-green-600" />
								</div>
								<CardTitle className="text-lg">Smart Load Balancing</CardTitle>
								<CardDescription className="text-gray-600">
									Intelligent traffic distribution across available nodes with
									automatic health monitoring and failover. Keep your services
									running smoothly even during maintenance.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
							<CardHeader>
								<div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
									<ZapIcon className="w-6 h-6 text-purple-600" />
								</div>
								<CardTitle className="text-lg">Fast Updates</CardTitle>
								<CardDescription className="text-gray-600">
									DNS changes propagate quickly across all nodes with fast
									update cycles. Monitor your DNS records and track changes with
									live status updates.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="relative bg-gradient-to-br from-gray-50 to-white border-t border-gray-200/60 py-16 mt-32">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>
				<div className="max-w-6xl mx-auto px-6 text-center relative">
					<div className="space-y-4">
						<div className="flex items-center justify-center space-x-3 mb-8">
							<img
								src="/icon-192.png"
								alt="DNSARC logo"
								className="w-8 h-8 rounded-lg shadow-sm"
							/>
							<span className="text-xl font-semibold text-black tracking-tight">
								DNSARC
							</span>
						</div>
						<p className="text-gray-500 text-sm">
							2025 DNSARC. All rights reserved | Smart DNS for Developers
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
