"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/components/auth-provider";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  language: z.enum(["en", "hi", "mr", "ta"]),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" {...props}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { user, loading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      language: "en",
    },
  });

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleDemoMode = () => {
    sessionStorage.setItem('isDemoMode', 'true');
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth || !db) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Google Sign-In cannot proceed without Firebase credentials.",
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          language: "en", // default language
          createdAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
        let description: React.ReactNode = "An unexpected error occurred. Please try again.";
        if (error.message && error.message.includes('identity-toolkit')) {
            description = (
                <span>
                    The authentication service is not enabled for this project. Please{' '}
                    <a
                        href={`https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                    >
                        enable the Identity Toolkit API
                    </a>
                    {' '}and try again. It may take a few minutes to activate.
                </span>
            );
        } else if (error.code === 'auth/operation-not-allowed') {
             description = (
                <span>
                Google Sign-in is not enabled. Please{' '}
                <a
                    href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/authentication/providers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                >
                    click here to enable it in your Firebase project
                </a>.
                </span>
            );
        } else {
            description = error.message;
        }

        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description,
        });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!isFirebaseConfigured || !auth || !db) {
       toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please provide Firebase credentials in your .env file.",
      });
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        language: values.language,
        createdAt: serverTimestamp(),
      });

    } catch (error: any) {
      let description: React.ReactNode = "An unexpected error occurred. Please try again.";

      if (error.code === 'auth/operation-not-allowed') {
        description = (
          <span>
            Email/Password sign-up is not enabled. Please{' '}
            <a
              href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/authentication/providers`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              click here to enable it in your Firebase project
            </a>.
          </span>
        );
      } else if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please sign in instead.";
      } else {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Create your Account</CardTitle>
        <CardDescription>Join Sahayak to unlock powerful AI teaching tools.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isFirebaseConfigured && (
            <Alert className="mb-4">
                <AlertTitle>Firebase Not Configured</AlertTitle>
                <AlertDescription>
                  Real sign-up is disabled. Please use the "Continue in Demo Mode" button to explore the app.
                </AlertDescription>
            </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={!isFirebaseConfigured} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} disabled={!isFirebaseConfigured} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseConfigured} />
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
                  <FormLabel>Preferred Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isFirebaseConfigured}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
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
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !isFirebaseConfigured}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading || !isFirebaseConfigured}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
        
        <Button variant="secondary" className="w-full mt-4" onClick={handleDemoMode}>
            Continue in Demo Mode
        </Button>
        
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
