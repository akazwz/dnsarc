import { Link } from "react-router";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			{/* Header */}
			<header className="relative z-10 px-6 py-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm">D</span>
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							DNSARC
						</span>
					</div>
					<nav className="flex items-center space-x-4">
						<Link
							to="/login"
							className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
						>
							Sign In
						</Link>
						<Link
							to="/register"
							className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
						>
							Get Started
						</Link>
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<main className="relative">
				<div className="max-w-7xl mx-auto px-6 py-20 text-center">
					<div className="space-y-8">
						<div className="space-y-4">
							<h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
								DNS Management
								<br />
								<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									Made Simple
								</span>
							</h1>
							<p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
								Powerful, intuitive DNS record management that scales with your
								needs. Manage domains, configure records, and monitor
								performance all in one place.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<Link
								to="/register"
								className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
							>
								<span>Get Started</span>
								<ArrowRightIcon className="w-5 h-5" />
							</Link>
							<Link
								to="/login"
								className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
							>
								Sign In
							</Link>
						</div>
					</div>

					{/* Features Grid */}
					<div className="mt-24 grid md:grid-cols-3 gap-8">
						<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
								<GlobeIcon className="w-6 h-6 text-blue-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Global DNS Network
							</h3>
							<p className="text-gray-600">
								Lightning-fast DNS resolution with our worldwide network of
								servers.
							</p>
						</div>

						<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
							<div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
								<ShieldIcon className="w-6 h-6 text-purple-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Enterprise Security
							</h3>
							<p className="text-gray-600">
								Advanced security features to protect your domains and DNS
								records.
							</p>
						</div>

						<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
							<div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
								<ZapIcon className="w-6 h-6 text-green-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Real-time Updates
							</h3>
							<p className="text-gray-600">
								Instant DNS propagation and real-time monitoring of your
								records.
							</p>
						</div>
					</div>
				</div>

				{/* Background decoration */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
				</div>
			</main>

			{/* Footer */}
			<footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 py-8">
				<div className="max-w-7xl mx-auto px-6 text-center">
					<p className="text-gray-600">© 2025 DNSARC. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5 12h14" />
			<path d="m12 5 7 7-7 7" />
		</svg>
	);
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
			<path d="M2 12h20" />
		</svg>
	);
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M20 13c0 5-3.5 7.5-8 7.5s-8-2.5-8-7.5c0-5 3.5-7.5 8-7.5s8 2.5 8 7.5" />
			<path d="M12 1L8 5v6a4 4 0 0 0 8 0V5l-4-4" />
		</svg>
	);
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
		</svg>
	);
}
