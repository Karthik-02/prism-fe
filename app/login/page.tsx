'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { Field, InlineMessage, SectionCard, TextInput } from '@/components/Ui';
import { requestOtp, verifyOtp } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [githubUserId, setGithubUserId] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setRequestLoading(true);

    try {
      const response = await requestOtp(email);
      setDevOtp(response.devOtp ?? null);
      setMessage(response.message);
      setStep('verify');
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setVerifyLoading(true);

    try {
      await verifyOtp({ email, otp, firstName, lastName, githubUserId });
      router.push('/');
    } catch (verifyError) {
      setError((verifyError as Error).message);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <main className="workspace-shell" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <section className="hero-card panel-surface">
        <BrandLogo />
        <div className="hero-copy">
          <p className="eyebrow">Secure sign-in</p>
          <h1>OTP entry with backend domain controls.</h1>
          <p>
            PRism login is driven by `POST /auth/request-otp` and `POST /auth/verify-otp`. Your email domain must be on
            the active allowlist before the API will issue a session.
          </p>
        </div>
      </section>

      <div className="grid-2">
        <SectionCard
          title="Request OTP"
          eyebrow="Step 1"
          description="Start with your company email. The backend validates domain status before generating the one-time code."
        >
          <form className="form-grid" onSubmit={handleRequest}>
            <Field label="Work email" required>
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </Field>
            <div className="inline-actions" style={{ alignItems: 'end' }}>
              <button type="submit" className="button-primary" disabled={requestLoading}>
                {requestLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
          {devOtp ? <InlineMessage tone="info">Development OTP: {devOtp}</InlineMessage> : null}
        </SectionCard>

        <SectionCard
          title="Verify identity"
          eyebrow="Step 2"
          description="Complete the session bootstrap with your personal details and the OTP you received."
        >
          <form className="form-grid" onSubmit={handleVerify}>
            <Field label="First name" required>
              <TextInput value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            </Field>
            <Field label="Last name" required>
              <TextInput value={lastName} onChange={(event) => setLastName(event.target.value)} required />
            </Field>
            <Field label="GitHub user ID" required>
              <TextInput value={githubUserId} onChange={(event) => setGithubUserId(event.target.value)} required />
            </Field>
            <Field label="OTP" required>
              <TextInput value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" required />
            </Field>
            <div className="inline-actions" style={{ alignItems: 'end' }}>
              <button type="submit" className="button-primary" disabled={verifyLoading || step !== 'verify'}>
                {verifyLoading ? 'Verifying...' : 'Verify and continue'}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <div className="inline-actions">
        <Link href="/" className="button-ghost">
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
