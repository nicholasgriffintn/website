'use client';

import { useState } from 'react';
import Turnstile from 'react-turnstile';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ContactForm() {
  const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(false);

  const handleVerify = () => {
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(false);
    setSubmitting(true);
		
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    try {
      const response = await fetch('https://email.nickgriffin.uk', {
        method: 'POST',
        body: formData,
      });

      const { ok } = await response.json();

      setSubmitting(false);
      
      if (ok) {
				setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(true);
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
        sitekey={process.env.NEXT_PUBLIC_EMAIL_TURNSTILE_SITE_KEY || ''}
        onVerify={handleVerify}
      />

			{error && <div>Failed to send message. Please try again.</div>}
			
			{submitting && <div>Submitting...</div>}

      <Button type="submit" disabled={loading || submitting}>
        Send Message
      </Button>
    </form>
  );
}
