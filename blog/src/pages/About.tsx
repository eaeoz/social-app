import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Rocket,
  Youtube,
  Film,
  Music,
  Terminal,
  MicVocal,
  Newspaper,
  Speech,
  BookOpen,
  Users,
  MessageCircle,
  Heart,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Network,
  ShieldCheck,
  Code2,
  ExternalLink
} from 'lucide-react';
import '../styles/About.css';

const contactInfo = [
  { label: 'Email', value: 'sedatergoz@gmail.com', icon: Mail, href: 'mailto:sedatergoz@gmail.com' },
  { label: 'Phone', value: '+90 537 039 4310', icon: Phone, href: 'tel:+905370394310' },
  { label: 'Portfolio', value: 'sedat.netlify.app', icon: Globe, href: 'https://sedat.netlify.app' },
  { label: 'GitHub', value: 'github.com/eaeoz', icon: Github, href: 'https://github.com/eaeoz' },
  { label: 'LinkedIn', value: 'Sedat Ergoz', icon: Linkedin, href: 'https://www.linkedin.com/in/sedat-ergoz-604527346/' }
];

const journey = [
  {
    period: '2003 — 2007',
    title: 'Associate Degree, Computer Technology',
    place: 'Kocaeli University',
    tag: 'Education',
    icon: GraduationCap,
    desc: 'Foundation in computer technology, hardware and networking that started a lifelong interest in building things with code.'
  },
  {
    period: '2006 — 2007',
    title: 'On-Site Technical Support Specialist',
    place: 'Airties Wireless Networks · Istanbul, Türkiye',
    tag: 'Work',
    icon: Briefcase,
    desc: 'Service desk and computer hardware troubleshooting for home and business network devices — hands-on experience in real-world networking.'
  },
  {
    period: '2009 — 2015',
    title: 'Contract Firefighter',
    place: 'Emirates Fire & Rescue Company · Abu Dhabi, UAE',
    tag: 'Work',
    icon: ShieldCheck,
    desc: 'Rescue operations, fire safety and quick intervention. Discipline, calm under pressure and teamwork from the front lines.'
  },
  {
    period: '2009 — 2013',
    title: 'B.B.A., Accounting & Business Management',
    place: 'Anadolu University',
    tag: 'Education',
    icon: GraduationCap,
    desc: 'Bachelor of Business Administration — a business mindset that pairs with the technical toolkit for building real products.'
  },
  {
    period: '2016 — 2019',
    title: 'Fireman — Fire Safety & Prevention',
    place: 'Taweelah Asia Power Company (TAPCO) · Abu Dhabi, UAE',
    tag: 'Work',
    icon: Briefcase,
    desc: 'Workplace safety, fire prevention and protection at one of the region\'s major power plants.'
  },
  {
    period: '2020 — Present',
    title: 'Career Break → Full-Stack Developer',
    place: 'Building open-source applications',
    tag: 'Building',
    icon: Rocket,
    desc: 'Turned the break into professional growth: learned modern web development and shipped a growing suite of free, open-source apps, a community blog and a real-time social platform.'
  }
];

const skillGroups = [
  {
    title: 'Development',
    icon: Code2,
    skills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'Electron.js', 'PHP', 'MySQL', 'Git', 'Docker']
  },
  {
    title: 'Networking & IT',
    icon: Network,
    skills: ['Subnetting', 'Router / Switch', 'Firewall', 'VPN', 'SSH', 'PBX', 'VMWare', 'Proxmox', 'Hyper-V', 'WinSRV']
  },
  {
    title: 'Systems & Security',
    icon: ShieldCheck,
    skills: ['Cybersecurity', 'SSL', 'Automation', 'Shell Scripting', 'Ubuntu', 'SCOM', 'SCCM', 'IoT', 'WordPress', 'SEO']
  }
];

