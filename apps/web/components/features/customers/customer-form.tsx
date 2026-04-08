"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateCustomer, useUpdateCustomer } from "@/lib/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CustomerFormData {
    name: string;
    phone: string;
    email?: string;
}

interface CustomerFormProps {
    initialData?: CustomerFormData & { id: string };
    mode: "create" | "edit";
}

export function CustomerForm({ initialData, mode }: CustomerFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<CustomerFormData>({
        name: initialData?.name || "",
        phone: initialData?.phone || "",
        email: initialData?.email || "",
    });

    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.phone) {
            toast.error("Phone number is required");
            return;
        }

        try {
            if (mode === "create") {
                await createMutation.mutateAsync(formData, {
                    onSuccess: (data) => {
                        toast.success("Customer created successfully");
                        router.push(`/customers/${data.id}`);
                    },
                });
            } else {
                await updateMutation.mutateAsync(
                    { id: initialData!.id, ...formData },
                    {
                        onSuccess: () => {
                            toast.success("Customer updated successfully");
                            router.push(`/customers/${initialData?.id}`);
                        },
                    },
                );
            }
        } catch (error) {
            toast.error("Failed to save customer");
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {mode === "create" ? "New Customer" : "Edit Customer"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Phone Number <span className="text-red-600">*</span>
                        </Label>
                        <Input
                            id="phone"
                            required
                            placeholder="+254..."
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                            }
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-zinc-500">
                            International format required (e.g., +254712345678)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {mode === "create" ? "Create Customer" : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
