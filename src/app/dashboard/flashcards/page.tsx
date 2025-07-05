import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function FlashcardsPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Flashcard Creator</h1>
        <p className="text-muted-foreground">Generate word and image flashcards for any topic.</p>
      </header>
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Layers className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="font-headline">Coming Soon</CardTitle>
          <p className="text-muted-foreground mt-2">The Flashcard Creator tool is currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
