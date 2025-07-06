
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  subject: z.string().min(2, { message: "Subject is required." }),
  grade: z.string().min(1, { message: "Grade is required." }),
  topics: z.string().min(5, { message: "Please list some topics." }),
  language: z.enum(["en", "hi", "mr", "ta"]),
});

export default function PlannerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", grade: "", topics: "", language: "en"},
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    toast({ title: "Generating plan... (functionality currently disabled)" });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lesson Planner</h1>
          <p className="text-muted-foreground">Generate a structured weekly lesson plan.</p>
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
                      <FormControl><Input placeholder="e.g., Science" {...field} disabled={isLoading} /></FormControl>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </Trigger>
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
                <FormField
                  control={form.control}
                  name="topics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topics to Cover</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Photosynthesis, Cell Structure, Plant Life Cycle" {...field} disabled={isLoading} />
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
          <p className="text-muted-foreground">Your structured lesson plan will appear below.</p>
        </header>
        <div className="space-y-4">
          {isLoading && (
              <Card className="min-h-[500px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary"/>
              </Card>
          )}

          {!isLoading && (
              <Card className="min-h-[500px] flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                      Fill out the form to generate your lesson plan.
                  </p>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
