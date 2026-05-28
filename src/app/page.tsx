"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./landingPage.module.scss";
import {
  Recycle,
  Zap,
  Gift,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Leaf,
  Droplets,
  Users,
  Star,
  MapPin,
  Clock,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

const stats = [
  { icon: Recycle, value: 12500, suffix: "+", label: "Botol Didaur Ulang" },
  { icon: Users, value: 850, suffix: "+", label: "Mahasiswa Bergabung" },
  { icon: Gift, value: 3200, suffix: "+", label: "Poin Dibagikan" },
  { icon: Leaf, value: 480, suffix: " kg", label: "CO2 Berkurang" },
];

const steps = [
  {
    step: "01",
    icon: Recycle,
    title: "Masukkan Sampah",
    desc: "Taruh botol plastik atau kaleng ke mesin IoT TrasMart yang tersedia di area Polinema.",
  },
  {
    step: "02",
    icon: Zap,
    title: "Dapatkan Poin",
    desc: "Sensor pintar otomatis mendeteksi jenis sampah dan memberikan poin secara instan ke akunmu.",
  },
  {
    step: "03",
    icon: Gift,
    title: "Tukar Voucher",
    desc: "Gunakan poin yang terkumpul untuk menukar voucher makanan & minuman di kantin Polinema.",
  },
];

const features = [
  {
    icon: Smartphone,
    title: "Smart IoT Detection",
    desc: "Sensor canggih mendeteksi jenis sampah secara otomatis — botol plastik, kaleng aluminium, dan lainnya.",
    color: "#22c55e",
  },
  {
    icon: Zap,
    title: "Poin Instan",
    desc: "Poin langsung masuk ke akunmu dalam hitungan detik. Tidak perlu menunggu, tidak perlu manual.",
    color: "#0ea5e9",
  },
  {
    icon: Gift,
    title: "Voucher Kantin",
    desc: "Tukarkan poinmu dengan berbagai voucher menarik dari tenant kantin Polinema favoritmu.",
    color: "#f59e0b",
  },
  {
    icon: TrendingUp,
    title: "Tracking Progres",
    desc: "Pantau riwayat daur ulang, total poin, dan dampak lingkunganmu melalui dashboard pribadi.",
    color: "#8b5cf6",
  },
  {
    icon: Shield,
    title: "Aman & Terpercaya",
    desc: "Sistem terintegrasi dengan Supabase untuk keamanan data dan transaksi yang terjamin.",
    color: "#ec4899",
  },
  {
    icon: MapPin,
    iconColor: "#10b981",
    title: "Lokasi Mesin",
    desc: "Temukan mesin TrasMart terdekat di area kampus dengan peta interaktif di dashboard.",
    color: "#10b981",
  },
];

const testimonials = [
  {
    name: "Rina Safitri",
    role: "Mahasiswa Teknik Mesin",
    quote:
      "Awalnya iseng coba, sekarang jadi kebiasaan. Setiap habis minum botolnya langsung masuk TrasMart. Poinnya lumayan buat beli makan di kantin!",
    rating: 5,
  },
  {
    name: "Dimas Pratama",
    role: "Mahasiswa Teknologi Informasi",
    quote:
      "Konsepnya keren banget. IoT + daur ulang + reward. Rasanya jadi termotivasi buat lebih peduli lingkungan sambil dapat keuntungan.",
    rating: 5,
  },
  {
    name: "Ayu Lestari",
    role: "Mahasiswa Administrasi Bisnis",
    quote:
      "Voucher kantinnya beneran bisa ditukar! Udah beberapa kali tukar poin buat beli kopi dan makan siang. Praktis banget.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Apa itu TrasMart?",
    a: "TrasMart adalah sistem vending machine IoT yang mengubah sampah botol plastik dan kaleng menjadi poin yang bisa ditukarkan dengan voucher kantin di Polinema.",
  },
  {
    q: "Bagaimana cara mendapatkan poin?",
    a: "Cukup masukkan botol plastik atau kaleng ke mesin TrasMart. Sensor otomatis akan mendeteksi dan memberikan poin ke akunmu secara instan.",
  },
  {
    q: "Berapa poin yang saya dapatkan per botol?",
    a: "Setiap botol plastik atau kaleng yang berhasil didaur ulang akan memberikan poin sesuai jenis dan jumlah. Detail poin bisa dilihat di dashboard.",
  },
  {
    q: "Di mana lokasi mesin TrasMart?",
    a: "Mesin TrasMart tersedia di beberapa titik di area Polinema. Lokasi bisa dilihat melalui dashboard di akunmu.",
  },
  {
    q: "Voucher apa saja yang bisa ditukar?",
    a: "Berbagai voucher makanan dan minuman dari tenant kantin Polinema tersedia. Katalog voucher bisa dilihat di halaman Reward Shop setelah login.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Ya, semua data dilindungi dan terintegrasi dengan Supabase untuk keamanan dan privasi yang terjamin.",
  },
];

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{count.toLocaleString("id-ID")}</span>;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.faqItem}>
      <button onClick={() => setOpen(!open)} className={styles.faqQuestion}>
        <span>{q}</span>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <div className={`${styles.faqAnswer} ${open ? styles.faqAnswerOpen : ""}`}>
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navBrand}>
            <div className={styles.navLogo}>
              <Image src="/icon.png" alt="logo-sign" width={40} height={40} />
            </div>
            <span>TrasMart</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#cara-kerja">Cara Kerja</a>
            <a href="#fitur">Fitur</a>
            <a href="#testimoni">Testimoni</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/auth/login" className={styles.navSignIn}>
              Masuk
            </Link>
            <Link href="/auth/register" className={styles.navSignUp}>
              Daftar Sekarang
            </Link>
          </div>

          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
            <a href="#fitur" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
            <a href="#testimoni" onClick={() => setMobileMenuOpen(false)}>Testimoni</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className={styles.mobileMenuActions}>
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
              <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>Daftar Sekarang</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={`${styles.heroBlob} ${styles.heroBlob1}`} />
          <div className={`${styles.heroBlob} ${styles.heroBlob2}`} />
          <div className={`${styles.heroBlob} ${styles.heroBlob3}`} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className="animate-on-scroll fade-in">
              <div className={styles.heroBadge}>
                <Leaf size={14} />
                <span>Ramah Lingkungan &bull; Polinema</span>
              </div>
            </div>

            <h1 className="animate-on-scroll">
              Ubah Botol Bekas Jadi{" "}
              <span className={styles.heroHighlight}>Poin</span>
            </h1>

            <p className="animate-on-scroll delay-100">
              Masukkan botol plastik dan kaleng ke mesin IoT TrasMart, dapatkan poin
              secara instan, dan tukarkan dengan voucher kantin Polinema yang menarik.
            </p>

            <div className={`${styles.heroButtons} animate-on-scroll delay-200`}>
              <Link href="/auth/register" className={styles.btnPrimary}>
                Mulai Daur Ulang
                <ArrowRight size={20} />
              </Link>
              <a href="#cara-kerja" className={styles.btnSecondary}>
                <Clock size={18} />
                Lihat Cara Kerja
              </a>
            </div>

            <div className={`${styles.heroProof} animate-on-scroll delay-300`}>
              <div className={styles.heroProofAvatars}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.heroProofAvatar}>
                    <Users size={14} />
                  </div>
                ))}
              </div>
              <div className={styles.heroProofText}>
                <div className={styles.heroProofStars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
                <span>Dipercaya <strong>850+ mahasiswa</strong> Polinema</span>
              </div>
            </div>
          </div>

          <div className={`${styles.heroVisual} animate-on-scroll delay-200`}>
            <div className={styles.heroVisualContainer}>
              <div className={styles.heroMachine}>
                <div className={styles.heroMachineBody}>
                  <div className={styles.heroMachineScreen}>
                    <div className={styles.heroMachineScreenContent}>
                      <Image src="/icon.png" alt="logo-sign" width={40} height={40} />
                      <span>TrasMart</span>
                      <div className={styles.heroMachinePoints}>
                        <Zap size={16} />
                        <span>+15 Poin</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.heroMachineSlot} />
                  <div className={styles.heroMachineBase} />
                </div>
                <div className={`${styles.heroFloatingCard} ${styles.heroFloatingCard1}`}>
                  <Recycle size={20} />
                  <span>3 botol didaur ulang</span>
                </div>
                <div className={`${styles.heroFloatingCard} ${styles.heroFloatingCard2}`}>
                  <Gift size={20} />
                  <span>Voucher Kantin</span>
                </div>
                <div className={`${styles.heroFloatingCard} ${styles.heroFloatingCard3}`}>
                  <Leaf size={20} />
                  <span>Eco Warrior!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroScroll}>
          <a href="#stats">
            <ChevronDown size={24} />
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className={styles.stats}>
        <div className={styles.statsInner}>
          {stats.map((stat, i) => (
            <div key={i} className={`animate-on-scroll stagger-${i + 1}`}>
              <div className={styles.statCard}>
                <stat.icon size={24} />
                <div className={styles.statValue}>
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className={styles.howItWorks}>
        <div className={styles.howItWorksInner}>
          <div className={`animate-on-scroll ${styles.sectionHeader}`}>
            <span className={styles.sectionTag}>Cara Kerja</span>
            <h2>Tiga Langkah Mudah</h2>
            <p>
              Tidak perlu ribet. Cukup masukkan sampah, dapatkan poin, dan tukar
              dengan voucher favoritmu.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {steps.map((step, i) => (
              <div
                key={i}
                className={`animate-on-scroll stagger-${i + 1} ${styles.stepCard}`}
              >
                <div className={styles.stepNumber}>{step.step}</div>
                <div className={styles.stepIcon}>
                  <step.icon size={28} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className={styles.stepConnector}>
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={`animate-on-scroll ${styles.sectionHeader}`}>
            <span className={styles.sectionTag}>Fitur</span>
            <h2>Kenapa Pilih TrasMart?</h2>
            <p>
              Teknologi IoT yang memudahkan kamu berkontribusi untuk lingkungan
              sambil mendapatkan reward menarik.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, i) => (
              <div
                key={i}
                className={`animate-on-scroll stagger-${(i % 3) + 1} ${styles.featureCard}`}
                style={{ "--feature-color": feature.color } as React.CSSProperties}
              >
                <div className={styles.featureIcon}>
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <CheckCircle2 size={16} className={styles.featureCheck} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className={styles.impact}>
        <div className={styles.impactInner}>
          <div className={`animate-on-scroll slide-left`}>
            <div className={styles.impactVisual}>
              <div className={`${styles.impactCircle} ${styles.impactCircle1}`}>
                <Droplets size={32} />
              </div>
              <div className={`${styles.impactCircle} ${styles.impactCircle2}`}>
                <Leaf size={32} />
              </div>
              <div className={`${styles.impactCircle} ${styles.impactCircle3}`}>
                <TrendingUp size={32} />
              </div>
              <div className={styles.impactCenter}>
                <Recycle size={48} />
              </div>
            </div>
          </div>

          <div className={`animate-on-scroll slide-right ${styles.impactContent}`}>
            <span className={styles.sectionTag}>Dampak Lingkungan</span>
            <h2>Setiap Botol Berarti</h2>
            <p>
              Setiap botol plastik yang kamu daur ulang berkontribusi mengurangi
              sampah dan emisi karbon. Bersama, kita bisa membuat perubahan nyata
              untuk lingkungan Polinema dan sekitarnya.
            </p>
            <ul className={styles.impactList}>
              <li>
                <CheckCircle2 size={20} />
                <span>Kurangi sampah plastik di lingkungan kampus</span>
              </li>
              <li>
                <CheckCircle2 size={20} />
                <span>Turunkan jejak karbon harian</span>
              </li>
              <li>
                <CheckCircle2 size={20} />
                <span>Dukung ekonomi sirkular di Polinema</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className={styles.testimonials}>
        <div className={styles.testimonialsInner}>
          <div className={`animate-on-scroll ${styles.sectionHeader}`}>
            <span className={styles.sectionTag}>Testimoni</span>
            <h2>Apa Kata Mereka?</h2>
            <p>Pengalaman nyata dari mahasiswa Polinema yang sudah bergabung.</p>
          </div>

          <div className={styles.testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`animate-on-scroll stagger-${i + 1} ${styles.testimonialCard}`}
              >
                <div className={styles.testimonialStars}>
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote>{t.quote}</blockquote>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>
                    <Users size={20} />
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faq}>
        <div className={styles.faqInner}>
          <div className={`animate-on-scroll ${styles.sectionHeader}`}>
            <span className={styles.sectionTag}>FAQ</span>
            <h2>Pertanyaan Umum</h2>
            <p>Jawaban untuk pertanyaan yang sering diajukan tentang TrasMart.</p>
          </div>

          <div className={styles.faqList}>
            {faqs.map((faq, i) => (
              <div key={i} className={`animate-on-scroll stagger-${Math.min(i + 1, 5)}`}>
                <FAQItem q={faq.q} a={faq.a} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <div className={`${styles.finalCtaBg} ${styles.finalCtaBg1}`} />
          <div className={`${styles.finalCtaBg} ${styles.finalCtaBg2}`} />

          <div className={`animate-on-scroll scale-in ${styles.finalCtaContent}`}>
            <h2>Siap Mulai Daur Ulang Hari Ini?</h2>
            <p>
              Bergabung dengan ratusan mahasiswa Polinema yang sudah mengubah
              sampah mereka menjadi poin dan voucher menarik.
            </p>
            <Link href="/auth/register" className={styles.btnPrimary}>
              Daftar Gratis Sekarang
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <Recycle size={24} />
              </div>
              <div>
                <strong>TrasMart</strong>
                <span>Ubah sampah jadi poin, tukar jadi voucher.</span>
              </div>
            </div>

            <div className={styles.footerLinks}>
              <div>
                <h4>Navigasi</h4>
                <a href="#cara-kerja">Cara Kerja</a>
                <a href="#fitur">Fitur</a>
                <a href="#testimoni">Testimoni</a>
                <a href="#faq">FAQ</a>
              </div>
              <div>
                <h4>Akun</h4>
                <Link href="/auth/login">Masuk</Link>
                <Link href="/auth/register">Daftar</Link>
                <Link href="/auth/register">Lupa Password</Link>
              </div>
              <div>
                <h4>Project</h4>
                <span>PBL Polinema 2025</span>
                <span>IoT + Web Integration</span>
                <span>Vending Machine Sampah</span>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>&copy; 2025 TrasMart. Proyek PBL Polinema.</p>
            <p>Dibuat dengan <Leaf size={14} /> untuk lingkungan yang lebih baik.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
