"use client";

import { CheckCircle2, Clock, Loader2, WifiOff } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../badge";
import { Button } from "../button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../tooltip";

interface SyncStatusIndicatorProps {
	isOnline: boolean;
	lastSync: Date | null;
	pendingChanges: number;
	onSync?: () => void;
	className?: string;
}

export function SyncStatusIndicator({
	isOnline,
	lastSync,
	pendingChanges,
	onSync,
	className,
}: SyncStatusIndicatorProps) {
	const [isLoading, setIsLoading] = React.useState(false);

	const handleSync = async () => {
		if (!onSync) return;
		setIsLoading(true);
		await onSync();
		setIsLoading(false);
	};

	const getStatusIcon = () => {
		if (isLoading) return <Loader2 className="h-3 w-3 animate-spin" />;
		if (!isOnline) return <WifiOff className="h-3 w-3" />;
		if (pendingChanges > 0) return <Clock className="h-3 w-3" />;
		return <CheckCircle2 className="h-3 w-3" />;
	};

	const getStatusText = () => {
		if (isLoading) return "Syncing...";
		if (!isOnline) return "Offline";
		if (pendingChanges > 0) return `${pendingChanges} pending`;
		return "Synced";
	};

	const getStatusVariant = () => {
		if (isLoading) return "secondary";
		if (!isOnline) return "destructive";
		if (pendingChanges > 0) return "outline";
		return "default";
	};

	const getTooltipContent = () => {
		if (!isOnline) {
			return "You're working offline. Changes will sync when connection is restored.";
		}
		if (pendingChanges > 0) {
			return `${pendingChanges} changes waiting to sync. Click to sync now.`;
		}
		if (lastSync) {
			return `Last synced: ${lastSync.toLocaleTimeString()}`;
		}
		return "All changes are synced";
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						onClick={pendingChanges > 0 ? handleSync : undefined}
						disabled={isLoading || !isOnline}
						className={cn("h-8 px-2", className)}
					>
						<Badge variant={getStatusVariant()} className="gap-1">
							{getStatusIcon()}
							{getStatusText()}
						</Badge>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{getTooltipContent()}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
