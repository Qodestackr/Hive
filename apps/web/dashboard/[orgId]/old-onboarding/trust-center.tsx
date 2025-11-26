import { Card, CardContent } from "@repo/ui/components/card";
import { Building2, DatabaseZap, Lock, ShieldCheck } from "lucide-react";

export default function TrustMini() {
	const items = [
		{
			icon: <ShieldCheck className="h-5 w-5 text-green-600" />,
			title: "Enterprise Security",
			desc: "Data is encrypted, backed up, and protected 24/7.",
		},
		{
			icon: <Building2 className="h-5 w-5 text-blue-600" />,
			title: "Brand Ownership",
			desc: "Only verified businesses can list, price & fulfill.",
		},
		{
			icon: <Lock className="h-5 w-5 text-yellow-600" />,
			title: "Role-based Access",
			desc: "Every action is logged & scoped to business units.",
		},
		{
			icon: <DatabaseZap className="h-5 w-5 text-purple-600" />,
			title: "Audit Ready",
			desc: "Sales, tax & inventory data is structured for export.",
		},
	];

	return (
		<Card className="border-none shadow-sm p-1.5 bg-white">
			<CardContent className="grid grid-cols-2 gap-2">
				{items.map((item, i) => (
					<div key={i} className="flex items-start space-x-2">
						{item.icon}
						<div className="text-xs">
							<div className="font-medium">{item.title}</div>
							<div className="text-muted-foreground">{item.desc}</div>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
