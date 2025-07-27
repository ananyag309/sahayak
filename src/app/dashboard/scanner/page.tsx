
"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { textbookScanner, type TextbookScannerOutput, type TextbookScannerInput } from "@/ai/flows/textbook-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  photo: z.any().refine(file => file?.length == 1, "Please upload a photo."),
  curriculum: z.string({ required_error: "Please select a curriculum." }),
});

export default function ScannerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<TextbookScannerOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      curriculum: "NCERT",
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults(null);
    try {
      const file = values.photo[0];
      const photoDataUri = await toDataUri(file);
      const input: TextbookScannerInput = { 
        photoDataUri, 
        curriculum: values.curriculum,
      };
      const result = await textbookScanner(input);
      setResults(result);
      toast({ title: "Questions generated!" });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Question Generation Failed",
        description: error.message || "The AI was unable to generate questions from this image. Please try a clearer image or a different page.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Textbook Scanner</h1>
          <p className="text-muted-foreground">Upload a photo of a textbook page. The AI will auto-detect the language and generate a worksheet.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Upload Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Textbook Photo</FormLabel>
                      <FormControl>
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="dropzone-file" className={cn("flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-muted hover:bg-muted/80", "cursor-pointer")}>
                            {preview ? (
                                <Image src={preview} alt="Preview" width={200} height={200} className="object-contain h-full p-2" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                                </div>
                            )}
                            <Input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp"
                                disabled={isLoading}
                                onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handleFileChange(e);
                                }}
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="curriculum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curriculum Board</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a board" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NCERT">NCERT</SelectItem>
                          <SelectItem value="State Board">State Board (Generic)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Questions"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <header>
            <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Worksheet</h2>
            <p className="text-muted-foreground">Results from the AI will appear here.</p>
        </header>
        <div className="flex-1">
        {isLoading ? (
            <Card className="min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                    <p className="text-muted-foreground">Scanning and generating questions...<br/>This can take up to a minute.</p>
                </div>
            </Card>
        ) : results ? (
            <>
            <Card className="mb-4">
              <CardHeader>
                  <CardTitle>Curriculum Alignment</CardTitle>
                  <CardDescription>Based on the {form.getValues('curriculum')} curriculum for the auto-detected grade.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                  <div>
                      <h4 className="font-semibold">Identified Language:</h4>
                      <p className="text-muted-foreground">{results.identifiedLanguage}</p>
                  </div>
                   <div>
                      <h4 className="font-semibold">Identified Grade Level:</h4>
                      <p className="text-muted-foreground">{results.identifiedGradeLevel}</p>
                  </div>
                  <div>
                      <h4 className="font-semibold">Sub-Topic:</h4>
                      <p className="text-muted-foreground">{results.subTopic}</p>
                  </div>
                  <div>
                      <h4 className="font-semibold">Learning Objectives:</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{results.learningObjectives}</p>
                  </div>
              </CardContent>
            </Card>

            <Card>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full" defaultValue="mcq">
                    {results.mcqQuestions?.length > 0 && (
                        <AccordionItem value="mcq">
                            <AccordionTrigger className="px-6">Multiple Choice Questions ({results.mcqQuestions.length})</AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <ul className="space-y-2 list-decimal list-inside">
                                    {results.mcqQuestions.map((q, i) => <li key={`mcq-screen-${i}`}>{q}</li>)}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                     {results.shortAnswerQuestions?.length > 0 && (
                        <AccordionItem value="short-answer">
                            <AccordionTrigger className="px-6">Short Answer ({results.shortAnswerQuestions.length})</AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <ul className="space-y-2 list-decimal list-inside">
                                    {results.shortAnswerQuestions.map((q, i) => <li key={`sa-screen-${i}`}>{q}</li>)}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    {results.fillInTheBlankQuestions?.length > 0 && (
                        <AccordionItem value="fill-in-the-blank">
                            <AccordionTrigger className="px-6">Fill in the Blank ({results.fillInTheBlankQuestions.length})</AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <ul className="space-y-2 list-decimal list-inside">
                                    {results.fillInTheBlankQuestions.map((q, i) => <li key={`fib-screen-${i}`}>{q}</li>)}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    {results.matchTheColumnQuestions?.length > 0 && (
                        <AccordionItem value="match-the-column">
                            <AccordionTrigger className="px-6">Match the Column ({results.matchTheColumnQuestions.length})</AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <table className="w-full text-left">
                                    <thead>
                                    <tr>
                                        <th className="p-2 border-b font-semibold">Term</th>
                                        <th className="p-2 border-b font-semibold">Definition</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {results.matchTheColumnQuestions.map((pair, i) => (
                                        <tr key={`match-pair-${i}`}>
                                            <td className="p-2 border-b align-top">{pair.term}</td>
                                            <td className="p-2 border-b align-top">{pair.definition}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </CardContent>
            </Card>
            </>
        ) : (
            <Card className="min-h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground text-center p-4">
                    Upload an image to generate questions.
                </p>
            </Card>
        )}
        </div>
      </div>
    </div>
  );
}
