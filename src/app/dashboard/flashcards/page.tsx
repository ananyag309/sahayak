"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateFlashcards, generateFlashcardImage } from "@/ai/flows/flashcard-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FlipHorizontal, Printer, AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const formSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }),
  grade: z.string().min(1, { message: "Please select a grade level." }),
});

type CardData = {
  term: string;
  definition: string;
  imagePrompt: string;
};

type CardState = CardData & {
  imageUrl?: string | null; // undefined: loading, null: failed, string: success
  isFlipped: boolean;
};

export default function FlashcardsPage() {
  const { toast } = useToast();
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [cards, setCards] = useState<CardState[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "", grade: "4" },
  });
  
  const generateCardImages = async (generatedCards: CardState[]) => {
    await Promise.all(generatedCards.map(async (card, index) => {
        try {
            const result = await generateFlashcardImage({ imagePrompt: card.imagePrompt });
            if (result.imageUrl) {
                setCards(prev => {
                    const newCards = [...prev];
                    if (newCards[index]) newCards[index].imageUrl = result.imageUrl;
                    return newCards;
                });
            } else {
                 throw new Error("No media URL returned");
            }
        } catch (imgError) {
            console.error(`Image generation failed for: ${card.term}`, imgError);
            setCards(prev => {
                const newCards = [...prev];
                if (newCards[index]) newCards[index].imageUrl = null; // Mark as failed
                return newCards;
            });
        }
    }));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGeneratingText(true);
    setCards([]);
    try {
      const result = await generateFlashcards(values);
      const initialCards = result.cards.map(c => ({ ...c, isFlipped: false, imageUrl: undefined }));
      setCards(initialCards);
      
      toast({ title: "Flashcards created!", description: "Generating images in the background..." });

      await generateCardImages(initialCards);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Flashcard Generation Failed",
        description: error.message || "The AI was unable to generate flashcards for this topic.",
      });
    } finally {
        setIsGeneratingText(false);
    }
  }

  const handleFlip = (index: number) => {
    setCards(prev => {
      const newCards = [...prev];
      newCards[index].isFlipped = !newCards[index].isFlipped;
      return newCards;
    });
  };

  const handlePrint = () => {
    window.print();
  }
  
  const isLoading = isGeneratingText || (cards.length > 0 && cards.some(c => c.imageUrl === undefined));


  return (
    <div className="flex flex-col gap-8">
       <div className="no-print">
         <header className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Flashcard Creator</h1>
            <p className="text-muted-foreground">Generate flippable and printable flashcards for any topic.</p>
         </header>
         <Card>
            <CardHeader><CardTitle>Create Flashcards</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="topic" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl><Input placeholder="e.g., Solar System Planets" {...field} disabled={isGeneratingText} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="grade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGeneratingText}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{[...Array(12)].map((_, i) => (<SelectItem key={i + 1} value={`${i + 1}`}>{`Grade ${i + 1}`}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="sm:pt-8">
                    <Button type="submit" className="w-full" disabled={isGeneratingText}>
                        {isGeneratingText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Flashcards"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
         </Card>
       </div>

        {isGeneratingText && (
            <div className="text-center p-8">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Generating flashcard text... this should be quick.</p>
            </div>
        )}

       {cards.length > 0 && (
        <>
            <div className="flex justify-end no-print">
                <Button onClick={handlePrint} disabled={isLoading}><Printer className="mr-2 h-4 w-4" /> {isLoading ? "Generating Images..." : "Print Flashcards"}</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 flashcard-print-container">
              <AnimatePresence>
                {cards.map((card, index) => (
                  <div key={card.term} className="perspective-1000 flashcard-print-item">
                    <motion.div
                      className="relative w-full h-56 transform-style-3d transition-transform duration-700"
                      animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                    >
                      {/* Front of Card */}
                      <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 rounded-lg border bg-card shadow-md">
                        <h3 className="text-xl font-bold text-center">{card.term}</h3>
                        <Button size="icon" variant="ghost" className="absolute bottom-2 right-2 h-8 w-8 no-print" onClick={() => handleFlip(index)} aria-label="Flip card">
                          <FlipHorizontal className="h-5 w-5" />
                        </Button>
                      </div>
                      {/* Back of Card */}
                      <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-4 rounded-lg border bg-card shadow-md rotate-y-180">
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                            {card.imageUrl === undefined && ( // Still loading
                                <div className="h-[80px] w-[80px] flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            )}
                            {card.imageUrl && ( // Load successful
                                <Image src={card.imageUrl} alt={card.term} width={80} height={80} className="rounded-md" />
                            )}
                             {card.imageUrl === null && ( // Load failed
                                <div className="h-[80px] w-[80px] flex flex-col items-center justify-center text-destructive">
                                  <AlertTriangle className="h-6 w-6" />
                                  <span className="text-xs mt-1">Error</span>
                                </div>
                            )}
                            <p className="text-sm">{card.definition}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="absolute bottom-2 right-2 h-8 w-8 no-print" onClick={() => handleFlip(index)} aria-label="Flip card">
                          <FlipHorizontal className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
        </>
       )}
    </div>
  );
}
