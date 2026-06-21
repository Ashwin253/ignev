export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] text-slate-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-slate-900">Terms of Service</h1>
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and EVPlse ("we," "us" or "our"), concerning your access to and use of our website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing the Site, you agree that you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Site and you must discontinue use immediately.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. User Representations</h2>
          <p>
            By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Prohibited Activities</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Contact Us</h2>
          <p>
            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at evplseadmin@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}
