"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "@repo/ui/framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, CheckCircle, Crown, Loader2, Mail, Phone, Sparkles, User } from "lucide-react"

import { Button } from "@repo/ui/components//button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components//textarea"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group"
import { Badge } from "@repo/ui/components/badge"
import { toast } from "@repo/ui/sonner"

export default function RequestAccessPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        teamSize: "50-200",
        message: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleRadioChange = (value: string) => {
        setFormData((prev) => ({ ...prev, teamSize: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/lead", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    role: formData.role,
                    teamSize: formData.teamSize,
                    message: formData.message,
                    source: "Request Access",
                }),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error("Failed to submit request")
            }

            setStep(3) // Move to success step
            toast.success("VIP access request submitted", {
                description: "Our enterprise team will contact you within 24 hours.",
            })
        } catch (error) {
            toast.error("Something went wrong", {
                description: "Please try again or contact us directly.",
            })
            console.error("Submission error:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-4 px-4">
            <div className="max-w-2xl mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <Card className="border-gray-200 shadow-xl py-0">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Crown className="h-5 w-5 text-emerald-700" />
                            </div>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                                VIP Access
                            </Badge>
                        </div>
                        <CardTitle className="text-2xl font-light text-emerald-900">Request Enterprise Access</CardTitle>
                        <CardDescription className="text-lg">
                            Join the exclusive circle of brand owners commanding their distribution networks with Promco
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8">
                        {step === 1 && (
                            <motion.form
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-sm font-medium">
                                            First Name
                                        </Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="John"
                                            className="h-11"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-medium">
                                            Last Name
                                        </Label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Doe"
                                            className="h-11"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Executive Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            placeholder="you@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium">
                                        Direct Phone
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            placeholder="+254 712 345 678"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-sm font-medium">
                                        Brand/Company
                                    </Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="company"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            placeholder="EABL, KWAL, Keroche, etc."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-sm font-medium">
                                        Executive Role
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="pl-10 h-11"
                                            placeholder="CEO, Sales Director, Route-to-Market Manager"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white h-12 text-lg"
                                        onClick={() => setStep(2)}
                                    >
                                        Continue to Details
                                        <Sparkles className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Organization Size</Label>
                                    <RadioGroup
                                        value={formData.teamSize}
                                        onValueChange={handleRadioChange}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-emerald-200">
                                            <RadioGroupItem value="10-50" id="team-10-50" />
                                            <Label htmlFor="team-10-50" className="cursor-pointer font-medium">
                                                10-50 employees
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-emerald-200">
                                            <RadioGroupItem value="50-200" id="team-50-200" />
                                            <Label htmlFor="team-50-200" className="cursor-pointer font-medium">
                                                50-200 employees
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-emerald-200">
                                            <RadioGroupItem value="200-1000" id="team-200-1000" />
                                            <Label htmlFor="team-200-1000" className="cursor-pointer font-medium">
                                                200-1000 employees
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-emerald-200">
                                            <RadioGroupItem value="1000+" id="team-1000+" />
                                            <Label htmlFor="team-1000+" className="cursor-pointer font-medium">
                                                1000+ employees
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-sm font-medium">
                                        Your Distribution Challenges
                                    </Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us about your current distribution network, key challenges, and what you're looking to achieve with Promco..."
                                        rows={5}
                                        className="resize-none"
                                    />
                                </div>

                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                                    <div className="flex items-start gap-3">
                                        <Crown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-amber-900 mb-1">VIP Access Includes</h4>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                <li>• Dedicated enterprise account manager</li>
                                                <li>• Priority support and implementation</li>
                                                <li>• Custom integrations and white-glove onboarding</li>
                                                <li>• Quarterly business reviews and strategy sessions</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                                        Back
                                    </Button>

                                    <Button
                                        type="submit"
                                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white h-12 text-lg shadow-lg"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Crown className="mr-2 h-4 w-4" />
                                                Request VIP Access
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="py-8 text-center"
                            >
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                                </div>

                                <h3 className="text-3xl font-light text-gray-900 mb-3">Request Received</h3>
                                <p className="text-gray-600 mb-3 text-lg max-w-md mx-auto">
                                    Welcome to the VIP circle. Our enterprise team will contact you within 24 hours to discuss your
                                    exclusive access.
                                </p>

                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 mb-4">
                                    <h4 className="font-medium text-emerald-900 mb-2">What Happens Next</h4>
                                    <ul className="text-sm text-emerald-800 space-y-1 text-left max-w-sm mx-auto">
                                        <li>• Enterprise team review (within 24 hours)</li>
                                        <li>• Personalized demo scheduling</li>
                                        <li>• Custom solution design</li>
                                        <li>• VIP onboarding process</li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={() => router.push("/for-brands")}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 h-12"
                                >
                                    Return to Brand Center
                                </Button>
                            </motion.div>
                        )}
                    </CardContent>

                    {(step === 1 || step === 2) && (
                        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
                            <div className="text-sm text-gray-500">Step {step} of 2</div>
                            <div className="text-sm text-emerald-700 font-medium">Enterprise-Grade Security</div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    )
}
