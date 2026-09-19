'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaGlobe, FaYoutube, FaPhone } from 'react-icons/fa';
// import { BD, IN, NP, PK, LK, AT } from 'country-flag-icons/react/3x2';
import Image from 'next/image';

// const regionalOffices = [
//   { country: 'Bangladesh', Flag: BD, address: 'Caritas Bangladesh, 2, Outer Circular Road, Shantibagh, Dhaka-1217 , Bangladesh', phone: '+880-2-48315406-9', email: 'cbgeneral@caritasbd.org', website: 'https://www.caritasbd.org' },
//   { country: 'India', Flag: IN, address: 'Caritas India, CBCI Centre, 1 Ashok Place, New Delhi – 110001, India', phone: '+91 11 23363390', email: 'info@caritasindia.org', website: 'https://caritasindia.org' },
//   { country: 'Nepal', Flag: NP, address: 'Caritas Nepal, Dhobighat, GPO Box: 9571, Lalitpur, Nepal', phone: '+977-1-5438172', email: 'support@caritas.org.np', website: 'https://www.caritasnepal.org' },
//   { country: 'Pakistan', Flag: PK, address: 'Caritas Pakistan, 23/3 Race Course Road, Lahore – 54000,Pakistan', phone: '+92-42-36315584-5', email: 'caritas@caritas.org.pk', website: 'https://caritas.org.pk' },
//   { country: 'Sri Lanka', Flag: LK, address: 'Caritas Sri Lanka - SEDEC, 133, Kynsey Road, Colombo 08, Sri Lanka', phone: '+94 112 691 885', email: 'sedec@caritaslk.org', website: 'https://www.caritaslk.org' },
//   { country: 'Austria', Flag: AT, address: 'Storchengasse 1/E1 05,\n1160 Wien, Austria', phone: '', email: 'office@caritas-austria.at', website: 'https://www.caritas-austria.at/' },
// ];

const Footer = () => {
  const [activeOffice, setActiveOffice] = useState(null);
  const socialItems = [
    { name: "Facebook", icon: <FaFacebook size={18} />, link: "https://www.facebook.com" },
    { name: "Twitter", icon: <FaTwitter size={18} />, link: "https://twitter.com" },
    { name: "Instagram", icon: <FaInstagram size={18} />, link: "https://www.instagram.com" },
    { name: "YouTube", icon: <FaYoutube size={18} />, link: "https://www.youtube.com" },
  ];

  return (
    <footer className="relative text-black overflow-hidden">

      <div className="relative z-10 w-5/6 mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-12">
          {/* Column 1 - Regional Offices (Tabbed) */}
          <div className="space-y-4 text-black bg-transparent">
            {/* <h3 className="text-4xl font-bold mb-2 border-b-2 pb-1 inline-block">EVPlse</h3> */}
             <img src="/evplsenewlogo.png" alt="IgnEV Logo" className="h-16 bg-transparent w-auto" loading="lazy" />
            <p className="text-gray-600">
              India's premier marketplace for electric and hybrid vehicles. Making sustainable mobility accessible to everyone.
            </p>
            {/* <div className="flex flex-wrap gap-2">
              {regionalOffices.map((office, i) => {
                const Flag = office.Flag;
                return (
                  <button
                    key={office.country}
                    onMouseEnter={() => setActiveOffice(i)}
                    onMouseLeave={() => setActiveOffice(null)}
                    title={office.country}
                    className={`w-10 h-7 mx-1 rounded-md overflow-hidden transition-all duration-200 ${
                      activeOffice === null
                        ? 'opacity-100 hover:scale-110'
                        : activeOffice === i
                          ? 'scale-120 opacity-100 shadow-md'
                          : 'opacity-100'
                    }`}
                  >
                    <Flag className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div> */}
            {/* {activeOffice !== null ? (
            <div className="text-sm bg-white/70 backdrop-blur-md rounded-r-lg p-3">
              <p className="font-medium text-gray-900 mb-2 whitespace-pre-line">{regionalOffices[activeOffice].address}</p>
            </div>
            ) : (
              <div className="p-3"><p className="invisible">placeholder</p><p className="invisible">placeholder</p></div>
            )} */}
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold mb-4 border-b-2 pb-2 inline-block">Contact Us</h3>
            <div className="flex items-center space-x-4 text-black">
              <FaEnvelope className="text-black" />
              <a href="mailto:evplseadmin@gmail.com" className="hover:text-amber-400 transition">evplseadmin@gmail.com</a>
            </div>
            {/* <div className="flex items-center space-x-4 text-black">
              <FaEnvelope className="text-black" />
              <a href="mailto:evplseadmin@gmail.com" className="hover:text-amber-400 transition">evplseadmin@gmail.com</a>
            </div> */}

             {/* <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-secondary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-secondary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul> */}
         
            {/* <div className="flex items-center space-x-4 text-black">
              <FaGlobe className="text-black" />
              <a href="https://www.caritas-austria.at/international-projects/safbin-strengthening-small-farmers/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition">
                Donate Now (Europe)
              </a>
            </div>
            <div className="flex items-center space-x-4 text-black">
              <FaGlobe className="text-black" />
              <Link href="/privacypolicy" className="hover:text-amber-400 transition">Privacy Policy</Link>
            </div> */}
          </div>

          {/* Column 3 */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-4 border-b-2 pb-2 inline-block">Follow Us</h3>

            <div className="grid grid-cols-2 gap-3">
              {socialItems.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-black border px-3 py-2 rounded-lg backdrop-blur shadow-sm hover:bg-zinc-800/60 hover:text-white transition"
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-black">
          <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} EVPLSE. All rights reserved.</p>
          <div className="flex space-x-6 items-center flex-wrap gap-y-2">
            <Link href="/about" className="hover:text-amber-600 transition font-medium">About Us</Link>
            <Link href="/privacy" className="hover:text-amber-600 transition font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-600 transition font-medium">Terms of Services</Link>
            <Link href="/mcp" className="hover:text-emerald-600 transition font-medium flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Connect AI / MCP
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;