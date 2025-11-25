"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Mail, CheckCircle } from "lucide-react"
import { toast } from "@repo/ui/sonner"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert"
import { Card, CardContent } from "@repo/ui/components/card"
import { forgetPassword } from "@repo/auth/client"
import { z } from "@repo/schema"

const emailSchema = z.object({
    email: z.string().email("Invalid email address"),
})

type EmailFormValues = z.infer<typeof emailSchema>

export default function ResetPasswordPage() {
    const [step, setStep] = useState("email")
    const [email, setEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    })

    const handleEmailSubmit = async (data: EmailFormValues) => {
        setIsSubmitting(true)
        try {
            const response = await forgetPassword({
                email: data.email,
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (response.error) {
                throw new Error(response.error.message || "Failed to send reset email")
            }

            setEmail(data.email)
            setStep("confirmation")
            toast.success("Password reset link sent to your email!")
        } catch (error) {
            console.error("Reset password error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to send reset email. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="mt-2 w-full max-w-md mx-auto">
            <CardContent className="pt-4">
                <h2 className="text-xl font-semibold text-center mb-6">Reset Password</h2>

                {step === "email" && (
                    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Enter Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g jane254@gmail.com"
                                    {...emailForm.register("email")}
                                    className="pl-10"
                                />
                            </div>
                            {emailForm.formState.errors.email && (
                                <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                            {!isSubmitting && <ArrowRight className="ml-2" size={18} />}
                        </Button>
                    </form>
                )}

                {step === "confirmation" && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center py-4">
                            <CheckCircle className="text-green-500 h-16 w-16 mb-4" />
                            <h3 className="text-lg font-medium">Email Sent!</h3>
                            <p className="text-center text-muted-foreground mt-2">
                                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and click the link
                                to reset your password.
                            </p>
                        </div>
                        <Alert>
                            <AlertTitle>Didn't receive the email?</AlertTitle>
                            <AlertDescription>
                                Check your spam folder or try again in a few minutes. If you still don't receive it, you can request
                                another reset link.
                            </AlertDescription>
                        </Alert>
                        <Button variant="outline" className="w-full" onClick={() => setStep("email")}>
                            Try Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}