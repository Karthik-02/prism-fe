'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '@/components/AppFrame';
import {
  ActionDisclosure,
  EmptyState,
  Field,
  InlineMessage,
  SectionCard,
  SelectInput,
  StatCard,
  StatusBadge,
  TextInput
} from '@/components/Ui';
import {
  createEmailDomain,
  deleteEmailDomain,
  getEmailDomains,
  updateEmailDomainStatus
} from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useProfile } from '@/lib/hooks';
import { EmailDomain } from '@/lib/types';

const statusTone = (status: EmailDomain['status']) => (status === 'ACTIVE' ? 'success' : 'warning');

export default function EmailDomainsPage() {
  const queryClient = useQueryClient();
  const profile = useProfile().data;
  const permissions = profile?.permissions ?? [];
  const canManageDomains = profile?.status === 'ACTIVE' && permissions.includes('CAN_MANAGE_EMAIL_DOMAIN');

  const domainsQuery = useQuery({
    queryKey: ['email-domains'],
    queryFn: getEmailDomains,
    enabled: canManageDomains
  });

  const domains = domainsQuery.data ?? [];
  const [formState, setFormState] = useState({
    domain: '',
    status: 'ACTIVE' as EmailDomain['status']
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['email-domains'] });

  const createMutation = useMutation({
    mutationFn: createEmailDomain,
    onSuccess: async () => {
      await invalidate();
      setFormState({ domain: '', status: 'ACTIVE' });
      setMessage('Email domain created.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateEmailDomainStatus,
    onSuccess: async () => {
      await invalidate();
      setMessage('Domain status updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailDomain,
    onSuccess: async () => {
      await invalidate();
      setMessage('Domain deleted.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      domain: formState.domain.trim(),
      status: formState.status
    });
  };

  const activeDomains = domains.filter((domain) => domain.status === 'ACTIVE');
  const inactiveDomains = domains.filter((domain) => domain.status === 'INACTIVE');

  return (
    <AppFrame
      title="Email domain controls"
      subtitle="OTP access is now managed in-context from the allowlist itself. Domain creation is collapsed until needed, and status changes happen against the record instead of through a detached ID form."
    >
      {!canManageDomains ? (
        <SectionCard
          title="Domain access required"
          eyebrow="Permissions"
          description="This workspace is only available to active users with `CAN_MANAGE_EMAIL_DOMAIN`."
        >
          <EmptyState
            title="No domain administration access"
            description="The backend blocks domain allowlist reads and writes unless your role grants the domain-management permission."
          />
        </SectionCard>
      ) : (
        <>
          <section className="stat-grid">
            <StatCard label="Total domains" value={domains.length} meta="Fetched from the backend allowlist API." tone="sunrise" />
            <StatCard label="Active" value={activeDomains.length} meta="Only active domains can request OTP login." tone="sea" />
            <StatCard label="Inactive" value={inactiveDomains.length} meta="Inactive domains remain visible for auditability." tone="gold" />
            <StatCard
              label="Latest change"
              value={domains[0] ? formatDateTime(domains[0].createdAt) : 'None'}
              meta="The list stays live with every create, status change, and delete action."
              tone="ink"
            />
          </section>

          <ActionDisclosure
            title="Add email domain"
            summary="Keep the allowlist form collapsed until you need to add a new organization or temporarily stage a domain as inactive."
          >
            <form className="form-grid" onSubmit={handleCreate}>
              <Field label="Domain" required hint="Use the bare hostname, for example `company.com`.">
                <TextInput
                  value={formState.domain}
                  onChange={(event) => setFormState((current) => ({ ...current, domain: event.target.value }))}
                  placeholder="company.com"
                  required
                />
              </Field>
              <Field label="Initial status" required>
                <SelectInput
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      status: event.target.value as EmailDomain['status']
                    }))
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </SelectInput>
              </Field>
              <div className="inline-actions" style={{ alignItems: 'end' }}>
                <button type="submit" className="button-primary" disabled={createMutation.isPending || !formState.domain.trim()}>
                  {createMutation.isPending ? 'Creating...' : 'Create domain'}
                </button>
              </div>
            </form>
          </ActionDisclosure>

          {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
          {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

          <SectionCard
            title="Allowed domains"
            eyebrow="Allowlist"
            description="Every domain stays visible with creation metadata and record-scoped actions for activation, deactivation, or removal."
          >
            {domains.length ? (
              <div className="stack-list">
                {domains.map((domain) => {
                  const nextStatus = domain.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

                  return (
                    <div key={domain.id} className="list-card">
                      <div className="list-row">
                        <div>
                          <p className="eyebrow">Created {formatDateTime(domain.createdAt)}</p>
                          <h3>{domain.domain}</h3>
                          <p>Created by {domain.createdBy}</p>
                        </div>
                        <div className="tag-list">
                          <StatusBadge tone={statusTone(domain.status)}>{domain.status}</StatusBadge>
                          <button
                            type="button"
                            className="button-secondary"
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ id: domain.id, status: nextStatus })}
                          >
                            Mark {nextStatus.toLowerCase()}
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(domain.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No domains configured"
                description="Add the first company domain before users can request OTP authentication."
              />
            )}
          </SectionCard>
        </>
      )}
    </AppFrame>
  );
}
