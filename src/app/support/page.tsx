"use client";

import React, { useState } from 'react';
import { HelpCircle, Book, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';

export default function SupportPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "To book an appointment, simply browse the home page for your preferred shop, select a service and professional, then choose a time that works for you. You'll need to create a free account to finalize your first booking."
    },
    {
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes. You can manage your bookings through the 'My Bookings' section in your profile. Please note that individual shops have their own cancellation policies, which you can view during the checkout process."
    },
    {
      question: "What payment methods do you accept?",
      answer: "TrimSpace supports all major credit cards, Apple Pay, and Google Pay through our secure integration with Stripe. Some shops may also accept cash payments at the venue."
    },
    {
      question: "How do I become a partner on TrimSpace?",
      answer: "If you own a barbershop or wellness studio, click on 'Become a Partner' in the navigation menu. You'll be guided through our onboarding process to set up your digital storefront."
    },
    {
      question: "Is there a subscription fee for customers?",
      answer: "No. TrimSpace is completely free for customers to use. You only pay for the services you book at the shop."
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#fff', color: '#000', minHeight: '100vh', paddingTop: '100px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 16px', borderRadius: '40px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <Sparkles size={16} color="#000" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support Center</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '16px' }}>How can we help?</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>Find answers to common questions or reach out to our team.</p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '60px' }}>
          <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search for help topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '20px 20px 20px 56px', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>

        {/* Contact Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '80px' }}>
          <div style={{ padding: '32px', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff' }}>
              <Mail size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Email Support</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Response time: Under 24h</p>
            <a href="mailto:support@trimspace.com" style={{ color: '#000', fontWeight: 900, textDecoration: 'none', fontSize: '0.95rem' }}>support@trimspace.com</a>
          </div>
          <div style={{ padding: '32px', borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff' }}>
              <MessageCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Live Chat</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Available Mon-Fri, 9am-5pm</p>
            <span style={{ color: '#000', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer' }}>Start a Conversation</span>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '32px', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
              <div 
                key={index} 
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                style={{ 
                  padding: '24px', 
                  borderRadius: '20px', 
                  border: '1px solid #e2e8f0', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeFaq === index ? '#fff' : '#fff',
                  boxShadow: activeFaq === index ? '0 10px 30px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{faq.question}</h3>
                  {activeFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {activeFaq === index && (
                  <div style={{ marginTop: '16px', color: '#475569', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No matching questions found. Try another search term.
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: '60px 40px', borderRadius: '32px', background: '#000', color: '#fff', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Still need help?</h2>
          <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem' }}>Our concierge team is available 24/7 to assist you.</p>
          <button style={{ padding: '16px 40px', background: '#fff', color: '#000', borderRadius: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Contact Us Now</button>
        </div>
      </div>
    </div>
  );
}
