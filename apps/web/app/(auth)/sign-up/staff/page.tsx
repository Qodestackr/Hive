"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "@repo/schema"
import { Eye, EyeOff, Loader2, UserCheck } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form"
import { Input } from "@repo/ui/components/input"
import { toast } from "@repo/ui/sonner"
import { signUp } from "@repo/auth/client"

const formSchema = z.object({
	firstName: z.string().min(2, { message: "Atleast 2 characters" }),
	lastName: z.string().min(2, { message: "Atleast 2 characters" }),
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z.string().min(8, { message: "Atleast 8 characters" }),
})

export default function StaffSignUp() {
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const router = useRouter()

	const searchParams = useSearchParams()
	const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
	const invitationEmail = searchParams.get("email") || ""

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: invitationEmail,
			password: "",
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setLoading(true)

		try {
			await signUp.email({
				email: values.email,
				password: values.password,
				name: `${values.firstName} ${values.lastName}`,
				callbackURL: callbackUrl,
				additionalFields: {
					role: "user",
					businessType: "staff",
				},
				fetchOptions: {
					onRequest: () => {
						setLoading(true)
					},
					onSuccess: async () => {
						router.push(callbackUrl)
					},
					onError: (ctx) => {
						console.error("Signup error:", ctx.error)
						toast.error(ctx.error.message || "Failed to create account")
						setLoading(false)
					},
					onResponse: () => {
						setLoading(false)
					}
				},
			})
		} catch (error) {
			console.error("Unexpected signup error:", error)
			toast.error("Failed to create account. Please try again.")
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen bg-background">
			<div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 mx-auto max-w-xl">
				<div className="w-full">
					<div className="text-center mb-6">
						<div className="flex justify-center mb-3">
							<div className="p-3 rounded-full bg-primary/10">
								<UserCheck className="w-8 h-8 text-primary" />
							</div>
						</div>
						<h2 className="text-2xl font-light text-foreground">Join as Staff Member</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Create your account to accept the organization invitation
						</p>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">First name</FormLabel>
											<FormControl>
												<Input placeholder="John" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-xs">Last name</FormLabel>
											<FormControl>
												<Input placeholder="Doe" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="you@example.com"
												{...field}
												disabled={!!invitationEmail}
												className={invitationEmail ? "bg-muted" : ""}
											/>
										</FormControl>
										{invitationEmail && (
											<p className="text-xs text-muted-foreground">
												This email matches your invitation
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs">Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
													onClick={() => setShowPassword(!showPassword)}
												>
													{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
													<span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
												</Button>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-xs text-blue-800 dark:text-blue-300">
								<span className="font-medium">Note:</span> You're signing up as a staff member. After creating your account, you'll be able to accept the invitation and join the organization.
							</div>

							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? (
									<div className="flex items-center justify-center gap-2">
										<Loader2 size={16} className="animate-spin" />
										<span>Creating account...</span>
									</div>
								) : (
									"Create Staff Account"
								)}
							</Button>

							<div className="text-center">
								<p className="text-xs text-muted-foreground">
									Already have an account?{" "}
									<Link
										href={callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in"}
										className="font-medium text-primary hover:underline"
									>
										Sign in
									</Link>
								</p>
							</div>
						</form>
					</Form>
				</div>
			</div>
		</div>
	)
}
