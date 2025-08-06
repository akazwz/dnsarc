import { GlobeIcon, HouseIcon, UserIcon } from "lucide-react";
import { Link, Outlet, redirect, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthStore } from "~/stores/auth";

export async function clientLoader() {
	const token = useAuthStore.getState().accessToken;
	if (!token) {
		return redirect("/auth");
	}
	return null;
}

interface NavItem {
	name: string;
	href: string;
	icon: React.ElementType;
}

const navItems: NavItem[] = [
	{
		name: "Home",
		href: "/dash",
		icon: HouseIcon,
	},
	{
		name: "Zones",
		href: "/dash/zones",
		icon: GlobeIcon,
	},
	{
		name: "Account",
		href: "/dash/account",
		icon: UserIcon,
	},
];

export default function Layout() {
	const location = useLocation();

	// 辅助函数：判断导航项是否应该处于active状态
	const isNavItemActive = (itemHref: string) => {
		// 对于根路径 /dash，只有完全匹配才算active
		if (itemHref === "/dash") {
			return location.pathname === "/dash" || location.pathname === "/dash/";
		}

		// 对于其他路径，使用startsWith来支持嵌套路由
		return location.pathname.startsWith(itemHref);
	};

	return (
		<div className="flex flex-col md:flex-row h-dvh">
			<div className="w-64 h-full flex-col shrink-0 p-2 hidden md:flex border-r border-muted">
				<Button asChild variant="ghost" size="lg" className="h-12">
					<Link to="/dash">
						<img src="/icon-192.png" alt="DNSARC logo" className="size-6" />
						<span className="text-sm font-semibold">DNSARC</span>
					</Link>
				</Button>
				<nav className="flex flex-col gap-2 mt-4">
					{navItems.map((item) => {
						const isActive = isNavItemActive(item.href);
						return (
							<Button
								key={item.name}
								variant={isActive ? "default" : "ghost"}
								size="lg"
								className="justify-start rounded-full h-12"
								asChild
							>
								<Link to={item.href} prefetch="viewport">
									<item.icon className="size-4 mr-2" />
									{item.name}
								</Link>
							</Button>
						);
					})}
				</nav>
			</div>
			<Outlet />
			<div className="shrink-0 p-4 bg-transparent fixed bottom-0 left-0 right-0 md:hidden">
				<div className="flex justify-between w-fit mx-auto gap-4 h-fit p-2 border rounded-full backdrop-blur-xl shadow-lg">
					{navItems.map((item) => {
						const isActive = isNavItemActive(item.href);
						return (
							<Button
								key={item.name}
								variant={isActive ? "default" : "ghost"}
								size="lg"
								className="flex flex-col gap-0.5 rounded-full"
								asChild
							>
								<Link to={item.href} className="text-xs" prefetch="viewport">
									<item.icon className="size-4" />
								</Link>
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
