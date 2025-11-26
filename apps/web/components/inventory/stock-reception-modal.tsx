"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowRight,
	Calculator,
	CheckCircle2,
	PackagePlus,
	ScanBarcode,
	TrendingUp,
	Truck,
} from "lucide-react";
import { useState } from "react";

// Simulated product data - in real app this comes from your DB
const PRODUCT_DB = [
	{
		id: "1",
		name: "Four Cousins Sweet Red",
		currentCost: 7800,
		stock: 45,
		image: "/wine-still-life.png",
	},
	{
		id: "2",
		name: "Jameson Irish Whiskey",
		currentCost: 2300,
		stock: 12,
		image: "/amber-whiskey-glass.png",
	},
];

/**
**Handling "Eventual Consistency":**
- I added a simple checkbox: **"Add transport/shipping costs later?"**
- If checked, it saves the stock (so they can sell it) but flags the cost as "Provisional."
- This solves the "Landed Cost" problem without blocking operations. 
They can sell the stock now, and when the transporter bill arrives, 
the system will prompt them to update the cost (recalculating the margin retroactively).

AHA!
--------
When they enter a price, it immediately checks against the previous cost.
If the price went up (like the Four Cousins example), it triggers a specific insight: *"Price Hike Detected. Your existing stock was bought cheaper. We'll track this so you know exactly which ones make you more profit!"*
This answers the "Why am I doing this?" question instantly. It's not data entry; it's profit protection.
*/

