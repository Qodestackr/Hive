"use client";

import { CustomerForm } from "@/components/features/customers/customer-form";
import { Button } from "@repo/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Add New Customer
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manually add a customer to your database
                    </p>
                </div>
            </div>

            <CustomerForm mode="create" />
        </div>
    );
}
