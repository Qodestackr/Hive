"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "@repo/ui/framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Calendar, CheckCircle, Clock, Crown, Loader2, Mail, Phone, Sparkles, User } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group"
import { Badge } from "@repo/ui/components/badge"
import { toast } from "@repo/ui/sonner"

export default function ScheduleDemoPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    role: "",
  })

  // Generate available dates (next 5 business days)
  const today = new Date()
  const availableDates = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i + 1)
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) return null
    return date
  }).filter(Boolean) as Date[]

  // Generate available times (9 AM to 5 PM, 1-hour slots)
  const generateTimes = () => {
    return Array.from({ length: 8 }, (_, i) => {
      const hour = i + 9
      return `${hour}:00 ${hour < 12 ? "AM" : "PM"}`
    })
  }

  const availableTimes = generateTimes()

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setContactInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime) {
      toast.error("Please select both a date and time")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone,
          company: contactInfo.company,
          role: contactInfo.role,
          source: "Demo Request",
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to schedule demo")
      }

      setStep(3) // Move to success step
      toast.success("Your private demo has been scheduled", {
        description: "Our enterprise team will contact you shortly.",
      })
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again or contact us directly.",
      })
      console.error("Demo scheduling error:", error)
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

        <Card className="p-1 border-gray-200 shadow-xl py-0">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 mt-1 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-700" />
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                VIP Access
              </Badge>
            </div>
            <CardTitle className="text-xl font-light text-emerald-900">Schedule Your Private Demo</CardTitle>
            <CardDescription className="text-sm">
              Get an exclusive walkthrough of Promco's Brand Command Center, tailored specifically for your distribution
              challenges
            </CardDescription>
          </CardHeader>

          <CardContent className="p-1">
            {/* Step 1: Contact Info */}
            {step === 1 && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  setStep(2)
                }}
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
                      value={contactInfo.firstName}
                      onChange={handleContactChange}
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
                      value={contactInfo.lastName}
                      onChange={handleContactChange}
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
                      value={contactInfo.email}
                      onChange={handleContactChange}
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
                      value={contactInfo.phone}
                      onChange={handleContactChange}
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
                      value={contactInfo.company}
                      onChange={handleContactChange}
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
                      value={contactInfo.role}
                      onChange={handleContactChange}
                      className="pl-10 h-11"
                      placeholder="CEO, Sales Director, Route-to-Market Manager"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white h-12 text-lg"
                  >
                    Continue to Schedule
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.form>
            )}

            {/* Step 2: Date/Time Selection */}
            {step === 2 && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <Label className="text-lg font-medium">Select Your Preferred Date</Label>
                  <RadioGroup
                    value={selectedDate || ""}
                    onValueChange={setSelectedDate}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {availableDates.slice(0, 6).map((date, i) => {
                      const iso = date.toISOString()
                      const isSelected = selectedDate === iso

                      return (
                        <div
                          key={i}
                          className={`border-2 rounded-lg p-2 cursor-pointer transition-all flex items-center justify-between ${isSelected
                            ? "border-emerald-600 bg-emerald-50 shadow-md text-emerald-800"
                            : "hover:border-emerald-200 hover:bg-gray-50"
                            }`}
                          onClick={() => setSelectedDate(iso)}
                        >
                          <RadioGroupItem value={iso} id={`date-${i}`} className="sr-only" />
                          <div className="flex flex-col text-sm font-medium">
                            <span>{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                            <span>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                          {isSelected && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>

                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <Label className="text-lg font-medium">Select Your Preferred Time</Label>
                    <RadioGroup
                      value={selectedTime || ""}
                      onValueChange={setSelectedTime}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    >
                      {availableTimes.map((time, i) => (
                        <div
                          key={i}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedTime === time
                            ? "border-emerald-600 bg-emerald-50 shadow-md"
                            : "hover:border-emerald-200 hover:bg-gray-50"
                            }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          <RadioGroupItem value={time} id={`time-${i}`} className="sr-only" />
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{time}</span>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </motion.div>
                )}

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-900 mb-2">What to Expect</h4>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>• Personalized walkthrough of Promco Platform OS</li>
                        <li>• Live demo of predictive analytics and demand forecasting</li>
                        <li>• Discussion of your specific brand challenges and solutions</li>
                        <li>• Q&A with our enterprise solutions team. ROI focused</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white h-12"
                    disabled={!selectedDate || !selectedTime || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-5 w-5" />
                        Schedule Demo
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>

                <h3 className="text-2xl font-light text-gray-900 mb-3">Demo Confirmed</h3>
                <p className="text-gray-600 mb-4 text-lg">Your private demo has been scheduled for:</p>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 mb-3 inline-block">
                  <p className="font-medium text-gray-900 text-lg">
                    {selectedDate &&
                      new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </p>
                  <p className="text-emerald-700 font-medium text-xl">{selectedTime}</p>
                </div>

                <p className="text-gray-600 mb-3 max-w-md mx-auto">
                  Our enterprise team will contact you within the next hour to confirm details and prepare your
                  personalized demo.
                </p>

                <Button
                  onClick={() => router.push("/for-brands")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-8"
                >
                  Return to Brand Center
                </Button>
              </motion.div>
            )}
          </CardContent>

          {step !== 3 && (
            <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
              <div className="text-sm text-gray-500">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2 - All times in EAT"}
              </div>
              <div className="text-sm text-emerald-700 font-medium">VIP Priority Scheduling</div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}