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
  type StatusTone,
  TextInput
} from '@/components/Ui';
import {
  approveUser,
  assignRoleToUser,
  createUser,
  disapproveUser,
  getRoles,
  removeRoleFromUser
} from '@/lib/api';
import { USER_STATUS_OPTIONS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useProfile, useUsers } from '@/lib/hooks';
import { UserSummary } from '@/lib/types';

const statusTone = (status: string): StatusTone => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'DISAPPROVED' || status === 'INACTIVE') return 'danger';
  if (status === 'PENDING_VERIFICATION') return 'warning';
  return 'info';
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const profile = useProfile().data;
  const permissions = profile?.permissions ?? [];
  const canCreateUser = permissions.includes('CAN_CREATE_USER');
  const canVerify = permissions.includes('CAN_VERIFY_USERS');
  const canAssignRole = permissions.includes('CAN_ASSIGN_ROLE');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const usersQuery = useUsers({ status: (statusFilter || undefined) as UserSummary['status'] | undefined }, Boolean(profile?.status === 'ACTIVE' && (canCreateUser || canVerify || canAssignRole)));
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: Boolean(profile?.status === 'ACTIVE' && (canAssignRole || canCreateUser))
  });

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const [createState, setCreateState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    githubUserId: '',
    status: 'PENDING_VERIFICATION' as UserSummary['status']
  });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await invalidate();
      setMessage('User created successfully.');
      setError('');
      setCreateState({ firstName: '', lastName: '', email: '', githubUserId: '', status: 'PENDING_VERIFICATION' });
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: async () => {
      await invalidate();
      setMessage('User approved.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const disapproveMutation = useMutation({
    mutationFn: disapproveUser,
    onSuccess: async () => {
      await invalidate();
      setMessage('User disapproved.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const assignMutation = useMutation({
    mutationFn: assignRoleToUser,
    onSuccess: async () => {
      await invalidate();
      setMessage('Role assigned.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const removeMutation = useMutation({
    mutationFn: removeRoleFromUser,
    onSuccess: async () => {
      await invalidate();
      setMessage('Role removed.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(createState);
  };

  return (
    <AppFrame
      title="User operations"
      subtitle="Verification, account creation, and role assignment are now attached to the actual list APIs, so every action happens in-place on a real user record."
      actions={
        <SelectInput value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {USER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </SelectInput>
      }
    >
      <section className="stat-grid">
        <StatCard label="Users in scope" value={users.length} meta="The list endpoint now supports verification and role-assignment flows, not just creation." tone="sunrise" />
        <StatCard label="Pending verification" value={users.filter((user) => user.status === 'PENDING_VERIFICATION').length} meta="Approve or disapprove directly from the record card." tone="gold" />
        <StatCard label="Active accounts" value={users.filter((user) => user.status === 'ACTIVE').length} meta="Active users can sign in and use their permitted workflows." tone="sea" />
        <StatCard label="Available roles" value={roles.length} meta="Role selectors are backed by the same live catalogue used elsewhere." tone="ink" />
      </section>

      {canCreateUser ? (
        <ActionDisclosure title="Create user" summary="New accounts stay behind a collapsed form until needed, rather than staying pinned open on the page.">
          <form className="form-grid" onSubmit={handleCreate}>
            <Field label="First name" required>
              <TextInput value={createState.firstName} onChange={(event) => setCreateState((current) => ({ ...current, firstName: event.target.value }))} required />
            </Field>
            <Field label="Last name" required>
              <TextInput value={createState.lastName} onChange={(event) => setCreateState((current) => ({ ...current, lastName: event.target.value }))} required />
            </Field>
            <Field label="Email" required>
              <TextInput type="email" value={createState.email} onChange={(event) => setCreateState((current) => ({ ...current, email: event.target.value }))} required />
            </Field>
            <Field label="GitHub user ID" required>
              <TextInput value={createState.githubUserId} onChange={(event) => setCreateState((current) => ({ ...current, githubUserId: event.target.value }))} required />
            </Field>
            <Field label="Status" required>
              <SelectInput value={createState.status} onChange={(event) => setCreateState((current) => ({ ...current, status: event.target.value as UserSummary['status'] }))}>
                {USER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <div className="inline-actions" style={{ alignItems: 'end' }}>
              <button type="submit" className="button-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </form>
        </ActionDisclosure>
      ) : null}

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <SectionCard title="User list" eyebrow="Directory" description="Every account is shown with status, assigned roles, and contextual actions for the permissions you actually hold.">
        {users.length ? (
          <div className="stack-list">
            {users.map((user) => {
              const selectedRoleId = roleDrafts[user.id] ?? '';
              const reason = reasonDrafts[user.id] ?? '';

              return (
                <div key={user.id} className="list-card">
                  <div className="list-row">
                    <div>
                      <p className="eyebrow">{user.email}</p>
                      <h3>
                        {user.firstName} {user.lastName}
                      </h3>
                      <p>
                        GitHub {user.githubUserId} · created {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                    <div className="tag-list">
                      <StatusBadge tone={statusTone(user.status)}>{user.status}</StatusBadge>
                      {user.roles.map((role) => (
                        <span key={role.id} className="soft-chip">
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {(canVerify || canAssignRole) ? (
                    <ActionDisclosure title="User actions" summary="Approve, disapprove, assign, or remove roles directly against this user record.">
                      <div className="grid-3">
                        {canVerify ? (
                          <div className="stack-card">
                            <div className="inline-actions">
                              <button type="button" className="button-secondary" onClick={() => approveMutation.mutate(user.id)}>
                                Approve user
                              </button>
                            </div>
                            <Field label="Disapproval reason">
                              <TextInput value={reason} onChange={(event) => setReasonDrafts((current) => ({ ...current, [user.id]: event.target.value }))} />
                            </Field>
                            <button type="button" className="button-danger" onClick={() => disapproveMutation.mutate({ id: user.id, reason })}>
                              Disapprove user
                            </button>
                          </div>
                        ) : null}

                        {canAssignRole ? (
                          <div className="stack-card">
                            <Field label="Assign role">
                              <SelectInput value={selectedRoleId} onChange={(event) => setRoleDrafts((current) => ({ ...current, [user.id]: event.target.value }))}>
                                <option value="">Select role</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <div className="inline-actions">
                              <button type="button" className="button-secondary" disabled={!selectedRoleId} onClick={() => assignMutation.mutate({ id: user.id, roleId: selectedRoleId })}>
                                Assign role
                              </button>
                              <button type="button" className="button-ghost" disabled={!selectedRoleId} onClick={() => removeMutation.mutate({ id: user.id, roleId: selectedRoleId })}>
                                Remove role
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </ActionDisclosure>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No users matched the current filter" description="Clear the filter or create a new user if your account has creation permission." />
        )}
      </SectionCard>
    </AppFrame>
  );
}
