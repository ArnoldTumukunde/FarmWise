import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is AAN Academy?',
    a: 'AAN Academy is an agricultural learning platform built for farmers in East Africa. Browse expert-led courses on crops, livestock, soil health, and more — with full offline download support so you can learn even without internet.',
  },
  {
    q: 'Do I need internet to learn?',
    a: 'Only to download lectures. Once downloaded, everything plays offline on your device. Perfect for learning in the field where signal is unreliable.',
  },
  {
    q: 'How much do courses cost?',
    a: 'Many courses are completely free. Paid courses range from UGX 5,000 to UGX 50,000. Pay once and own the course forever — no subscriptions.',
  },
  {
    q: 'Can I teach on AAN Academy?',
    a: 'Yes! Apply for an instructor account and start creating courses. You keep 70% of every sale. We provide free tools to build, upload, and manage your courses.',
  },
  {
    q: 'What devices are supported?',
    a: 'AAN Academy works on any Android phone, iPhone, tablet, or computer. You can even install it as an app directly from your browser — no app store needed.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-[#1B2B1B] text-center mb-10">
        Frequently Asked Questions
      </h2>

      <div>
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-200 py-4">
            <button
              onClick={() => toggle(index)}
              aria-expanded={openIndex === index}
              className="text-left font-medium text-[#1B2B1B] flex items-center justify-between w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-[#5A6E5A] flex-shrink-0 ml-4 transition-transform duration-200 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <p className="text-sm text-[#5A6E5A] mt-2 pb-2">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
