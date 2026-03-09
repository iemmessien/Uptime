"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountFormProps {
  initialEmail: string;
  initialUsername: string;
}

export function AccountForm({ initialEmail, initialUsername }: AccountFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [username, setUsername] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [infoError, setInfoError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleInfoUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setInfoError("");
    setInfoMessage("");
    setIsLoadingInfo(true);

    try {
      const response = await fetch("/uptime/api/account/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInfoMessage("Account information updated successfully!");
        
        // If username changed, reload after a delay
        if (username !== initialUsername) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setInfoError(data.error || "Failed to update account information");
      }
    } catch {
      setInfoError("An error occurred while updating your account information");
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    setIsLoadingPassword(true);

    // Validate password change
    if (!currentPassword) {
      setPasswordError("Current password is required");
      setIsLoadingPassword(false);
      return;
    }
    
    if (!newPassword) {
      setPasswordError("New password is required");
      setIsLoadingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setIsLoadingPassword(false);
      return;
    }

    try {
      const response = await fetch("/uptime/api/account/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "Failed to update password");
      }
    } catch {
      setPasswordError("An error occurred while updating your password");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
        <CardDescription>
          Update your account information and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Account Information Form */}
        <form onSubmit={handleInfoUpdate} className="space-y-6 pb-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Error/Success Messages for Info */}
          {infoError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {infoError}
            </div>
          )}
          {infoMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {infoMessage}
            </div>
          )}

          {/* Update Information Button */}
          <Button
            type="submit"
            disabled={isLoadingInfo}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isLoadingInfo ? "Updating..." : "Update Information"}
          </Button>
        </form>

        {/* Password Change Form */}
        <form onSubmit={handlePasswordUpdate} className="border-t pt-6 space-y-4">
          <h3 className="text-lg font-medium">Change Password</h3>
          <p className="text-sm text-gray-900">
            Enter your current password and a new password to change it
          </p>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          {/* Error/Success Messages for Password */}
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {passwordMessage}
            </div>
          )}

          {/* Update Password Button */}
          <Button
            type="submit"
            disabled={isLoadingPassword}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isLoadingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
