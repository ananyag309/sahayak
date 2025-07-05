"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ArrowRight, BookOpen, BrainCircuit, Gamepad2, Mic, PenTool, ScanLine } from "lucide-react";

const HeroIllustration = () => (
    <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <rect width="512" height="512" rx="20" fill="url(#paint0_linear_1_2)"/>
      <g filter="url(#filter0_d_1_2)">
        <path d="M128 400C128 357.574 161.574 324 204 324H308C350.426 324 384 290.426 384 248C384 205.574 350.426 172 308 172H204C161.574 172 128 138.426 128 96" stroke="white" strokeWidth="24" strokeLinecap="round"/>
      </g>
      <circle cx="256" cy="112" r="16" fill="white" />
      <circle cx="256" cy="400" r="16" fill="white" />
      <circle cx="376" cy="248" r="12" fill="#FBBF24"/>
      <circle cx="136" cy="96" r="12" fill="#FBBF24"/>
      <defs>
        <filter id="filter0_d_1_2" x="112" y="84" width="288" height="336" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_2"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_2" result="shape"/>
        </filter>
        <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED"/>
          <stop offset="1" stopColor="#A78BFA"/>
        </linearGradient>
      </defs>
    </svg>
);

export default function Home() {
  const features = [
    { icon: <BrainCircuit className="w-8 h-8 text-primary" />, title: "AI Chat Assistant", description: "Get stories, analogies, or explanations for any concept in multiple languages." },
    { icon: <ScanLine className="w-8 h-8 text-primary" />, title: "Textbook Scanner", description: "Generate various question types from a single textbook photo." },
    { icon: <PenTool className="w-8 h-8 text-primary" />, title: "Diagram Generator", description: "Instantly create chalkboard-style diagrams for visual learning." },
    { icon: <Mic className="w-8 h-8 text-primary" />, title: "Reading Assessment", description: "Assess fluency and pronunciation with AI-powered feedback." },
    { icon: <BookOpen className="w-8 h-8 text-primary" />, title: "Lesson Planner", description: "Create comprehensive weekly lesson plans in minutes." },
    { icon: <Gamepad2 className="w-8 h-8 text-primary" />, title: "Game Generator", description: "Design fun and educational games for your students." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
        <nav className="hidden md:flex items-center gap-4">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
        <div className="md:hidden">
            <Button asChild size="sm">
                <Link href="/login">Login</Link>
            </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 font-headline">
                Empower Your Classroom with Sahayak AI
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Your AI-powered multilingual teaching assistant, designed for the vibrant classrooms of India. Create, assess, and engage like never before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/signup">Get Started For Free <ArrowRight className="ml-2" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </section>
        
        <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white rounded-t-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground font-headline">A Toolkit for the Modern Indian Teacher</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">Everything you need to create a dynamic and engaging learning environment.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sahayak AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
