"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateLessonPlan, type LessonPlanInput } from "@/ai/flows/lesson-planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  topics: z.string().min(5, { message: "Please list some topics." }),
});

export default function PlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", grade: "", topics: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    setIsLoading(true);
    setLessonPlan(null);
    try {
      const input: LessonPlanInput = values;
      const result = await generateLessonPlan(input);
      setLessonPlan(result.weeklyPlan);

      if (db) {
        await addDoc(collection(db, "lessonPlans"), {
          userId: user.uid,
          subject: values.subject,
          grade: values.grade,
          topics: values.topics,
          weekPlan: result.weeklyPlan,
          createdAt: serverTimestamp(),
        });
      }
      
      toast({ title: "Lesson plan generated and saved!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message || "Failed to generate lesson plan.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCopy = () => {
    if (!lessonPlan) return;
    navigator.clipboard.writeText(lessonPlan);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    if (!lessonPlan) return;
    const blob = new Blob([lessonPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lesson-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lesson Planner</h1>
          <p className="text-muted-foreground">Generate a weekly lesson plan with topics, activities, and materials.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl><Input placeholder="e.g., Science" {...field} /></FormControl>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a grade level" />
                          </SelectTrigger>
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
                <FormField
                  control={form.control}
                  name="topics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topics to Cover</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Photosynthesis, Cell Structure, Plant Life Cycle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Plan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Weekly Plan</h2>
          <p className="text-muted-foreground">Your lesson plan will appear below.</p>
        </header>
        <Card className="min-h-[500px] flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
                {isLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                {lessonPlan && (
                    <>
                        <div className="flex justify-end gap-2 mb-2">
                            <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload}><Download className="h-4 w-4" /></Button>
                        </div>
                        <ScrollArea className="flex-1 rounded-md border p-4 bg-muted">
                            <pre className="text-sm whitespace-pre-wrap font-sans">{lessonPlan}</pre>
                        </ScrollArea>
                    </>
                )}
                {!isLoading && !lessonPlan && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground text-center">Fill out the form to generate your lesson plan.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
