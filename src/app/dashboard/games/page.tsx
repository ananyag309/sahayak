"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateGame, type GenerateGameInput, type GenerateGameOutput } from "@/ai/flows/game-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gamepad2, ArrowRight, CheckCircle, XCircle, Trophy } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic is required." }),
  grade: z.coerce.number().min(1).max(12),
});

type GameState = 'config' | 'playing' | 'finished';

export default function GamesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [game, setGame] = useState<GenerateGameOutput | null>(null);
  const [gameState, setGameState] = useState<GameState>('config');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "", grade: 4 },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGame(null);
    try {
      const result = await generateGame(values);
      setGame(result);
      setGameState('playing');
      if (db && user) {
        await addDoc(collection(db, "games"), {
            userId: user.uid,
            topic: values.topic,
            grade: values.grade,
            gameData: JSON.stringify(result),
            createdAt: serverTimestamp(),
        });
        toast({ title: "Game generated and saved!" });
      } else {
        toast({ title: "Game generated!" });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message || "Failed to generate game.",
      });
      setGameState('config');
    } finally {
      setIsLoading(false);
    }
  }

  const handleAnswer = (answerIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    if (game && answerIndex === game.questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!game) return;
    if (currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setGameState('finished');
    }
  };

  const handleRestart = () => {
    setGameState('config');
    setGame(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    form.reset();
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
            <p className="text-lg text-muted-foreground">Generating your awesome game...</p>
        </div>
    )
  }

  if (gameState === 'playing' && game) {
    const question = game.questions[currentQuestionIndex];
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <Card className="shadow-2xl">
                <CardHeader className="text-center">
                    <p className="font-semibold text-primary">{game.theme}</p>
                    <CardTitle className="text-4xl font-bold font-headline">{game.title}</CardTitle>
                    <CardDescription>{game.instructions}</CardDescription>
                    <div className="pt-2">
                        <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {game.questions.length} | Score: {score}</p>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <p className="text-xl font-semibold text-center">{question.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        {question.options.map((option, index) => {
                            const isCorrect = index === question.correctAnswerIndex;
                            const isSelected = index === selectedAnswer;
                            return (
                                <Button
                                    key={index}
                                    variant={isAnswered && (isCorrect || isSelected) ? "default" : "outline"}
                                    size="lg"
                                    className={cn(
                                        "h-auto py-4 justify-start text-left whitespace-normal",
                                        isAnswered && isCorrect && "bg-green-500 hover:bg-green-600 border-green-600",
                                        isAnswered && isSelected && !isCorrect && "bg-destructive hover:bg-destructive/90 border-destructive/90"
                                    )}
                                    onClick={() => handleAnswer(index)}
                                >
                                    {isAnswered && isCorrect && <CheckCircle className="mr-3 h-5 w-5"/>}
                                    {isAnswered && isSelected && !isCorrect && <XCircle className="mr-3 h-5 w-5"/>}
                                    {option}
                                </Button>
                            )
                        })}
                    </div>
                    {isAnswered && (
                        <Button onClick={handleNextQuestion} size="lg">
                            {currentQuestionIndex < game.questions.length - 1 ? 'Next Question' : 'Finish Game'}
                            <ArrowRight className="ml-2 h-5 w-5"/>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
  }

  if (gameState === 'finished' && game) {
     return (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <Card className="shadow-2xl">
                <CardHeader>
                    <Trophy className="h-16 w-16 mx-auto text-yellow-400"/>
                    <CardTitle className="text-4xl font-bold font-headline">Game Over!</CardTitle>
                    <CardDescription>You completed the "{game.title}" challenge!</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-2xl font-bold">Final Score: {score} / {game.questions.length}</p>
                    <p className="text-lg text-muted-foreground">{score > game.questions.length / 2 ? "Great job!" : "Better luck next time!"}</p>
                    <Button onClick={handleRestart} size="lg">Play Again</Button>
                </CardContent>
            </Card>
        </motion.div>
     )
  }

  return (
    <div>
        <header className="mb-4 text-center max-w-2xl mx-auto">
          <Gamepad2 className="h-12 w-12 mx-auto text-primary mb-2"/>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Game Generator</h1>
          <p className="text-muted-foreground">Create fun, interactive quizzes for any topic. Let's make learning an adventure!</p>
        </header>
        <Card className="max-w-xl mx-auto">
          <CardHeader><CardTitle>Game Setup</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl><Input placeholder="e.g., Indian States and Capitals" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={`${i + 1}`}>{`Grade ${i + 1}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" size="lg">
                  Generate Game
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
  );
}
