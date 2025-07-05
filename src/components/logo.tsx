import Link from 'next/link';

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6.5 10a4.5 4.5 0 1 1 8.99 1.5L9.5 22" />
    <path d="m15 10-4.5 4.5" />
    <path d="m13 19 6-6" />
    <path d="m2 2 4.5 4.5" />
  </svg>
);

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Back to homepage">
      <LogoIcon className="h-6 w-6 text-primary" />
      <span className="text-lg font-bold">Sahayak</span>
    </Link>
  );
}
