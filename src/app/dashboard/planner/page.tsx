
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  generateLessonPlan,
  type LessonPlanInput,
  type LessonPlanOutput,
} from "@/ai/flows/lesson-planner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  subject: z.string().min(3, { message: "Subject must be at least 3 characters." }),
  grade: z.string().min(1, { message: "Please select a grade." }),
  topics: z.string().min(3, { message: "Topics are required." }),
  language: z.enum(["en", "hi", "mr", "ta"]),
});

type Plan = LessonPlanOutput['plan'];
type Tips = LessonPlanOutput['tips'];

export default function PlannerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tips, setTips] = useState<Tips | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      grade: "5",
      topics: "",
      language: "en",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPlan(null);
    setTips(null);

    try {
      const input: LessonPlanInput = values;
      const result = await generateLessonPlan(input);
      setPlan(result.plan);
      setTips(result.tips);
      toast({ title: "Lesson Plan Generated Successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lesson Plan Generation Failed",
        description: error.message || "The AI failed to generate a plan. Please try again.",
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
            Lesson Planner
          </h1>
          <p className="text-muted-foreground">
            Generate a structured weekly lesson plan with improvement tips.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Science, History"
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
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
                <FormField
                  control={form.control}
                  name="topics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topics to Cover</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Photosynthesis, Cell Structure"
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="mr">Marathi</SelectItem>
                          <SelectItem value="ta">Tamil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Plan
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <header className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight font-headline">
            Generated Weekly Plan
          </h2>
          <p className="text-muted-foreground">
            Your structured lesson plan will appear below.
          </p>
        </header>
        <Card className="min-h-[500px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                AI is planning your week...
              </p>
            </div>
          )}
          {!isLoading && !plan && (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-muted-foreground text-center">
                Fill out the form to generate a lesson plan.
              </p>
            </div>
          )}
          {!isLoading && plan && (
            <CardContent className="p-6 space-y-6">
              <div>
                <CardTitle>{plan.topic}</CardTitle>
                <CardDescription>
                  A 5-day lesson plan for {plan.subject}, Grade {plan.grade}.
                </CardDescription>
              </div>
              <Accordion type="single" collapsible defaultValue="day-0">
                {plan.days.map((day, index) => (
                  <AccordionItem key={day.day} value={`day-${index}`}>
                    <AccordionTrigger className="font-semibold text-left">
                      {day.day}: {day.topic}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {day.activities.map((activity, actIndex) => (
                        <div key={actIndex}>
                          <h4 className="font-medium">Activity: {activity.activity}</h4>
                          <p className="text-sm text-muted-foreground">
                            <strong>Materials:</strong> {activity.materials}
                          </p>
                        </div>
                      ))}
                      <div>
                         <h4 className="font-medium">Homework</h4>
                          <p className="text-sm text-muted-foreground">{day.homework}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {tips && tips.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-400"/>
                        Improvement Tips
                    </h3>
                    <ul className="space-y-2 list-disc list-inside text-sm text-muted-foreground">
                        {tips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
