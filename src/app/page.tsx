"use client";

import { useState } from "react";
import styles from "./page.module.css";
import ChatPreview from "@/components/ChatPreview";
import ModernChatbox from "@/components/ModernChatbox";
import { Bot } from "lucide-react";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGrid} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Bot className={styles.logoIcon} />
          ARNOLD AI
        </div>
      </header>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Your Personal Financial & Health Sentinel</span>
          <h1 className={styles.title}>
            Master Your Wealth & Wellness with Arnold
          </h1>
          <p className={styles.subtitle}>
            Arnold is the world's first autonomous AI dedicated to elite financial education
            and precision health insurance management. Secure your future, one chat at a time.
          </p>

          <div className={styles.ctas}>
            <a href="#get-started" className={styles.primaryBtn} onClick={() => setIsChatOpen(true)}>
              Consult Arnold Now
            </a>
            <a href="#features" className={styles.secondaryBtn}>
              Our Strategy
            </a>
          </div>
        </div>

        <div className={styles.heroVisual} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ChatPreview />
        </div>
      </main>

      {/* Body / Features */}
      <section className={styles.body} id="features">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Smarter Living Through AI</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '0 auto' }}>
            Arnold combines deep market analytics with complex insurance modeling to provide
            unparalleled clarity in your financial and medical decisions.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>💰</div>
            <h3 className={styles.cardTitle}>Wealth Intelligence</h3>
            <p className={styles.cardDesc}>
              Personalized tax optimization and investment strategies designed to maximize
              capital efficiency and long-term growth.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🏥</div>
            <h3 className={styles.cardTitle}>Health Shield</h3>
            <p className={styles.cardDesc}>
              Autonomous analysis of thousands of health insurance riders to find the perfect
              protection for you and your loved ones.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🤖</div>
            <h3 className={styles.cardTitle}>24/7 Agent Access</h3>
            <p className={styles.cardDesc}>
              Arnold never sleeps. Get instant answers to complex billing questions or market
              shifts exactly when you need them.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer} style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.875rem',
        borderTop: '1px solid var(--border)',
        zIndex: 1,
        background: '#fdfdfd'
      }}>
        <div style={{ marginBottom: '2rem', color: 'var(--primary)', fontWeight: '700' }}>ARNOLD AI</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
          <a href="#" className={styles.navLink}>Privacy Policy</a>
          <a href="#" className={styles.navLink}>Terms of Service</a>
          <a href="#" className={styles.navLink}>Security</a>
        </div>
        <p>© 2026 Arnold Intelligent Systems. Precision Wealth & Health.</p>
      </footer>

      {/* Floating Root Icon */}
      <div className={styles.floatingIcon} onClick={() => setIsChatOpen(!isChatOpen)}>
        <Bot size={35} color="#fff" strokeWidth={2.5} />
      </div>

      {/* Modern Chatbox */}
      <ModernChatbox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
