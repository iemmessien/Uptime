"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-login effect for URL parameters
  useEffect(() => {
    const autoUsername = searchParams.get("autoUsername");
    const autoPassword = searchParams.get("autoPassword");
    
    console.log('[Login Page] Auto-login check - autoUsername:', autoUsername, 'autoPassword:', autoPassword ? '***' : 'null');

    if (autoUsername && autoPassword) {
      console.log('[Login Page] Auto-login detected, attempting login...');
      setUsername(autoUsername);
      setPassword(autoPassword);
      setIsLoading(true);

      // Automatically submit login
      fetch("/uptime/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: autoUsername, password: autoPassword }),
      })
        .then((response) => {
          console.log('[Login Page] Auto-login response status:', response.status);
          return response.json();
        })
        .then((data) => {
          console.log('[Login Page] Auto-login response data:', data);
          if (data.success) {
            const redirect = searchParams.get("redirect") || "/";
            console.log('[Login Page] Auto-login successful, redirecting to:', redirect);
            router.push(redirect);
            router.refresh();
          } else {
            setError(data.error || "Auto-login failed");
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('[Login Page] Auto-login error:', err);
          setError("An error occurred during auto-login");
          setIsLoading(false);
        });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log('[Login] Attempting login with:', { username });
      const response = await fetch('/uptime/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      console.log('[Login] Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Get redirect URL from query params or default to /
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError(`An error occurred: ${err instanceof Error ? err.message : 'Please try again.'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/uptime/images/tpsl-logo.jpeg"
              alt="TPSL Logo"
              width={80}
              height={80}
              className="h-20"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Uptime Monitoring System
          </CardTitle>
          <CardDescription>
            Sign in to access the power generation monitoring dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
