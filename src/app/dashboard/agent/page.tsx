
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  runCurriculumAgent,
  CurriculumAgentInputSchema,
  type CurriculumAgentOutput,
} from "@/ai/flows/curriculum-agent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ListChecks, AlertTriangle, Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AgentPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CurriculumAgentOutput | null>(null);

  const form = useForm<z.infer<typeof CurriculumAgentInputSchema>>({
    resolver: zodResolver(CurriculumAgentInputSchema),
    defaultValues: {
      topic: "",
      grade: 5,
    },
  });

  async function onSubmit(values: z.infer<typeof CurriculumAgentInputSchema>) {
    setIsLoading(true);
    setAnalysis(null);

    try {
      const result = await runCurriculumAgent(values);
      setAnalysis(result);
      toast({ title: "Agent analysis complete!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Agent Failed",
        description: error.message || "The agent was unable to complete the analysis. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Curriculum Alignment Agent
          </h1>
          <p className="text-muted-foreground">
            Let the AI agent analyze your topic against curriculum standards.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Analyze a Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., The Water Cycle"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={String(field.value)}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(6)].map((_, i) => (
                            <SelectItem key={i + 1} value={`${i + 1}`}>
                              {`Grade ${i + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run Agent
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">
            Agent Analysis
          </h2>
          <p className="text-muted-foreground">
            The agent's findings will appear below.
          </p>
        </header>
        <Card className="min-h-[500px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                Agent is thinking...
              </p>
            </div>
          )}
          {!isLoading && !analysis && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Wand2 className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Enter a topic and grade to run the agent.
              </p>
            </div>
          )}
          {analysis && !isLoading && (
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/> Alignment Analysis</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{analysis.alignmentAnalysis}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500"/> Suggested Activities</h3>
                <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                    {analysis.suggestedActivities.map((activity, index) => (
                        <li key={index}>{activity}</li>
                    ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500"/> Identified Gaps</h3>
                 <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{analysis.gapsIdentified}</p>
              </div>

            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
