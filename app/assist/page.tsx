import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";
import EnquiryForm from "../components/EnquiryForm";

export const metadata = {
  title: "Get EV Assist | EVPULSE",
  description: "Request a callback from our EV experts to help you find the right electric vehicle, financing, or services.",
};

export default function AssistPage() {
  return (
    <section className="min-h-screen bg-slate-100 py-28 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-sky-100 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-96 w-96 rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
          {/* Information & Features Column */}
          <div className="space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200 mb-4">
                <Sparkles size={12} className="text-sky-500" /> EV Expert Advisory
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Get Personal <span className="text-sky-600">EV Assistance</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Navigating the world of electric vehicles can be complex. From choosing the correct battery capacity to understanding range and BaaS subscriptions, we are here to help.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex gap-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-sky-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Unbiased Advice</h3>
                  <p className="text-xs text-slate-500 mt-1">Our EV experts offer neutral recommendations across all top brands and models.</p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-sky-600 shrink-0 h-10 w-10 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Verified Specifications</h3>
                  <p className="text-xs text-slate-500 mt-1">We decode range, real-world battery performance, charging rates, and BaaS calculations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            <EnquiryForm
              source="Get Assist Page"
              compact={false}
              includeInterest={true}
              title="Request Callback"
              subtitle="Fill in your details below and an expert will get in touch with you shortly."
              buttonText="Request Call"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
