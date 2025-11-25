"use client"

import { motion } from "framer-motion"
import { Check, AlertCircle } from "lucide-react"

export function LedgerVisual() {
    const transactions = [
        { id: "BATCH-001", action: "IN", qty: 100, cost: "$10.00", status: "active" },
        { id: "BATCH-001", action: "OUT", qty: -20, cost: "$10.00", profit: "$5.00", status: "completed" },
        { id: "BATCH-002", action: "IN", qty: 50, cost: "$12.50", status: "active" },
        { id: "BATCH-001", action: "OUT", qty: -5, cost: "$10.00", profit: "$5.00", status: "processing" },
    ]

    return (
        <div className="w-full max-w-md mx-auto bg-card border rounded-xl shadow-2xl overflow-hidden font-mono text-xs md:text-sm">
            <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="text-muted-foreground">inventory_ledger.db</div>
            </div>
            <div className="p-4 space-y-2">
                <div className="grid grid-cols-5 text-muted-foreground mb-2 px-2">
                    <div className="col-span-2">BATCH ID</div>
                    <div>ACTION</div>
                    <div className="text-right">COST</div>
                    <div className="text-right">STATUS</div>
                </div>
                {transactions.map((tx, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className={`grid grid-cols-5 items-center p-2 rounded-lg ${tx.status === "processing"
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : "hover:bg-muted/50"
                            }`}
                    >
                        <div className="col-span-2 font-medium">{tx.id}</div>
                        <div className={tx.action === "IN" ? "text-blue-500" : "text-orange-500"}>
                            {tx.action}
                        </div>
                        <div className="text-right">{tx.cost}</div>
                        <div className="flex justify-end">
                            {tx.status === "processing" ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <AlertCircle className="h-4 w-4 text-emerald-500" />
                                </motion.div>
                            ) : (
                                <Check className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                    </motion.div>
                ))}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="mt-4 pt-4 border-t flex justify-between items-center text-emerald-600 font-bold"
                >
                    <span>TRUE PROFIT CALCULATED</span>
                    <span>$10.00</span>
                </motion.div>
            </div>
        </div>
    )
}