const projects = [
  {
    name: 'YouTube Downloader',
    category: 'Media',
    icon: Youtube,
    color: '#ff4444',
    desc: 'A modern downloader GUI — paste a link, pick a format and grab videos or audio.',
    features: ['Resolution picker (360p–1080p+)', 'MP3 extraction 128–320 kbps', 'Playlists & history'],
    repo: 'youtube-downloader'
  },
  {
    name: 'Movie Downloader',
    category: 'Media',
    icon: Film,
    color: '#a855f7',
    desc: 'Torrent downloader with Letterboxd watchlist sync and a built-in video player.',
    features: ['Multi-source torrent search', 'Letterboxd metadata', 'Built-in player & resume'],
    repo: 'movie-downloader'
  },
  {
    name: 'Music Downloader',
    category: 'Media',
    icon: Music,
    color: '#1ed760',
    desc: 'Search YouTube, enrich with Deezer/iTunes metadata and save MP3s with album art.',
    features: ['Smart metadata & cover art', '64–320 kbps MP3 encoding', 'ID3 tags embedded'],
    repo: 'music-downloader'
  },
  {
    name: 'Command Manager',
    category: 'Dev Tools',
    icon: Terminal,
    color: '#0db7ed',
    desc: 'SSH command manager with a beautiful GUI — profile hosts and run commands in one click.',
    features: ['SSH host profiles', 'Styled command components', 'Docker + Windows builds'],
    repo: 'command-manager-docker'
  },
  {
    name: 'VoiceEffect',
    category: 'Audio',
    icon: MicVocal,
    color: '#ff6bcb',
    desc: 'Real-time voice changer with 22 audio and 112 video effects powered by face tracking.',
    features: ['22 audio effects', '112 video effects (MediaPipe)', 'OBS stream integration'],
    repo: 'VoiceEffect'
  },
  {
    name: 'Sondakika',
    category: 'News',
    icon: Newspaper,
    color: '#f59e0b',
    desc: 'Breaking-news reader aggregating 10 major Turkish news sources into one clean app.',
    features: ['10 Turkish RSS sources', 'Dark/light reader UI', 'CLI + GUI versions'],
    repo: 'sondakika',
    bonus: true
  },
  {
    name: 'Speech Type',
    category: 'Productivity',
    icon: Speech,
    color: '#22d3ee',
    desc: 'Fully offline speech-to-text desktop app powered by whisper.cpp — no internet needed.',
    features: ['100% offline transcription', 'Voice commands', 'WebSocket integration API'],
    repo: 'SpeechTypeProject',
    bonus: true
  }
];

