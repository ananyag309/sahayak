import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Back to homepage">
       <div className="p-2 bg-gradient-to-br from-primary via-purple-500 to-accent rounded-md shadow-sm">
         <BookOpen className="h-6 w-6 text-white" />
       </div>
      <div>
        <span className="text-xl font-bold text-primary">Sahayak</span>
        <p className="text-xs text-muted-foreground -mt-1">AI Teaching Assistant</p>
      </div>
    </Link>
  );
}
