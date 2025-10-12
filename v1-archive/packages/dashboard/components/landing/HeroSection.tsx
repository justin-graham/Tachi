import React from 'react';
import Image from 'next/image';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  return (
    <section className={`${styles.hero} ${className}`}>
      <div className={styles.background}>
      </div>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.mainTitle} style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            pay-per-crawl protocol
          </h1>
          
          <p className={styles.subtitle} style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            the standard for monetizing web content and powering the agentic economy.
          </p>
          
          <div className={styles.logoSection}>
            <div className={`${styles.logoContainer} hero-logo-slot`}>
              <Image
                src="/images/tachi-logo.svg"
                alt="Tachi"
                width={208}
                height={208}
                className={`${styles.logo} logo`}
              />
            </div>
            <div className={styles.tachiText} style={{ fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              tachi
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;