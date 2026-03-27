"use client";

import { useState } from "react";
import { Turnstile } from "react-turnstile";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CONTACT_API_URL = import.meta.env.VITE_CONTACT_API_URL || "https://email.nicholasgriffin.dev";

export function ContactForm() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);

  const handleVerify = (token: string) => {
    setTurnstileToken(token);
    setLoading(false);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setLoading(true);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setLoading(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!turnstileToken) {
      setError(true);
      return;
    }

    setSuccess(false);
    setError(false);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("cf-turnstile-response", turnstileToken);

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        body: formData,
      });

      const { ok } = await response.json();

      setSubmitting(false);

      if (ok) {
        setSuccess(true);
        event.currentTarget.reset();
      } else {
        setError(true);
      }

      setTurnstileToken(null);
      setLoading(true);
      setTurnstileWidgetKey((current) => current + 1);
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitting(false);
      setError(true);
      setTurnstileToken(null);
      setLoading(true);
      setTurnstileWidgetKey((current) => current + 1);
    }
  };

  if (success) {
    return <div>Message sent successfully!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="name">Your Email</Label>
        <Input
          type="text"
          id="from"
          name="from"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          type="text"
          id="subject"
          name="subject"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          name="body"
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <Turnstile
        key={turnstileWidgetKey}
        sitekey={import.meta.env.VITE_EMAIL_TURNSTILE_SITE_KEY || ""}
        onVerify={handleVerify}
        onExpire={handleTurnstileExpire}
        onError={handleTurnstileError}
        refreshExpired="auto"
      />

      {error && <div>Failed to send message. Please try again.</div>}

      {submitting && <div>Submitting...</div>}

      <Button type="submit" disabled={loading || submitting}>
        Send Message
      </Button>
    </form>
  );
}
