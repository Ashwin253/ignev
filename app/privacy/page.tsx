export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f0] text-slate-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-slate-900">Privacy Policy</h1>
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            At EVPlse, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The information we may collect on the Site includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
            <li><strong>Location Data:</strong> We may request access or permission to and track location-based information from your mobile device or browser, either continuously or while you are using our Site, to provide location-based services (like our EV charging map).</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">How We Use Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage your account.</li>
            <li>Assist you with vehicle comparison, buying, and selling processes.</li>
            <li>Deliver targeted advertising, coupons, newsletters, and other information regarding promotions and the Site to you.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at support@evpulse.com.
          </p>
        </div>
      </div>
    </div>
  );
}
