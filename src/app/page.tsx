import Link from "next/link";
import { Metadata } from "next";
import styles from "./landingPage.module.scss";
import Image from "next/image";

export const metadata: Metadata = {
  title: "TrasMart - Convert Your Waste to Points",
  description:
    "Earn points by recycling plastic bottles and cans with TrasMart IoT vending machines",
};

export default function LandingPage() {
  return (
    <div className={styles.main}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <img
              width="100"
              height="100"
              src="https://img.icons8.com/stickers/100/recycle-sign.png"
              alt="recycle-sign"
            />
          </div>
          <div className={styles.navLinks}>
            <Link href="/auth/signin" className={styles.signIn}>
              Sign In
            </Link>
            <Link href="/auth/signup" className={styles.signUp}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <h2>
              Turn Your Trash Into{" "}
              <span className={styles.highlight}>Points</span>
            </h2>
            <p>
              Recycle plastic bottles and cans with our smart IoT vending
              machines and earn points instantly. Redeem your points for amazing
              rewards!
            </p>
            <div className={styles.buttonGroup}>
              <Link href="/auth/signup" className={styles.primaryBtn}>
                Get Started
              </Link>
              <Link href="#features" className={styles.secondaryBtn}>
                Learn More
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.imageWrapper}>
              <Image width="150" height="150" src="/landing-image.svg" alt="landing-sign" />
            </div>
            <p>Join thousands of users making a difference</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresContent}>
          <h3 className={styles.featuresTitle}>Why Choose TrasMart?</h3>
          <div className={styles.featuresGrid}>
            {[
              {
                icon: "🤖",
                title: "Smart IoT Machines",
                desc: "Automated detection of plastic bottles and cans",
              },
              {
                icon: "⭐",
                title: "Earn Points Instantly",
                desc: "Get rewarded immediately for each recycle",
              },
              {
                icon: "🎁",
                title: "Amazing Rewards",
                desc: "Redeem points for products and discounts",
              },
              {
                icon: "📊",
                title: "Track Progress",
                desc: "View your points, history, and achievements",
              },
              {
                icon: "🌍",
                title: "Help Environment",
                desc: "Make a positive impact on the planet",
              },
              {
                icon: "👥",
                title: "Community",
                desc: "Compete and collaborate with other users",
              },
            ].map((feature, idx) => (
              <div key={idx} className={styles.featureCard}>
                <div className={styles.icon}>{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h3>Ready to Start Making a Difference?</h3>
          <p>Join TrasMart today and start earning points!</p>
          <Link href="/auth/signup">Create Account Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2024 TrasMart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
