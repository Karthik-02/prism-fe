import Image from 'next/image';
import Link from 'next/link';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-lockup" aria-label="PRism home">
      <span className="brand-mark">
        <Image src="/assets/logo_full_b.png" alt="PRism" width={compact ? 126 : 152} height={compact ? 34 : 40} priority />
      </span>
      {!compact ? (
        <span className="brand-copy">
          <span className="eyebrow">Product release intelligence</span>
          <span className="brand-title">Clean workflows. Real backend state.</span>
        </span>
      ) : null}
    </Link>
  );
}
