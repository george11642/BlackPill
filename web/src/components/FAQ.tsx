import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export const FAQ: React.FC<FAQProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-md">
      {items.map((item, index) => (
        <div
          key={index}
          className="card cursor-pointer"
          onClick={() => setOpenIndex(openIndex === index ? null : index)}
        >
          <div className="flex justify-between items-center">
            <h4 className="mb-0">{item.question}</h4>
            <span
              className="text-2xl transition-transform"
              style={{
                transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▼
            </span>
          </div>
          {openIndex === index && (
            <div className="mt-md pt-md border-t border-[rgba(255,255,255,0.1)]">
              <p className="mb-0">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
