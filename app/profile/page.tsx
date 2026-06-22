'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AppFrame } from '@/components/AppFrame';
import {
  Field,
  InlineMessage,
  SectionCard,
  StatCard,
  StatusBadge,
  TextInput
} from '@/components/Ui';
import { logout, updateProfile } from '@/lib/api';
import { formatDateTime, formatPermission } from '@/lib/format';
import { useProfile } from '@/lib/hooks';

const statusTone = (status?: string) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'DISAPPROVED' || status === 'INACTIVE') return 'danger';
  if (status === 'PENDING_VERIFICATION') return 'warning';
  return 'info';
};

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profileQuery = useProfile();
  const profile = profileQuery.data;

  const [formState, setFormState] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    email: profile?.email ?? '',
    githubUserId: profile?.githubUserId ?? ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormState({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      githubUserId: profile.githubUserId ?? ''
    });
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setMessage(
        response.requiresVerification
          ? 'Profile updated. Email or GitHub changes moved the account back to pending verification.'
          : 'Profile updated successfully.'
      );
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/login');
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateMutation.mutate({
      firstName: formState.firstName.trim(),
      lastName: formState.lastName.trim(),
      email: formState.email.trim(),
      githubUserId: formState.githubUserId.trim()
    });
  };

  return (
    <AppFrame
      title="Profile"
      subtitle="Identity updates now live inside the rebuilt workspace instead of a detached utility screen. Verification-sensitive fields remain editable, and the page explains exactly when the backend will move you back to pending verification."
      actions={profile ? <StatusBadge tone={statusTone(profile.status)}>{profile.status}</StatusBadge> : null}
    >
      <section className="stat-grid">
        <StatCard label="Account status" value={profile?.status ?? 'Unknown'} meta="Authenticated users can always access profile controls." tone="sunrise" />
        <StatCard label="Roles assigned" value={profile?.roles.length ?? 0} meta="Roles come directly from the profile endpoint." tone="sea" />
        <StatCard label="Permissions" value={profile?.permissions.length ?? 0} meta="The same permission set drives the rest of the workspace." tone="gold" />
        <StatCard label="Last updated" value={profile ? formatDateTime(profile.updatedAt) : 'Unknown'} meta="Profile saves invalidate and reload live backend state." tone="ink" />
      </section>

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <div className="grid-2">
        <SectionCard
          title="Identity overview"
          eyebrow="Account"
          description="This section reflects the authenticated profile payload from the backend, including role membership and the active permission union."
        >
          {profile ? (
            <>
              <div className="key-value-grid">
                <div>
                  <span className="eyebrow">Full name</span>
                  <strong>
                    {profile.firstName} {profile.lastName}
                  </strong>
                </div>
                <div>
                  <span className="eyebrow">Email</span>
                  <strong>{profile.email}</strong>
                </div>
                <div>
                  <span className="eyebrow">GitHub user ID</span>
                  <strong>{profile.githubUserId}</strong>
                </div>
                <div>
                  <span className="eyebrow">Created</span>
                  <strong>{formatDateTime(profile.createdAt)}</strong>
                </div>
              </div>

              <div className="stack-list">
                <div>
                  <p className="eyebrow">Roles</p>
                  <div className="chip-list">
                    {profile.roles.length ? (
                      profile.roles.map((role) => (
                        <span key={role.id} className="soft-chip">
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="soft-chip">No roles assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="eyebrow">Permissions</p>
                  <div className="chip-list">
                    {profile.permissions.length ? (
                      profile.permissions.map((permission) => (
                        <span key={permission} className="soft-chip">
                          {formatPermission(permission)}
                        </span>
                      ))
                    ) : (
                      <span className="soft-chip">No permissions granted</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </SectionCard>

        <SectionCard
          title="Update profile"
          eyebrow="Edit"
          description="Changing email or GitHub identity triggers re-verification in the backend. Name-only edits update in place without restricting access."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="First name" required>
              <TextInput
                value={formState.firstName}
                onChange={(event) => setFormState((current) => ({ ...current, firstName: event.target.value }))}
                required
              />
            </Field>
            <Field label="Last name" required>
              <TextInput
                value={formState.lastName}
                onChange={(event) => setFormState((current) => ({ ...current, lastName: event.target.value }))}
                required
              />
            </Field>
            <Field label="Email" required hint="Email changes trigger `PENDING_VERIFICATION`.">
              <TextInput
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </Field>
            <Field label="GitHub user ID" required hint="GitHub ID changes also require verification.">
              <TextInput
                value={formState.githubUserId}
                onChange={(event) => setFormState((current) => ({ ...current, githubUserId: event.target.value }))}
                required
              />
            </Field>
            <div className="inline-actions" style={{ alignItems: 'end' }}>
              <button type="submit" className="button-primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>

          <div className="inline-actions">
            <button
              type="button"
              className="button-ghost"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate('ALL_SESSIONS')}
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out all sessions'}
            </button>
          </div>
        </SectionCard>
      </div>
    </AppFrame>
  );
}
