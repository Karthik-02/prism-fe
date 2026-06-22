'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  addPrToRelease,
  createRelease,
  deleteRelease,
  removePrFromRelease,
  setReleaseDate,
  updateRelease
} from '@/lib/api';
import { RELEASE_ENVIRONMENT_OPTIONS, RELEASE_STATUS_OPTIONS } from '@/lib/constants';
import { formatDateTime, formatName, fromInputDateTime, includesAnyPermission, toInputDateTime } from '@/lib/format';
import { useProfile, useReleaseDetail, useReleases } from '@/lib/hooks';
import { Release } from '@/lib/types';

const EMPTY_RELEASES: Release[] = [];

const statusTone = (status: string): StatusTone => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'SCHEDULED') return 'info';
  return 'warning';
};

export default function ReleasesPage() {
  const queryClient = useQueryClient();
  const profile = useProfile().data;
  const permissions = profile?.permissions ?? [];
  const canManage = permissions.includes('CAN_MANAGE_RELEASE');
  const canSetDate = permissions.includes('CAN_SET_PROD_RELEASE_DATE');

  const releasesQuery = useReleases(undefined, Boolean(profile?.status === 'ACTIVE' && includesAnyPermission(permissions, ['CAN_MANAGE_RELEASE', 'CAN_SET_PROD_RELEASE_DATE'])));
  const releases = releasesQuery.data ?? EMPTY_RELEASES;
  const [selectedReleaseId, setSelectedReleaseId] = useState('');

  useEffect(() => {
    if (!selectedReleaseId && releases.length) {
      setSelectedReleaseId(releases[0].id);
    }
  }, [releases, selectedReleaseId]);

  const detailQuery = useReleaseDetail(selectedReleaseId, Boolean(selectedReleaseId));
  const detail = detailQuery.data;

  const [createState, setCreateState] = useState({
    environment: 'STAGING' as Release['environment'],
    name: '',
    status: 'CREATED' as Release['status'],
    cutoffAt: '',
    releaseDate: ''
  });
  const [updateState, setUpdateState] = useState({ name: '', status: 'CREATED' as Release['status'], cutoffAt: '' });
  const [prodDate, setProdDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (detail) {
      setUpdateState({
        name: detail.name,
        status: detail.status,
        cutoffAt: toInputDateTime(detail.cutoffAt)
      });
      setProdDate(toInputDateTime(detail.releaseDate));
    }
  }, [detail]);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['releases'] }),
      queryClient.invalidateQueries({ queryKey: ['release-detail', selectedReleaseId] })
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createRelease,
    onSuccess: async (release) => {
      await queryClient.invalidateQueries({ queryKey: ['releases'] });
      setSelectedReleaseId(release.id);
      setMessage('Release created successfully.');
      setError('');
      setCreateState({ environment: 'STAGING', name: '', status: 'CREATED', cutoffAt: '', releaseDate: '' });
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateRelease,
    onSuccess: async () => {
      await invalidate();
      setMessage('Release updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const dateMutation = useMutation({
    mutationFn: setReleaseDate,
    onSuccess: async () => {
      await invalidate();
      setMessage('Production date updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRelease,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['releases'] });
      setSelectedReleaseId('');
      setMessage('Release deleted.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const addMutation = useMutation({
    mutationFn: addPrToRelease,
    onSuccess: async () => {
      await invalidate();
      setMessage('PR linked to release.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const removeMutation = useMutation({
    mutationFn: removePrFromRelease,
    onSuccess: async () => {
      await invalidate();
      setMessage('PR removed from release.');
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
      environment: createState.environment,
      name: createState.name,
      status: createState.status,
      cutoffAt: fromInputDateTime(createState.cutoffAt) as string,
      releaseDate: fromInputDateTime(createState.releaseDate)
    });
  };

  return (
    <AppFrame
      title="Release workspace"
      subtitle="Selected-release detail, eligible PRs, and release metadata now come directly from the backend instead of requiring you to type IDs into detached forms."
    >
      <section className="stat-grid">
        <StatCard label="Total releases" value={releases.length} meta="Staging, production, and UAT windows from `GET /releases`." tone="sunrise" />
        <StatCard label="Linked PRs" value={detail?.linkedPrs.length ?? 0} meta="The selected release now exposes mapping detail through the backend." tone="sea" />
        <StatCard label="Eligible PRs" value={detail?.eligiblePrs.length ?? 0} meta="Candidates are evaluated using release-specific rules in the API." tone="gold" />
        <StatCard label="Auto-linked" value={detail?.autoLinkedCount ?? 0} meta="Auto and manual mappings are separated in the release detail response." tone="ink" />
      </section>

      {canManage ? (
        <ActionDisclosure title="Create release" summary="New release creation is collapsed by default and validates the fields the backend actually requires, including cutoff time.">
          <form className="form-grid" onSubmit={handleCreate}>
            <Field label="Environment" required>
              <SelectInput value={createState.environment} onChange={(event) => setCreateState((current) => ({ ...current, environment: event.target.value as Release['environment'] }))}>
                {RELEASE_ENVIRONMENT_OPTIONS.map((environment) => (
                  <option key={environment} value={environment}>
                    {environment}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status" required>
              <SelectInput value={createState.status} onChange={(event) => setCreateState((current) => ({ ...current, status: event.target.value as Release['status'] }))}>
                {RELEASE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Release name" required>
              <TextInput value={createState.name} onChange={(event) => setCreateState((current) => ({ ...current, name: event.target.value }))} required />
            </Field>
            <Field label="Cutoff time" required>
              <TextInput type="datetime-local" value={createState.cutoffAt} onChange={(event) => setCreateState((current) => ({ ...current, cutoffAt: event.target.value }))} required />
            </Field>
            <Field label="Release date">
              <TextInput type="datetime-local" value={createState.releaseDate} onChange={(event) => setCreateState((current) => ({ ...current, releaseDate: event.target.value }))} />
            </Field>
            <div className="inline-actions" style={{ alignItems: 'end' }}>
              <button type="submit" className="button-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create release'}
              </button>
            </div>
          </form>
        </ActionDisclosure>
      ) : null}

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <div className="grid-2">
        <SectionCard title="Release list" eyebrow="Windows" description="Choose a release to inspect its metadata, linked PRs, and eligible candidates.">
          {releases.length ? (
            <div className="stack-list">
              {releases.map((release) => (
                <button
                  key={release.id}
                  type="button"
                  className="list-card"
                  onClick={() => setSelectedReleaseId(release.id)}
                  style={{ textAlign: 'left', borderColor: release.id === selectedReleaseId ? 'rgba(255, 106, 61, 0.35)' : undefined }}
                >
                  <div className="list-row">
                    <div>
                      <p className="eyebrow">{release.environment}</p>
                      <h3>{release.name}</h3>
                      <p>
                        Cutoff {formatDateTime(release.cutoffAt)} · Release {formatDateTime(release.releaseDate)}
                      </p>
                    </div>
                    <div className="tag-list">
                      <StatusBadge tone={statusTone(release.status)}>{release.status}</StatusBadge>
                      <span className="soft-chip">{release.prCount} PRs</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No releases yet" description="Create the first release window to start mapping approved PRs into staging or production." />
          )}
        </SectionCard>

        <SectionCard title="Selected release" eyebrow="Detail" description="Backend detail now includes linked PRs and eligible PRs, so every action stays in context.">
          {detail ? (
            <>
              <div className="key-value-grid">
                <div>
                  <span className="eyebrow">Name</span>
                  <strong>{detail.name}</strong>
                </div>
                <div>
                  <span className="eyebrow">Environment</span>
                  <strong>{detail.environment}</strong>
                </div>
                <div>
                  <span className="eyebrow">Cutoff</span>
                  <strong>{formatDateTime(detail.cutoffAt)}</strong>
                </div>
                <div>
                  <span className="eyebrow">Release date</span>
                  <strong>{formatDateTime(detail.releaseDate)}</strong>
                </div>
              </div>

              {canManage ? (
                <ActionDisclosure title="Update release" summary="Change the name, status, or cutoff without leaving the selected release context.">
                  <form
                    className="form-grid"
                    onSubmit={(event) => {
                      event.preventDefault();
                      updateMutation.mutate({
                        id: detail.id,
                        name: updateState.name,
                        status: updateState.status,
                        cutoffAt: fromInputDateTime(updateState.cutoffAt)
                      });
                    }}
                  >
                    <Field label="Release name">
                      <TextInput value={updateState.name} onChange={(event) => setUpdateState((current) => ({ ...current, name: event.target.value }))} />
                    </Field>
                    <Field label="Status">
                      <SelectInput value={updateState.status} onChange={(event) => setUpdateState((current) => ({ ...current, status: event.target.value as Release['status'] }))}>
                        {RELEASE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                    <Field label="Cutoff">
                      <TextInput type="datetime-local" value={updateState.cutoffAt} onChange={(event) => setUpdateState((current) => ({ ...current, cutoffAt: event.target.value }))} />
                    </Field>
                    <div className="inline-actions" style={{ alignItems: 'end' }}>
                      <button type="submit" className="button-secondary" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Saving...' : 'Save release'}
                      </button>
                      <button type="button" className="button-danger" onClick={() => deleteMutation.mutate(detail.id)} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete release'}
                      </button>
                    </div>
                  </form>
                </ActionDisclosure>
              ) : null}

              {canSetDate && detail.environment === 'PRODUCTION' ? (
                <ActionDisclosure title="Set production date" summary="Production schedules stay separate so date updates are permission-gated without reopening the whole release form.">
                  <form
                    className="form-grid"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!prodDate) return;
                      dateMutation.mutate({ id: detail.id, releaseDate: fromInputDateTime(prodDate) as string });
                    }}
                  >
                    <Field label="Production date">
                      <TextInput type="datetime-local" value={prodDate} onChange={(event) => setProdDate(event.target.value)} />
                    </Field>
                    <div className="inline-actions" style={{ alignItems: 'end' }}>
                      <button type="submit" className="button-secondary" disabled={dateMutation.isPending || !prodDate}>
                        {dateMutation.isPending ? 'Saving...' : 'Update date'}
                      </button>
                    </div>
                  </form>
                </ActionDisclosure>
              ) : null}
            </>
          ) : (
            <EmptyState title="Select a release" description="Choose a release from the list to load linked PRs and eligible candidates from the new detail endpoint." />
          )}
        </SectionCard>
      </div>

      {detail ? (
        <div className="grid-2">
          <SectionCard title="Linked PRs" eyebrow="Mapped" description="These PRs are already part of the selected release.">
            {detail.linkedPrs.length ? (
              <div className="stack-list">
                {detail.linkedPrs.map((mapping) => (
                  <div key={`${mapping.prId}-${mapping.linkedAt}`} className="subtle-card">
                    <div className="list-row">
                      <div>
                        <h3>{mapping.pr.repo}</h3>
                        <p>
                          {mapping.pr.branch} · {mapping.source} · owner {formatName(mapping.pr.owner)}
                        </p>
                      </div>
                      <div className="tag-list">
                        <StatusBadge tone={statusTone(mapping.pr.status)}>{mapping.pr.status}</StatusBadge>
                        {canManage ? (
                          <button type="button" className="button-ghost" onClick={() => removeMutation.mutate({ id: detail.id, prId: mapping.prId })}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No PRs linked yet" description="Use the eligible list to map approved or deployed PRs into this release." />
            )}
          </SectionCard>

          <SectionCard title="Eligible PRs" eyebrow="Candidates" description="The backend precomputes which PRs can be added to the selected release based on environment rules.">
            {detail.eligiblePrs.length ? (
              <div className="stack-list">
                {detail.eligiblePrs.map((pr) => (
                  <div key={pr.id} className="subtle-card">
                    <div className="list-row">
                      <div>
                        <h3>{pr.repo}</h3>
                        <p>
                          {pr.branch} · owner {formatName(pr.owner)} · reviewer {pr.reviewer ? formatName(pr.reviewer) : 'Unassigned'}
                        </p>
                      </div>
                      <div className="tag-list">
                        <StatusBadge tone={statusTone(pr.status)}>{pr.status}</StatusBadge>
                        <span className="soft-chip">{pr.releaseMode}</span>
                        {canManage ? (
                          <button type="button" className="button-secondary" onClick={() => addMutation.mutate({ id: detail.id, prId: pr.id })}>
                            Add PR
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No eligible PRs right now" description="The release detail endpoint has no candidates that satisfy the current environment rules." />
            )}
          </SectionCard>
        </div>
      ) : null}
    </AppFrame>
  );
}
