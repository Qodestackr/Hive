"use client";

import React, { SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@repo/ui/sonner";
import { client } from "@workspace/auth/client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { PasswordInput } from "@repo/ui/components/password-input";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        toast.error("Invalid or missing reset token.");
        return;
      }

      const res = await client.resetPassword({
        newPassword: password,
        token,
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to reset password");
      }

      toast.success("Password reset successfully! Please sign in with your new password.");
      router.push("/sign-in");
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter your new password and confirm it below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full gap-3">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}