"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { textbookScanner, type TextbookScannerInput, type TextbookScannerOutput } from "@/ai/flows/textbook-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/components/auth-provider";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  photo: z.any().refine(file => file?.length == 1, "Please upload a photo."),
  gradeLevel: z.string().min(1, { message: "Please select a grade level." }),
});

export default function ScannerPage() {
  const { user, isDemoMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<TextbookScannerOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to use this feature." });
        return;
    }
    setIsLoading(true);
    setResults(null);
    try {
      const file = values.photo[0];
      const photoDataUri = await toDataUri(file);
      const input: TextbookScannerInput = { 
        photoDataUri, 
        gradeLevel: values.gradeLevel 
      };
      const result = await textbookScanner(input);
      setResults(result);

      if (!isDemoMode && storage && db) {
        const storageRef = ref(storage, `textbookUploads/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        await addDoc(collection(db, "worksheets"), {
            userId: user.uid,
            imageURL: imageUrl,
            resultText: JSON.stringify(result),
            grade: values.gradeLevel,
            createdAt: serverTimestamp(),
        });
        toast({ title: "Questions generated and saved!" });
      } else {
        toast({ title: "Questions generated!" });
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message || "Failed to generate questions.",
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
          <p className="text-muted-foreground">Upload a photo of a textbook page to generate questions.</p>
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
                  name="gradeLevel"
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
          <h2 className="text-2xl font-bold tracking-tight font-headline">Generated Questions</h2>
          <p className="text-muted-foreground">Results from the AI will appear here.</p>
        </header>
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : results ? (
            <Card>
              <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full" defaultValue="mcq">
                      <AccordionItem value="mcq">
                          <AccordionTrigger className="px-6">Multiple Choice Questions ({results.mcqQuestions.length})</AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                              <ul className="space-y-2 list-decimal list-inside">
                                  {results.mcqQuestions.map((q, i) => <li key={i}>{q}</li>)}
                              </ul>
                          </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="fill-in-the-blank">
                          <AccordionTrigger className="px-6">Fill in the Blank ({results.fillInTheBlankQuestions.length})</AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                              <ul className="space-y-2 list-decimal list-inside">
                                  {results.fillInTheBlankQuestions.map((q, i) => <li key={i}>{q}</li>)}
                              </ul>
                          </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="match-the-column">
                          <AccordionTrigger className="px-6">Match the Column ({results.matchTheColumnQuestions.length})</AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                              <ul className="space-y-2 list-decimal list-inside">
                                  {results.matchTheColumnQuestions.map((q, i) => <li key={i}>{q}</li>)}
                              </ul>
                          </AccordionContent>
                      </AccordionItem>
                  </Accordion>
              </CardContent>
            </Card>
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
