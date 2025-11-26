"use client";

import * as React from "react";
import { toast } from "sonner";

interface UseRealTimeSyncProps<TData> {
	data: TData[];
	onDataChange: (data: TData[]) => void;
	syncEndpoint?: string;
	syncInterval?: number;
	enableOptimisticUpdates?: boolean;
}

interface SyncEvent<TData> {
	type: "update" | "insert" | "delete";
	data: TData;
	id: string;
	timestamp: number;
	userId?: string;
}

export function useRealTimeSync<TData extends { id: string }>({
	data,
	onDataChange,
	syncEndpoint,
	syncInterval = 5000,
	enableOptimisticUpdates = true,
}: UseRealTimeSyncProps<TData>) {
	const [isOnline, setIsOnline] = React.useState(true);
	const [lastSync, setLastSync] = React.useState<Date | null>(null);
	const [pendingChanges, setPendingChanges] = React.useState<
		SyncEvent<TData>[]
	>([]);
	const [conflictCount, setConflictCount] = React.useState(0);

	// Simulate WebSocket connection for real-time updates
	const [socket, setSocket] = React.useState<WebSocket | null>(null);

	// Mock online/offline detection
	React.useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			toast.success("Connection restored - syncing data...");
			syncPendingChanges();
		};

		const handleOffline = () => {
			setIsOnline(false);
			toast.warning(
				"Working offline - changes will sync when connection is restored",
			);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Simulate WebSocket connection
	React.useEffect(() => {
		if (!syncEndpoint || !isOnline) return;

		// Mock WebSocket for demo purposes
		const mockSocket = {
			send: (data: string) => {
				console.log("Sending to server:", data);
			},
			close: () => {
				console.log("Socket closed");
			},
		} as WebSocket;

		setSocket(mockSocket);

		// Simulate receiving real-time updates
		const interval = setInterval(() => {
			if (Math.random() > 0.95) {
				// 5% chance of receiving an update
				simulateIncomingUpdate();
			}
		}, 2000);

		return () => {
			clearInterval(interval);
			mockSocket.close();
		};
	}, [syncEndpoint, isOnline]);

	// Sync pending changes when coming back online
	const syncPendingChanges = async () => {
		if (pendingChanges.length === 0) return;

		try {
			// Simulate API call to sync pending changes
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setPendingChanges([]);
			setLastSync(new Date());
			toast.success(`Synced ${pendingChanges.length} pending changes`);
		} catch (error) {
			toast.error("Failed to sync pending changes");
		}
	};

	// Simulate incoming real-time update
	const simulateIncomingUpdate = () => {
		if (!Array.isArray(data) || data.length === 0) return;

		const randomItem = data[Math.floor(Math.random() * data.length)] as TData;
		const updatedItem = { ...randomItem };

		// Simulate different types of updates based on data structure
		if ("quantity" in updatedItem) {
			(updatedItem as any).quantity = Math.floor(Math.random() * 100) + 1;
		}
		if ("status" in updatedItem) {
			const statuses = ["pending", "completed", "cancelled"];
			(updatedItem as any).status =
				statuses[Math.floor(Math.random() * statuses.length)];
		}

		const newData = data.map((item) =>
			item.id === updatedItem.id ? updatedItem : item,
		);
		onDataChange(newData);

		toast.info(`Real-time update: ${randomItem.id} modified`, {
			duration: 2000,
		});
	};

	// Queue a change for sync
	const queueChange = (type: SyncEvent<TData>["type"], item: TData) => {
		const change: SyncEvent<TData> = {
			type,
			data: item,
			id: item.id,
			timestamp: Date.now(),
			userId: "current-user", // TODO: get from auth
		};

		if (isOnline && enableOptimisticUpdates) {
			// Send immediately if online
			socket?.send(JSON.stringify(change));
			setLastSync(new Date());
		} else {
			// Queue for later if offline
			setPendingChanges((prev) => [...prev, change]);
		}
	};

	// Handle optimistic updates
	const updateItem = (updatedItem: TData) => {
		const newData = data.map((item) =>
			item.id === updatedItem.id ? updatedItem : item,
		);
		onDataChange(newData);
		queueChange("update", updatedItem);
	};

	const deleteItem = (itemId: string) => {
		const itemToDelete = data.find((item) => item.id === itemId);
		if (!itemToDelete) return;

		const newData = data.filter((item) => item.id !== itemId);
		onDataChange(newData);
		queueChange("delete", itemToDelete);
	};

	const insertItem = (newItem: TData) => {
		const newData = [...data, newItem];
		onDataChange(newData);
		queueChange("insert", newItem);
	};

	// Bulk operations with real-time sync
	const bulkUpdate = (items: TData[]) => {
		items.forEach((item) => {
			queueChange("update", item);
		});
		if (isOnline) {
			toast.success(`Bulk update synced for ${items.length} items`);
		} else {
			toast.info(`Bulk update queued for ${items.length} items`);
		}
	};

	const bulkDelete = (itemIds: string[]) => {
		const itemsToDelete = data.filter((item) => itemIds.includes(item.id));
		const newData = data.filter((item) => !itemIds.includes(item.id));
		onDataChange(newData);

		itemsToDelete.forEach((item) => {
			queueChange("delete", item);
		});

		if (isOnline) {
			toast.success(`Bulk delete synced for ${itemIds.length} items`);
		} else {
			toast.info(`Bulk delete queued for ${itemIds.length} items`);
		}
	};

	return {
		isOnline,
		lastSync,
		pendingChanges: pendingChanges.length,
		conflictCount,
		updateItem,
		deleteItem,
		insertItem,
		bulkUpdate,
		bulkDelete,
		syncPendingChanges,
	};
}
