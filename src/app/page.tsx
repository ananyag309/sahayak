"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { BookOpen, Globe, Sparkles, Users } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Globe className="w-8 h-8 text-purple-600" />,
      title: "Multilingual Support",
      description: "Works in Hindi, English, Marathi, Tamil, and other regional languages.",
      bgColor: 'bg-purple-100',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
      title: "AI-Powered Tools",
      description: "Generate worksheets, assess reading, create diagrams, and plan lessons.",
      bgColor: 'bg-yellow-100',
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Made for Teachers",
      description: "Designed specifically for multi-grade classrooms and resource constraints.",
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
        <nav className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="font-semibold text-sm text-foreground">Teacher Portal</p>
            <p className="text-xs text-muted-foreground">Supporting Indian Education</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Link href="/login">Sign In</Link>
          </Button>
        </nav>
        <div className="md:hidden">
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg">
                <Link href="/login">Sign In</Link>
            </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="mb-8 p-5 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg inline-block">
                <BookOpen className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary mb-4 font-headline">
              Sahayak
            </h1>
            <p className="text-xl md:text-2xl font-medium mb-6">
              Your AI Teaching Assistant
            </p>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              Empowering teachers in under-resourced schools with AI-driven tools for creating personalized content, assessing students, and planning lessons — all in your local language.
            </p>
          </motion.div>
        </section>
        
        <section id="features" className="pb-16 md:pb-24">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-gray-200/50 rounded-2xl p-6 text-center">
                    <CardContent className="flex flex-col items-center p-0">
                      <div className={`p-4 rounded-full mb-4 ${feature.bgColor}`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sahayak AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