const purposes = [
  {
    title: 'The Blog',
    icon: BookOpen,
    link: '/',
    desc: 'In-depth articles and guides about the platform, the tools and software engineering — written from real, hands-on experience.',
    cta: 'Read the articles'
  },
  {
    title: 'The Social Platform',
    icon: Users,
    link: 'https://netcify.netlify.app',
    desc: 'A real-time community where every app has its own room, and users can chat, call and contact each other directly.',
    cta: 'Join the community'
  },
  {
    title: 'The Free Apps Bundle',
    icon: Sparkles,
    link: 'https://eaeoz.github.io/5_Free_Apps_Bundle',
    desc: '7 free, open-source Windows applications — no ads, no trackers, no payment gateways. Free forever.',
    cta: 'Get the apps'
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Me - {import.meta.env.VITE_SITE_NAME || "Sedat's Blog"}</title>
        <meta
          name="description"
          content="About Sedat Ergoz — full-stack developer, remote help desk & support engineer, creator of 7 free open-source apps, a community blog and a real-time social platform."
        />
      </Helmet>

      <motion.div
        className="about-page"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Hero */}
        <motion.section className="about-hero" variants={fadeUp}>
          <div className="about-avatar">SE</div>
          <span className="about-badge">
            <Sparkles size={14} />
            Remote Help Desk · Support Engineer · Full-Stack Developer
          </span>
          <h1>Hi, I'm Sedat Ergoz</h1>
          <p className="about-hero-subtitle">
            I build free, open-source tools and a connected community around them — from desktop
            downloaders and voice effects to a full real-time social platform. This site is where
            the articles, apps and the community all come together.
          </p>

          <div className="about-contact-chips">
            {contactInfo.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="about-chip">
                  <Icon size={16} />
                  <span>{item.value}</span>
                </a>
              );
            })}
          </div>
        </motion.section>

        {/* About paragraphs */}
        <motion.section className="about-section" variants={fadeUp}>
          <span className="about-kicker">About Me</span>
          <h2>A mix of discipline, empathy and code</h2>
          <div className="about-text">
            <p>
              My path started in computer technology at Kocaeli University and continued through
              years of frontline work — first as an on-site technical support specialist at Airties
              Wireless Networks, then as a firefighter in Abu Dhabi for more than a decade. Those
              years taught me how fast real people need working solutions, how to stay calm under
              pressure and how to communicate clearly — skills I now pour into every application I
              build.
            </p>
            <p>
              During the 2020 career break I doubled down on professional growth and taught myself
              modern web and desktop development. Today I design, build and ship complete projects
              on my own: <strong>7 free, open-source Windows applications</strong>, a community blog
              full of practical, hands-on guides, and a <strong>real-time social platform</strong>{' '}
              where users connect, chat and support each other — every app getting its own room.
            </p>
            <p>
              I'm most at home at the intersection of <strong>IT, networking and development</strong>
              . Whether it's subnetting a network, automating with shell scripts, or architecting an
              Electron app with React and Node.js, I like to understand the whole stack and keep
              things reliable, fast and free. Everything I ship is open source — the code is there
              for anyone to read, audit or build themselves.
            </p>
          </div>
        </motion.section>

        {/* Journey */}
        <motion.section className="about-section" variants={fadeUp}>
          <span className="about-kicker">My Journey</span>
          <h2>Education &amp; Experience</h2>
          <div className="about-timeline">
            {journey.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  className="about-timeline-item"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="about-timeline-icon">
                    <Icon size={18} />
                  </div>
                  <div className="about-timeline-body">
                    <span className={`about-timeline-tag about-tag-${item.tag.toLowerCase()}`}>{item.tag}</span>
                    <span className="about-timeline-period">{item.period}</span>
                    <h3>{item.title}</h3>
                    <p className="about-timeline-place">{item.place}</p>
                    <p>{item.desc}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        {/* Skills */}
        <motion.section className="about-section" variants={fadeUp}>
          <span className="about-kicker">Skills</span>
          <h2>What I work with</h2>
          <div className="about-skills-grid">
            {skillGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="about-skill-group">
                  <div className="about-skill-group-title">
                    <Icon size={18} />
                    <h3>{group.title}</h3>
                  </div>
                  <div className="about-skill-tags">
                    {group.skills.map((skill) => (
                      <span key={skill} className="about-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Projects / Applications */}
        <motion.section className="about-section" variants={fadeUp}>
          <span className="about-kicker">My Applications</span>
          <h2>Free, open-source and built from scratch</h2>
          <p className="about-section-description">
            These are the apps I design, code, build and release. Every one of them is 100% free
            and open source — downloadable from GitHub or installable with a single command.
          </p>

          <div className="about-projects-grid">
            {projects.map((project) => {
              const Icon = project.icon;
              return (
                <motion.article
                  key={project.name}
                  className="about-project-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="about-project-head">
                    <div className="about-project-icon" style={{ background: `${project.color}18`, color: project.color, borderColor: `${project.color}40` }}>
                      <Icon size={22} />
                    </div>
                    <div className="about-project-title">
                      <h3>{project.name}</h3>
                      <span className="about-project-category">
                        {project.category}
                        {project.bonus && <em className="about-bonus-badge">Bonus</em>}
                      </span>
                    </div>
                  </div>
                  <p className="about-project-desc">{project.desc}</p>
                  <ul className="about-project-features">
                    {project.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <a
                    className="about-project-link"
                    href={`https://github.com/eaeoz/${project.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View source code
                    <ExternalLink size={14} />
                  </a>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        {/* Website Purpose */}
        <motion.section className="about-section" variants={fadeUp}>
          <span className="about-kicker">What This Site Is About</span>
          <h2>One ecosystem, three ways to get involved</h2>
          <div className="about-purpose-grid">
            {purposes.map((purpose) => {
              const Icon = purpose.icon;
              const isExternal = purpose.link.startsWith('http');
              const Wrapper = isExternal ? 'a' : 'a';
              return (
                <motion.article
                  key={purpose.title}
                  className="about-purpose-card"
                  whileHover={{ y: -6 }}
                >
                  <div className="about-purpose-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{purpose.title}</h3>
                  <p>{purpose.desc}</p>
                  <Wrapper
                    className="about-purpose-link"
                    href={purpose.link}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    onClick={isExternal ? undefined : undefined}
                  >
                    {purpose.cta}
                    <ArrowRight size={15} />
                  </Wrapper>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section className="about-cta" variants={fadeUp}>
          <div className="about-cta-icon">
            <Heart size={24} />
          </div>
          <h2>Let's build something together</h2>
          <p>
            Want to collaborate, have a question, or just say hi? I read every message.
            If this site or any of the apps helped you, a small donation keeps everything free and
            running.
          </p>
          <div className="about-cta-buttons">
            <a className="about-cta-button about-cta-primary" href="/contact">
              <MessageCircle size={18} />
              Contact Me
            </a>
            <a className="about-cta-button about-cta-secondary" href="/donate">
              <Heart size={18} />
              Donate
            </a>
            <a
              className="about-cta-button about-cta-secondary"
              href="https://github.com/eaeoz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={18} />
              GitHub
            </a>
          </div>
          <p className="about-cta-note">
            <Code2 size={14} />
            Free · Open Source · No ads · No payment gateways
          </p>
        </motion.section>
      </motion.div>
    </>
  );
}