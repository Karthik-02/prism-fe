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
  StatCard,
  TextInput
} from '@/components/Ui';
import {
  assignPermissionToRole,
  createRole,
  deleteRole,
  getRoles,
  removePermissionFromRole,
  updateRole
} from '@/lib/api';
import { ALL_PERMISSIONS } from '@/lib/constants';
import { formatPermission } from '@/lib/format';
import { useProfile } from '@/lib/hooks';
import { PermissionKey } from '@/lib/types';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const profile = useProfile().data;
  const permissions = profile?.permissions ?? [];
  const canManageRoles = permissions.includes('CAN_MANAGE_ROLES');
  const canManagePermissions = permissions.includes('CAN_MANAGE_PERMISSIONS');

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: Boolean(profile?.status === 'ACTIVE' && (canManageRoles || canManagePermissions))
  });

  const roles = rolesQuery.data ?? [];
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createState, setCreateState] = useState({ name: '', description: '', permissions: [] as PermissionKey[] });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, { name: string; description: string; permissions: PermissionKey[] }>>({});
  const [addPermissionDrafts, setAddPermissionDrafts] = useState<Record<string, PermissionKey | ''>>({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await invalidate();
      setMessage('Role created successfully.');
      setError('');
      setCreateState({ name: '', description: '', permissions: [] });
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: async () => {
      await invalidate();
      setMessage('Role updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await invalidate();
      setMessage('Role deleted.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const assignMutation = useMutation({
    mutationFn: assignPermissionToRole,
    onSuccess: async () => {
      await invalidate();
      setMessage('Permission assigned.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const removeMutation = useMutation({
    mutationFn: removePermissionFromRole,
    onSuccess: async () => {
      await invalidate();
      setMessage('Permission removed.');
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
      name: createState.name,
      description: createState.description || undefined,
      permissions: createState.permissions.map((permissionKey) => ({ permissionKey }))
    });
  };

  return (
    <AppFrame
      title="Role design"
      subtitle="Roles and permission bindings now run against the real RBAC endpoints, with create/update flows separated from direct permission assignment and removal."
    >
      <section className="stat-grid">
        <StatCard label="Role count" value={roles.length} meta="The role catalogue is fetched live from the backend." tone="sunrise" />
        <StatCard label="Manage roles" value={canManageRoles ? 'Yes' : 'No'} meta="Required for create, delete, and full role updates." tone="sea" />
        <StatCard label="Manage permissions" value={canManagePermissions ? 'Yes' : 'No'} meta="Required for direct permission add/remove actions." tone="gold" />
        <StatCard label="Permission catalog" value={ALL_PERMISSIONS.length} meta="The frontend uses the same canonical permission keys defined by the backend." tone="ink" />
      </section>

      {canManageRoles ? (
        <ActionDisclosure title="Create role" summary="Role creation is hidden until you need it, and the permission set is selected from the live canonical key list.">
          <form className="stack-list" onSubmit={handleCreate}>
            <div className="form-grid">
              <Field label="Role name" required>
                <TextInput value={createState.name} onChange={(event) => setCreateState((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Description">
                <TextInput value={createState.description} onChange={(event) => setCreateState((current) => ({ ...current, description: event.target.value }))} />
              </Field>
            </div>
            <div className="grid-2">
              {ALL_PERMISSIONS.map((permission) => (
                <label key={permission} className="subtle-card" style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={createState.permissions.includes(permission)}
                    onChange={(event) =>
                      setCreateState((current) => ({
                        ...current,
                        permissions: event.target.checked
                          ? [...current.permissions, permission]
                          : current.permissions.filter((item) => item !== permission)
                      }))
                    }
                  />
                  <span>{formatPermission(permission)}</span>
                </label>
              ))}
            </div>
            <div className="inline-actions">
              <button type="submit" className="button-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create role'}
              </button>
            </div>
          </form>
        </ActionDisclosure>
      ) : null}

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <SectionCard title="Role catalogue" eyebrow="RBAC" description="Each card shows the role definition and, when permitted, the controls for changing the permission set.">
        {roles.length ? (
          <div className="stack-list">
            {roles.map((role) => {
              const draft = roleDrafts[role.id] ?? {
                name: role.name,
                description: role.description ?? '',
                permissions: role.permissions.map((permission) => permission.key)
              };
              const addPermission = addPermissionDrafts[role.id] ?? '';

              return (
                <div key={role.id} className="list-card">
                  <div className="list-row">
                    <div>
                      <p className="eyebrow">Created {new Date(role.createdAt).toLocaleDateString()}</p>
                      <h3>{role.name}</h3>
                      <p>{role.description || 'No description provided.'}</p>
                    </div>
                    <div className="tag-list">
                      {role.permissions.map((permission) => (
                        <span key={permission.id} className="soft-chip">
                          {formatPermission(permission.key)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {canManageRoles ? (
                    <ActionDisclosure title="Edit role" summary="Manage the role definition and submit the full permission set through the role update endpoint.">
                      <form
                        className="stack-list"
                        onSubmit={(event) => {
                          event.preventDefault();
                          updateMutation.mutate({
                            id: role.id,
                            name: draft.name,
                            description: draft.description || null,
                            permissions: draft.permissions.map((permissionKey) => ({ permissionKey }))
                          });
                        }}
                      >
                        <div className="form-grid">
                          <Field label="Role name">
                            <TextInput value={draft.name} onChange={(event) => setRoleDrafts((current) => ({ ...current, [role.id]: { ...draft, name: event.target.value } }))} />
                          </Field>
                          <Field label="Description">
                            <TextInput value={draft.description} onChange={(event) => setRoleDrafts((current) => ({ ...current, [role.id]: { ...draft, description: event.target.value } }))} />
                          </Field>
                        </div>
                        <div className="grid-2">
                          {ALL_PERMISSIONS.map((permission) => (
                            <label key={`${role.id}-${permission}`} className="subtle-card" style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={draft.permissions.includes(permission)}
                                onChange={(event) =>
                                  setRoleDrafts((current) => ({
                                    ...current,
                                    [role.id]: {
                                      ...draft,
                                      permissions: event.target.checked
                                        ? [...draft.permissions, permission]
                                        : draft.permissions.filter((item) => item !== permission)
                                    }
                                  }))
                                }
                              />
                              <span>{formatPermission(permission)}</span>
                            </label>
                          ))}
                        </div>
                        <div className="inline-actions">
                          <button type="submit" className="button-secondary" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Saving...' : 'Save role'}
                          </button>
                          <button type="button" className="button-danger" onClick={() => deleteMutation.mutate(role.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete role'}
                          </button>
                        </div>
                      </form>
                    </ActionDisclosure>
                  ) : null}

                  {canManagePermissions ? (
                    <ActionDisclosure title="Permission actions" summary="Add or remove permissions directly using the dedicated permission endpoints.">
                      <div className="grid-2">
                        <div className="stack-card">
                          <Field label="Add permission">
                            <select
                              className="field-input"
                              value={addPermission}
                              onChange={(event) => setAddPermissionDrafts((current) => ({ ...current, [role.id]: event.target.value as PermissionKey }))}
                            >
                              <option value="">Select permission</option>
                              {ALL_PERMISSIONS.filter((permission) => !role.permissions.some((entry) => entry.key === permission)).map((permission) => (
                                <option key={permission} value={permission}>
                                  {formatPermission(permission)}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <button type="button" className="button-secondary" disabled={!addPermission} onClick={() => assignMutation.mutate({ id: role.id, permissionKey: addPermission as PermissionKey })}>
                            Add permission
                          </button>
                        </div>
                        <div className="stack-card">
                          <p className="eyebrow">Remove permission</p>
                          <div className="chip-list">
                            {role.permissions.map((permission) => (
                              <button
                                key={permission.id}
                                type="button"
                                className="button-ghost"
                                onClick={() => removeMutation.mutate({ id: role.id, permissionId: permission.id })}
                              >
                                Remove {formatPermission(permission.key)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ActionDisclosure>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No roles available" description="Create the first role or check that your account has access to the role catalogue." />
        )}
      </SectionCard>
    </AppFrame>
  );
}
