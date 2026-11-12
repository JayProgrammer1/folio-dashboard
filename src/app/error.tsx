"use client";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Logo } from "@/components/ui";
export default function ErrorPage({ reset }: { error: Error & {digest?:string}; reset: () => void }) {
  return <main className="error-page" id="main-content"><Logo/><div className="error-illustration">✦</div><h1>A little pause. Not the end.</h1><p>We couldn’t load your workspace just now.<br/>Your ideas are safe — let’s give it another go.</p><button className="button primary" onClick={reset}><RefreshCcw size={16}/>Try again</button><a href="/login">Back to sign in<ArrowRight size={13}/></a></main>;
}
