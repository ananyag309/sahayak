import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';

export default function ReadingPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Reading Assessment</h1>
        <p className="text-muted-foreground">Analyze student reading fluency and pronunciation.</p>
      </header>
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Mic className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="font-headline">Coming Soon</CardTitle>
          <p className="text-muted-foreground mt-2">The Reading Assessment tool is currently under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
