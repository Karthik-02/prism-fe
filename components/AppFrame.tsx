'use client';

import Link from 'next/link';
import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { BrandLogo } from '@/components/BrandLogo';
import { NAV_ITEMS } from '@/lib/constants';
import { logout } from '@/lib/api';
import { useProfile } from '@/lib/hooks';
import { formatPermission, includesAnyPermission } from '@/lib/format';

interface AppFrameProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AppFrame({ title, subtitle, actions, children }: AppFrameProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const profileQuery = useProfile();

  const logoutMutation = useMutation({
    mutationFn: () => logout('CURRENT_SESSION'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/login');
    }
  });

  const unauthorized =
    profileQuery.isError && (profileQuery.error as { status?: number } | undefined)?.status === 401;

  const profile = profileQuery.data;
  const navItems = useMemo(() => {
    if (!profile) {
      return [];
    }

    return NAV_ITEMS.filter((item) => {
      if (item.activeOnly && profile.status !== 'ACTIVE') {
        return item.href === '/profile';
      }

      if (!item.permissions?.length) {
        return true;
      }

      return includesAnyPermission(profile.permissions, item.permissions);
    });
  }, [profile]);

  if (profileQuery.isLoading) {
    return (
      <main className="workspace-shell">
        <div className="workspace-loading panel-surface">
          <p className="eyebrow">Loading workspace</p>
          <h1>Connecting to PRism.</h1>
          <p>Resolving your session, permissions, and current operating context.</p>
        </div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="workspace-shell">
        <section className="hero-card panel-surface auth-gate">
          <BrandLogo />
          <div className="hero-copy">
            <p className="eyebrow">Authentication required</p>
            <h1>Sign in to access the PRism workspace.</h1>
            <p>
              OTP login and session cookies are enforced by the backend. Use the login flow to establish a valid
              session before returning here.
            </p>
          </div>
          <div className="hero-actions">
            <Link href="/login" className="button-primary">
              Open login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="workspace-root">
      <header className="topbar-shell">
        <div className="topbar">
          <BrandLogo />
          <nav className="topbar-nav" aria-label="Primary">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx('nav-chip', active && 'nav-chip-active')}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </Link>
              );
            })}
          </nav>
          <div className="topbar-profile">
            {profile ? (
              <>
                <div className="identity-card">
                  <span className="eyebrow">Signed in</span>
                  <strong>
                    {profile.firstName} {profile.lastName}
                  </strong>
                  <span>{profile.status}</span>
                </div>
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="workspace-shell">
        {profile && profile.status !== 'ACTIVE' ? (
          <section className="status-banner panel-surface">
            <div>
              <p className="eyebrow">Limited access</p>
              <strong>{profile.status.replaceAll('_', ' ')}</strong>
            </div>
            <p>
              Your account can access profile management, but operational workflows remain locked until an authorized
              verifier reactivates your session scope.
            </p>
          </section>
        ) : null}

        <section className="page-intro">
          <div>
            <p className="eyebrow">PRism workspace</p>
            <h1>{title}</h1>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
          <div className="page-sidecar">
            {actions}
            {profile ? (
              <div className="permission-cluster">
                {profile.permissions.slice(0, 3).map((permission) => (
                  <span key={permission} className="mini-chip">
                    {formatPermission(permission)}
                  </span>
                ))}
                {profile.permissions.length > 3 ? (
                  <Link href="/profile" className="mini-link">
                    +{profile.permissions.length - 3} more
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className="page-stack">{children}</div>
      </main>
    </div>
  );
}
