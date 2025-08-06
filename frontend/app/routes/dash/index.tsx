import { AlertCircleIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export default function Dash() {
	const _handleCopy = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			toast.success("Copied to clipboard", {
				position: "top-center",
			});
		});
	};

	return (
		<div className="flex flex-1 flex-col h-full">
			<div className="flex border-b border-muted h-12 p-3 items-center">
				<h1 className="text-md font-bold">Home</h1>
			</div>
			<div className="p-4 flex flex-col gap-4">
				<Alert>
					<AlertCircleIcon />
					<AlertTitle>
						Make sure your domain nameserver is set to our nameservers
					</AlertTitle>
					<AlertDescription>
						The zone will not be active until your domain nameserver is set to
						our nameservers.
					</AlertDescription>
				</Alert>
				<div className="flex flex-col gap-2">
					<div className="p-4 border rounded-2xl text-sm font-semibold flex items-center justify-between">
						<span>ns1.dnsarc.com</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => _handleCopy("ns1.dnsarc.com")}
						>
							<CopyIcon />
						</Button>
					</div>
					<div className="p-4 border rounded-2xl text-sm font-semibold flex items-center justify-between">
						ns2.dnsarc.com
						<Button
							variant="ghost"
							size="icon"
							onClick={() => _handleCopy("ns2.dnsarc.com")}
						>
							<CopyIcon />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