export function StockReceptionModal() {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState(1);
	const [selectedProduct, setSelectedProduct] = useState<
		(typeof PRODUCT_DB)[0] | null
	>(null);
	const [quantity, setQuantity] = useState("");
	const [newCost, setNewCost] = useState("");
	const [landedCostLater, setLandedCostLater] = useState(false);

	// Calculated insights
	const oldCost = selectedProduct?.currentCost || 0;
	const enteredCost = Number.parseInt(newCost, 10) || 0;
	const priceDiff = enteredCost - oldCost;
	const isPriceHigher = priceDiff > 0;

	const handleNext = () => setStep(step + 1);
	const reset = () => {
		setStep(1);
		setSelectedProduct(null);
		setQuantity("");
		setNewCost("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="lg"
					className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/20 text-white rounded-xl h-12 px-6"
				>
					<PackagePlus className="w-5 h-5 mr-2" />
					Record Incoming Stock
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-zinc-100 gap-0">
				{/* Header with Progress */}
				<div className="p-6 bg-zinc-900/50 border-b border-zinc-800">
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-xl font-semibold tracking-tight">
							New Stock Arrival
						</h2>
						<Badge
							variant="outline"
							className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
						>
							Step {step} of 3
						</Badge>
					</div>
					<div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
						<motion.div
							className="h-full bg-indigo-500"
							initial={{ width: "33%" }}
							animate={{ width: `${(step / 3) * 100}%` }}
						/>
					</div>
				</div>

				<div className="p-6">
					<AnimatePresence mode="wait">
						{/* STEP 1: SELECT PRODUCT */}
						{step === 1 && (
							<motion.div
								key="step1"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="space-y-6"
							>
								<div className="space-y-4">
									<Label className="text-zinc-400">What just arrived?</Label>
									<div className="relative">
										<ScanBarcode className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
										<Input
											placeholder="Scan barcode or type 'Four Cousins'..."
											className="pl-10 bg-zinc-900 border-zinc-800 focus:border-indigo-500 h-12 text-lg"
										/>
									</div>

									<div className="space-y-2 mt-4">
										<p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
											Recent Suggestions
										</p>
										{PRODUCT_DB.map((product) => (
											<div
												key={product.id}
												onClick={() => setSelectedProduct(product)}
												className={cn(
													"flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all",
													selectedProduct?.id === product.id
														? "bg-indigo-900/20 border-indigo-500/50"
														: "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700",
												)}
											>
												<div className="h-10 w-10 rounded-lg bg-zinc-800 overflow-hidden">
													<img
														src={product.image || "/placeholder.svg"}
														alt={product.name}
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="flex-1">
													<h4 className="font-medium text-zinc-200">
														{product.name}
													</h4>
													<p className="text-xs text-zinc-500">
														Current Stock: {product.stock} units
													</p>
												</div>
												{selectedProduct?.id === product.id && (
													<CheckCircle2 className="w-5 h-5 text-indigo-500" />
												)}
											</div>
										))}
									</div>
								</div>

								<Button
									className="w-full h-12 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
									disabled={!selectedProduct}
									onClick={handleNext}
								>
									Next Step <ArrowRight className="w-4 h-4 ml-2" />
								</Button>
							</motion.div>
						)}

						{/* STEP 2: QUANTITY & COST */}
						{step === 2 && selectedProduct && (
							<motion.div
								key="step2"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="space-y-6"
							>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label className="text-zinc-400">Quantity Received</Label>
										<Input
											type="number"
											value={quantity}
											onChange={(e) => setQuantity(e.target.value)}
											placeholder="0"
											className="bg-zinc-900 border-zinc-800 h-12 text-lg font-mono"
											autoFocus
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-zinc-400">
											Buying Price (Total)
										</Label>
										<div className="relative">
											<span className="absolute left-3 top-3 text-zinc-500 font-mono">
												KES
											</span>
											<Input
												type="number"
												value={newCost}
												onChange={(e) => setNewCost(e.target.value)}
												placeholder="0"
												className="pl-12 bg-zinc-900 border-zinc-800 h-12 text-lg font-mono"
											/>
										</div>
									</div>
								</div>

								{/* THE INSIGHT ENGINE - EDUCATIONAL MOMENT */}
								{enteredCost > 0 && quantity && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
									>
										<div className="flex items-start gap-3">
											<div
												className={cn(
													"p-2 rounded-lg mt-1",
													isPriceHigher
														? "bg-amber-500/10 text-amber-500"
														: "bg-emerald-500/10 text-emerald-500",
												)}
											>
												{isPriceHigher ? (
													<TrendingUp className="w-4 h-4" />
												) : (
													<Calculator className="w-4 h-4" />
												)}
											</div>
											<div>
												<h4 className="text-sm font-medium text-zinc-200">
													{isPriceHigher
														? "Price Hike Detected"
														: "Cost Analysis"}
												</h4>
												<p className="text-sm text-zinc-400 mt-1">
													Previous unit cost was{" "}
													<span className="text-zinc-300 font-mono">
														KES {oldCost.toLocaleString()}
													</span>
													. This batch costs{" "}
													<span
														className={cn(
															"font-mono font-bold",
															isPriceHigher
																? "text-amber-500"
																: "text-zinc-300",
														)}
													>
														KES{" "}
														{(
															enteredCost / Number.parseInt(quantity, 10)
														).toLocaleString()}
													</span>
													.
												</p>
												{isPriceHigher && (
													<div className="mt-3 text-xs bg-amber-500/10 text-amber-400 p-2 rounded border border-amber-500/20">
														<strong>Insight:</strong> Your existing{" "}
														{selectedProduct.stock} bottles were bought cheaper.
														We'll track this so you know exactly which ones make
														you more profit!
													</div>
												)}
											</div>
										</div>
									</motion.div>
								)}

								<div className="flex items-center space-x-2">
									<div
										onClick={() => setLandedCostLater(!landedCostLater)}
										className="flex items-center space-x-2 cursor-pointer group"
									>
										<div
											className={cn(
												"w-5 h-5 rounded border flex items-center justify-center transition-colors",
												landedCostLater
													? "bg-indigo-600 border-indigo-600"
													: "border-zinc-600 group-hover:border-zinc-500",
											)}
										>
											{landedCostLater && (
												<CheckCircle2 className="w-3.5 h-3.5 text-white" />
											)}
										</div>
										<Label className="cursor-pointer text-zinc-400 group-hover:text-zinc-300">
											Add transport/shipping costs later?
										</Label>
									</div>
								</div>

								<div className="flex gap-3">
									<Button
										variant="ghost"
										onClick={() => setStep(1)}
										className="flex-1"
									>
										Back
									</Button>
									<Button
										className="flex-[2] bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
										disabled={!quantity || !newCost}
										onClick={handleNext}
									>
										Review & Save
									</Button>
								</div>
							</motion.div>
						)}

						{/* STEP 3: REVIEW & SUCCESS */}
						{step === 3 && selectedProduct && (
							<motion.div
								key="step3"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="space-y-6"
							>
								<div className="text-center space-y-2 py-4">
									<div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
										<PackagePlus className="w-8 h-8" />
									</div>
									<h3 className="text-xl font-semibold text-zinc-100">
										Stock Recorded!
									</h3>
									<p className="text-zinc-400 max-w-[280px] mx-auto">
										Added{" "}
										<span className="text-white font-medium">
											{quantity} units
										</span>{" "}
										of {selectedProduct.name} to your inventory.
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
										<div className="text-xs text-zinc-500 mb-1">
											New Total Stock
										</div>
										<div className="text-xl font-mono text-zinc-200">
											{selectedProduct.stock + Number.parseInt(quantity, 10)}{" "}
											units
										</div>
									</div>
									<div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
										<div className="text-xs text-zinc-500 mb-1">
											Batch Value
										</div>
										<div className="text-xl font-mono text-zinc-200">
											KES {Number.parseInt(newCost, 10).toLocaleString()}
										</div>
									</div>
								</div>

								{landedCostLater && (
									<div className="flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
										<Truck className="w-5 h-5 text-blue-400 shrink-0" />
										<div className="text-xs text-blue-300">
											<strong>Pending Action:</strong> We've marked this PO as
											"Pending Landed Costs". When the transporter bill arrives,
											just tap the notification to update the final cost.
										</div>
									</div>
								)}

								<Button
									className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
									onClick={reset}
								>
									Done
								</Button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	);
}
