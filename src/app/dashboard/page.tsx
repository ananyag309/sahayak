import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  BrainCircuit,
  ScanLine,
  LayoutTemplate,
  Mic,
  BookOpen,
  Gamepad2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const tools = [
    {
      title: 'AI Chat Assistant',
      description: 'Explain concepts with stories and analogies.',
      href: '/dashboard/chat',
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Textbook Scanner',
      description: 'Generate quizzes from textbook photos.',
      href: '/dashboard/scanner',
      icon: <ScanLine className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Diagram Generator',
      description: 'Create diagrams for any topic instantly.',
      href: '/dashboard/diagram',
      icon: <LayoutTemplate className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Reading Assessment',
      description: 'Analyze student reading fluency.',
      href: '/dashboard/reading',
      icon: <Mic className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Lesson Planner',
      description: 'Build weekly lesson plans with AI.',
      href: '/dashboard/planner',
      icon: <BookOpen className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Game Generator',
      description: 'Create fun, interactive learning games.',
      href: '/dashboard/games',
      icon: <Gamepad2 className="h-8 w-8 text-primary" />,
    },
    {
      title: 'Flashcard Creator',
      description: 'Generate printable flashcards for any subject.',
      href: '/dashboard/flashcards',
      icon: <Layers className="h-8 w-8 text-primary" />,
    },
  ];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Sahayak! Here are your AI-powered teaching tools.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <Card key={tool.title} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                {tool.icon}
                <CardTitle className="font-headline text-lg">{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{tool.description}</CardDescription>
            </CardContent>
            <div className="p-6 pt-0">
                <Button asChild variant="outline" className="w-full">
                    <Link href={tool.href}>
                        Open Tool <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
