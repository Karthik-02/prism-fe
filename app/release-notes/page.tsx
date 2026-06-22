'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AppFrame } from '@/components/AppFrame';
import {
  EmptyState,
  Field,
  InlineMessage,
  SectionCard,
  StatCard,
  TextAreaInput,
  TextInput
} from '@/components/Ui';
import { RELEASE_NOTE_GUIDANCE, RELEASE_NOTE_TEMPLATE_SECTIONS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useFullReleaseNote, useFullReleaseNoteMutation, useProfile, useReleaseNote, useReleaseNoteMutation, useReleases } from '@/lib/hooks';
import { Release, ReleaseNote, ReleaseNoteSection } from '@/lib/types';

const EMPTY_RELEASES: Release[] = [];

function ReleaseNoteEditorCard({
  title,
  eyebrow,
  note,
  isLoading,
  onSave,
  isSaving,
  canSave,
  helperText
}: {
  title: string;
  eyebrow: string;
  note?: ReleaseNote;
  isLoading: boolean;
  onSave: (note: ReleaseNote) => void;
  isSaving: boolean;
  canSave: boolean;
  helperText: string;
}) {
  const [content, setContent] = useState('');
  const [sections, setSections] = useState<ReleaseNoteSection[]>([]);

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setSections(note.other);
    }
  }, [note]);

  const preview = useMemo(() => content || 'Start writing the release narrative here.', [content]);

  return (
    <SectionCard
      title={title}
      eyebrow={eyebrow}
      description={helperText}
      aside={note ? <span className="soft-chip">Version {note.version}</span> : null}
    >
      {note ? (
        <div className="grid-2">
          <div className="stack-list">
            <Field label="Markdown content">
              <TextAreaInput value={content} onChange={(event) => setContent(event.target.value)} />
            </Field>
            <div className="stack-list">
              {sections.map((section, index) => (
                <div key={`${section.title}-${index}`} className="note-card">
                  <Field label="Section title">
                    <TextInput
                      value={section.title}
                      onChange={(event) =>
                        setSections((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, title: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </Field>
                  <Field label="Section content">
                    <TextAreaInput
                      value={section.content}
                      onChange={(event) =>
                        setSections((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, content: event.target.value } : entry
                          )
                        )
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => setSections((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                  >
                    Remove section
                  </button>
                </div>
              ))}
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="button-ghost"
                onClick={() => setSections((current) => [...current, { title: 'Additional', content: '' }])}
              >
                Add section
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={isSaving || !canSave}
                onClick={() => note && onSave({ ...note, content, other: sections.filter((section) => section.content.trim()) })}
              >
                {isSaving ? 'Saving...' : 'Save notes'}
              </button>
            </div>
            <small>{note.updatedAt ? `Last updated ${formatDateTime(note.updatedAt)}` : 'Generated on demand from the backend.'}</small>
          </div>
          <div className="markdown-preview">
            <p className="eyebrow">Live preview</p>
            <ReactMarkdown>{preview}</ReactMarkdown>
          </div>
        </div>
      ) : isLoading ? (
        <p>Loading note...</p>
      ) : (
        <EmptyState title="Select a release" description="Choose a release to generate or load the corresponding note." />
      )}
    </SectionCard>
  );
}

export default function ReleaseNotesPage() {
  const profile = useProfile().data;
  const permissions = profile?.permissions ?? [];
  const canOwn = permissions.includes('CAN_GENERATE_OWN_RELEASE_NOTES');
  const canFull = permissions.includes('CAN_GENERATE_FULL_RELEASE_NOTES');

  const releasesQuery = useReleases(undefined, Boolean(profile?.status === 'ACTIVE' && (canOwn || canFull)));
  const releases = releasesQuery.data ?? EMPTY_RELEASES;
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedReleaseId && releases.length) {
      setSelectedReleaseId(releases[0].id);
    }
  }, [releases, selectedReleaseId]);

  const ownNoteQuery = useReleaseNote(selectedReleaseId, Boolean(selectedReleaseId && canOwn));
  const fullNoteQuery = useFullReleaseNote(selectedReleaseId, Boolean(selectedReleaseId && canFull));
  const ownMutation = useReleaseNoteMutation(selectedReleaseId);
  const fullMutation = useFullReleaseNoteMutation(selectedReleaseId);

  const selectedRelease = releases.find((release) => release.id === selectedReleaseId);

  return (
    <AppFrame
      title="Release notes"
      subtitle="Personal and consolidated notes now load from the same release list the backend exposes to contributors, with structured guidance taken from the release-note reference document."
    >
      <section className="stat-grid">
        <StatCard label="Visible releases" value={releases.length} meta="Release note authors now receive real release selection data from the API." tone="sunrise" />
        <StatCard label="Own note" value={ownNoteQuery.data?.version ?? 0} meta="Own notes are generated on demand and edited with optimistic version control." tone="sea" />
        <StatCard label="Full note" value={fullNoteQuery.data?.version ?? 0} meta="Full notes become available only when your permission set allows consolidated output." tone="gold" />
        <StatCard label="Selected release" value={selectedRelease?.environment ?? 'None'} meta={selectedRelease ? selectedRelease.name : 'Choose a release to start editing.'} tone="ink" />
      </section>

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <div className="grid-2">
        <SectionCard title="Release selector" eyebrow="Scope" description="Pick the release you are documenting before opening either editor.">
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
                    <span className="soft-chip">{release.prCount} PRs</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No releases available" description="You need at least one release record before PRism can generate structured release notes." />
          )}
        </SectionCard>

        <SectionCard title="Authoring guidance" eyebrow="Template" description="These prompts come from the release note structure document that ships with the repo.">
          <div className="stack-list">
            {RELEASE_NOTE_GUIDANCE.map((item) => (
              <div key={item} className="subtle-card">
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className="chip-list">
            {RELEASE_NOTE_TEMPLATE_SECTIONS.map((section) => (
              <span key={section} className="soft-chip">
                {section}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      {canOwn ? (
        <ReleaseNoteEditorCard
          title="My release note"
          eyebrow="Own scope"
          note={ownNoteQuery.data}
          isLoading={ownNoteQuery.isLoading}
          isSaving={ownMutation.isPending}
          canSave={Boolean(selectedReleaseId)}
          helperText="Document your own changes for the selected release. This note is scoped to the current user in the backend."
          onSave={(note) => {
            ownMutation.mutate(note, {
              onSuccess: () => {
                setMessage('Own release note saved.');
                setError('');
              },
              onError: (mutationError) => {
                setError((mutationError as Error).message);
                setMessage('');
              }
            });
          }}
        />
      ) : null}

      {canFull ? (
        <ReleaseNoteEditorCard
          title="Full release note"
          eyebrow="Full scope"
          note={fullNoteQuery.data}
          isLoading={fullNoteQuery.isLoading}
          isSaving={fullMutation.isPending}
          canSave={Boolean(selectedReleaseId)}
          helperText="Consolidate and polish the final release narrative once the individual inputs are ready."
          onSave={(note) => {
            fullMutation.mutate(note, {
              onSuccess: () => {
                setMessage('Full release note saved.');
                setError('');
              },
              onError: (mutationError) => {
                setError((mutationError as Error).message);
                setMessage('');
              }
            });
          }}
        />
      ) : null}
    </AppFrame>
  );
}
