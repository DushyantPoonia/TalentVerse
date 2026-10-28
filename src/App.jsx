import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, BookOpen, BriefcaseBusiness, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Compass, GraduationCap, Layers3, Lightbulb, LockKeyhole, Menu, Plus, Rocket, ShieldCheck, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { assessmentApi, authApi, profileApi } from './api.js';
import { getLatestAssessment, loadDashboardData } from './dashboardData.js';

const reveal = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: .55, ease: [.22, 1, .36, 1] } } };
const pathways = ['Product Designer', 'Frontend Developer', 'Data Analyst', 'Product Manager', 'UX Researcher', 'Marketing Strategist'];
const skillsOptions = ['Figma', 'HTML & CSS', 'JavaScript', 'React', 'Python', 'SQL', 'Data visualization', 'User research', 'Wireframing', 'Communication', 'Project management', 'Git'];

function Logo({ light = false }) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="TalentVerse home"><span className="brand-mark"><span /><span /><span /></span><span>talent<span className="brand-bold">verse</span></span></Link>;
}

function Header({ onAuth, token }) {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 12); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  const links = [['Features', '/#features'], ['How it works', '/#how-it-works'], ['FAQ', '/#faq']];
  return <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
    <div className="nav-wrap"><Logo />
      <nav className="desktop-nav" aria-label="Main navigation"><Link to="/#home">Home</Link>{links.map(([name, to]) => <Link to={to} key={name}>{name}</Link>)}</nav>
      <div className="nav-actions">{token ? <Link className="text-button signin" to="/dashboard">My dashboard</Link> : <button className="text-button signin" onClick={() => onAuth('login')}>Sign in</button>}<button className="button button-small" onClick={() => onAuth(token ? 'dashboard' : 'register')}>{token ? 'Dashboard' : 'Get started'} <ArrowUpRight size={15} /></button></div>
      <button className="mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </div>
    <AnimatePresence>{menu && <motion.nav className="mobile-nav" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} aria-label="Mobile navigation">{[['Home', '/#home'], ...links].map(([name, to]) => <Link to={to} onClick={() => setMenu(false)} key={name}>{name}</Link>)}<button onClick={() => { setMenu(false); onAuth('login'); }}>Sign in</button><button className="button" onClick={() => { setMenu(false); onAuth('register'); }}>Get started <ArrowUpRight size={16} /></button></motion.nav>}</AnimatePresence>
  </header>;
}

function ReadinessCard() {
  const reduce = useReducedMotion();
  return <div className="hero-visual">
    <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
    <motion.div className="floating-tag tag-left" animate={reduce ? {} : { y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}><span className="tag-dot" /> New skill unlocked</motion.div>
    <motion.div className="floating-tag tag-right" animate={reduce ? {} : { y: [0, 7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}><Sparkles size={14} /> Your path is taking shape</motion.div>
    <div className="readiness-card">
      <div className="preview-top"><div><span className="eyebrow">ILLUSTRATIVE CAREER SNAPSHOT</span><h3>Product Designer</h3></div><span className="avatar">A</span></div>
      <div className="readiness-main"><div className="readiness-ring"><svg viewBox="0 0 120 120"><circle className="ring-track" cx="60" cy="60" r="48" /><motion.circle className="ring-progress" cx="60" cy="60" r="48" initial={{ strokeDashoffset: 302 }} animate={{ strokeDashoffset: 302 - 302 * .68 }} transition={{ duration: 1.5, delay: .4 }} /></svg><div><strong>68<span>%</span></strong><small>ready to grow</small></div></div><div className="readiness-copy"><span className="status-pill"><span /> Good momentum</span><p>You have a solid foundation. A few focused skills can take you further.</p></div></div>
      <div className="preview-divider" /><div className="skill-head"><span>Skills in your toolkit</span><a href="#assessment">View all <ArrowRight size={13} /></a></div>
      <div className="skill-pills"><span className="skill-pill complete"><Check size={12} /> Figma</span><span className="skill-pill complete"><Check size={12} /> User research</span><span className="skill-pill complete"><Check size={12} /> Wireframing</span><span className="skill-pill missing"><Plus size={12} /> Design systems</span></div>
      <div className="next-step"><span className="next-icon"><Lightbulb size={17} /></span><div><small>YOUR NEXT BEST STEP</small><strong>Build a portfolio case study</strong></div><ArrowUpRight size={17} /></div>
    </div>
    <div className="hero-note"><span className="mini-avatars"><i>A</i><i>J</i><i>M</i></span><span>Made for your kind of ambition</span></div>
  </div>;
}

function SectionTitle({ kicker, title, text, centered = false }) {
  return <motion.div className={`section-title ${centered ? 'centered' : ''}`} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: .25 }}>
    <span className="eyebrow">{kicker}</span><h2>{title}</h2>{text && <p>{text}</p>}
  </motion.div>;
}

function ProblemSection() {
  const problems = [
    { icon: Compass, n: '01', title: 'The skill maze', desc: 'You know where you want to go, but it’s hard to tell which skills will actually get you there.', tone: 'peach' },
    { icon: Layers3, n: '02', title: 'Learning without a map', desc: 'Another course, another bookmark. Without a focused plan, progress can feel scattered.', tone: 'lavender' },
    { icon: BriefcaseBusiness, n: '03', title: 'Nothing to show for it', desc: 'Knowing a tool is one thing. Turning that knowledge into proof of your ability is another.', tone: 'mint' }
  ];
  return <section className="section problem-section" id="features"><div className="container"><SectionTitle kicker="A familiar feeling?" title={<>Potential isn’t the problem.<br /><span>Direction is.</span></>} text="Getting started shouldn’t mean figuring everything out alone." centered />
    <div className="problem-grid">{problems.map(({ icon: Icon, ...p }, i) => <motion.article className="problem-card" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * .08 }} key={p.n}><div className={`problem-icon ${p.tone}`}><Icon size={21} /></div><span className="problem-number">{p.n}</span><h3>{p.title}</h3><p>{p.desc}</p><div className={`card-scribble ${p.tone}`} /></motion.article>)}</div>
  </div></section>;
}

function JourneySection() {
  const journey = [
    ['01', 'Start with you', 'Tell us about your interests, experience, and where you’d like to go.', GraduationCap],
    ['02', 'See the whole picture', 'A practical assessment maps your strengths against real career skills.', Target],
    ['03', 'Get your next steps', 'Know what to learn next, what to build, and where to focus your time.', Sparkles],
    ['04', 'Keep the momentum', 'Track your progress and shape your roadmap as your goals evolve.', TrendingUp]
  ];
  return <section className="section journey-section" id="how-it-works"><div className="container"><SectionTitle kicker="A clearer way forward" title={<>From “where do I start?”<br />to <span>“what’s next?”</span></>} text="A thoughtful process built around your goals, not a one-size-fits-all checklist." />
    <div className="journey-grid">{journey.map(([n, title, desc, Icon], i) => <motion.article className="journey-step" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: i * .1 }} key={n}><div className="journey-icon"><Icon size={21} /></div><span className="step-count">STEP {n}</span><h3>{title}</h3><p>{desc}</p>{i < journey.length - 1 && <ArrowRight className="journey-arrow" size={18} />}</motion.article>)}</div>
  </div></section>;
}

function ProductPreview() {
  const [done, setDone] = useState([true, false, false]);
  return <section className="section preview-section"><div className="container preview-layout">
    <motion.div className="preview-copy" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}><span className="eyebrow">A roadmap that feels like yours</span><h2>Small steps.<br /><span>Real momentum.</span></h2><p>Skip the vague advice. Get a clear view of your current strengths, what to build next, and a plan that respects the time you actually have.</p><ul className="check-list"><li><Check size={16} /> Priorities grounded in your target role</li><li><Check size={16} /> Projects that turn skills into proof</li><li><Check size={16} /> A flexible plan you can make your own</li></ul><Link to="/assessment" className="inline-link">Build your roadmap <ArrowRight size={16} /></Link></motion.div>
    <motion.div className="dashboard-mock" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
      <div className="mock-header"><div className="mock-brand"><span className="brand-mark tiny"><span /><span /><span /></span> Your growth space <span className="demo-badge">DEMO</span></div><div className="mock-user">A</div></div>
      <div className="mock-greeting"><div><span className="eyebrow">AN EXAMPLE LEARNING PLAN</span><h3>Your next chapter, Alex.</h3></div><span className="mock-streak"><Sparkles size={13} /> Week 2</span></div>
      <div className="mock-panels"><div className="mock-panel readiness-panel"><div className="panel-title">Career readiness <span>?</span></div><div className="mini-chart"><div className="mini-gauge"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /><circle className="chart-stroke" cx="50" cy="50" r="40" /></svg><b>68<small>%</small></b></div><div><b>Product Designer</b><small>Example estimate</small><div className="micro-bars"><i /><i /><i /><i /></div></div></div><small className="footnote">Illustration only—not an employability score</small></div>
        <div className="mock-panel skills-panel"><div className="panel-title">Skills snapshot <a href="#assessment">Details <ArrowRight size={12} /></a></div><div className="skill-row"><span>Visual design</span><div className="bar"><i style={{ width: '84%' }} /></div><b>Strong</b></div><div className="skill-row"><span>User research</span><div className="bar"><i style={{ width: '62%' }} /></div><b>Growing</b></div><div className="skill-row"><span>Design systems</span><div className="bar muted"><i style={{ width: '24%' }} /></div><b>Explore</b></div></div></div>
      <div className="mock-panel roadmap-panel"><div className="panel-title">This week <span className="week-pill">3 focused steps</span></div>{['Review a design system case study', 'Map a checkout flow in Figma', 'Write up your design decisions'].map((task, i) => <button className={`task-row ${done[i] ? 'task-done' : ''}`} key={task} onClick={() => setDone(done.map((d, index) => index === i ? !d : d))} aria-pressed={done[i]}><span className="task-check">{done[i] && <Check size={12} />}</span><span>{task}</span><small>{i === 0 ? '20 min' : i === 1 ? '45 min' : '30 min'}</small></button>)}</div>
      <div className="mock-footer"><span><span className="green-dot" /> 1 of 3 steps complete</span><div className="footer-progress"><i style={{ width: `${done.filter(Boolean).length / 3 * 100}%` }} /></div></div>
    </motion.div>
  </div></section>;
}

function FeaturesSection() {
  const features = [
    [Sparkles, 'AI skill gap analysis', 'Understand how your current strengths connect to the skills your target role calls for.'],
    [Compass, 'A roadmap with direction', 'Turn your goals into a thoughtful sequence of learning and practical action.'],
    [Target, 'Priorities that make sense', 'Focus on the skills that matter most for your next step—not every skill on the internet.'],
    [Rocket, 'Projects with a purpose', 'Practice with project ideas designed to help you apply skills and show your thinking.'],
    [BarChart3, 'Progress you can see', 'Keep track of roadmap milestones and revisit your readiness as you grow.'],
    [BookOpen, 'Your journey, in one place', 'Return to your saved assessments and see how your goals and plans have changed.']
  ];
  return <section className="section features-section"><div className="container"><SectionTitle kicker="Built for the in-between" title="Everything you need to make your next move" text="A connected set of tools for the curious, the ambitious, and the still-figuring-it-out." centered /><div className="feature-grid">{features.map(([Icon, title, desc], i) => <motion.article className="feature-card" variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: (i % 3) * .08 }} key={title}><span className="feature-icon"><Icon size={20} /></span><h3>{title}</h3><p>{desc}</p><ArrowUpRight className="feature-arrow" size={18} /></motion.article>)}</div></div></section>;
}

function StorySection() {
  return <section className="section story-section"><div className="container story-card"><div className="story-copy"><span className="eyebrow">A SMALL STEP, A BIGGER PICTURE</span><h2>From “maybe someday”<br />to <span>“I made this.”</span></h2><p>Meet Maya—a fictional example of a student who liked design but didn’t know what to learn next. With a focused roadmap, she chose one skill, built one project, and found a way to show her work.</p><div className="story-disclaimer"><ShieldCheck size={16} /> Fictional illustration. Outcomes vary, and no career result is guaranteed.</div><Link to="/assessment" className="button">Find your starting point <ArrowRight size={16} /></Link></div><div className="story-art"><div className="story-sun" /><div className="story-path"><span /><span /><span /></div><div className="story-quote"><span>HER FIRST PROJECT</span><strong>“A kinder checkout flow”</strong><small>Thoughtful problem-solving, made visible.</small></div><div className="story-stamp"><span>ONE<br />STEP<br /><b>AT A<br />TIME</b></span></div><div className="leaf-shape leaf-a" /><div className="leaf-shape leaf-b" /></div></div></section>;
}

const faqs = [
  ['What does the assessment ask?', 'It asks about your target career, experience, skills, goals, location, available learning time, and any projects you have already worked on. You can update your profile and take a new assessment as your plans change.'],
  ['How are recommendations generated?', 'TalentVerse combines the profile you provide with a maintained set of career skill requirements and an external language-model analysis. Recommendations are suggestions to explore—not hiring advice or a guarantee of outcomes.'],
  ['What happens to my personal data?', 'Your assessments and saved roadmaps are associated with your account so you can return to them. Configure your own database and deployment environment; never put API secrets in the browser. Review our privacy notice for details.'],
  ['Can I customize my roadmap?', 'Yes. Roadmap steps are starting points, and you can mark progress as you complete them. Your available time and goals help shape the initial plan.'],
  ['What does the readiness estimate mean?', 'It is a transparent estimate based on self-reported skill coverage against the selected role’s requirements. It is not a measure of employability, a probability of getting hired, or a formal assessment.']
];

function FaqSection() {
  const [open, setOpen] = useState(0);
  return <section className="section faq-section" id="faq"><div className="container faq-layout"><div><span className="eyebrow">GOOD QUESTIONS</span><h2>A little more<br /><span>clarity.</span></h2><p>Something else on your mind? We’re happy to help.</p><a className="inline-link" href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'hello@talentverse.example'}`}>Get in touch <ArrowRight size={16} /></a></div><div className="faq-list">{faqs.map(([question, answer], i) => <div className={`faq-item ${open === i ? 'faq-open' : ''}`} key={question}><button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{question}</span><ChevronDown size={18} /></button><AnimatePresence initial={false}>{open === i && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>;
}

function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-cta"><div><span className="eyebrow">YOUR NEXT STEP STARTS HERE</span><h2>Make room for what’s next.</h2><p>One thoughtful assessment can make the path ahead feel a little clearer.</p></div><Link className="button button-lime" to="/assessment">Build my roadmap <ArrowUpRight size={17} /></Link></div><div className="footer-bottom"><Logo light /><span>© {new Date().getFullYear()} TalentVerse. Made for your next chapter.</span><div><Link to="/#features">Features</Link><Link to="/#how-it-works">How it works</Link><Link to="/#faq">FAQ</Link><Link to="/privacy">Privacy</Link><a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'hello@talentverse.example'}`}>Contact</a></div></div></div></footer>;
}

function Landing({ onAuth, token, onSessionExpired }) {
  return <><Header onAuth={onAuth} token={token} /><main><section className="hero" id="home"><div className="hero-grid-pattern" /><div className="container hero-layout"><motion.div className="hero-copy" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .12 } } }}><motion.div variants={reveal} className="hero-kicker"><span className="kicker-spark">✳</span> YOUR CAREER, WITH A LITTLE MORE CLARITY</motion.div><motion.h1 variants={reveal}>Turn your skills into your <span>next career move.</span></motion.h1><motion.p variants={reveal}>TalentVerse helps you spot your skill gaps and build a personalized roadmap—so you can move forward with a plan that feels like yours.</motion.p><motion.div variants={reveal} className="hero-buttons"><Link className="button" to="/assessment">Build my career roadmap <ArrowRight size={17} /></Link><a className="button button-outline" href="#how-it-works"><span className="play-icon">▶</span> See how it works</a></motion.div><motion.div variants={reveal} className="hero-footnote"><span><Check size={14} /> Made for students & early-career talent</span><i /> No guesswork. Just a next step.</motion.div></motion.div><ReadinessCard /></div><a href="#problems" className="scroll-cue" aria-label="Scroll to learn more"><ArrowDown size={16} /></a></section>
    <div id="problems"><ProblemSection /></div><JourneySection /><ProductPreview /><FeaturesSection /><StorySection /><AssessmentSection onAuth={(mode) => onAuth(mode, '/#assessment')} onSessionExpired={onSessionExpired} token={token} /><FaqSection /></main><Footer /></>;
}

const assessmentSteps = [
  { title: 'Where do you want to go?', sub: 'Choose a career path that feels exciting—or at least worth exploring.', key: 'targetCareer', type: 'career' },
  { title: 'What’s your experience so far?', sub: 'There’s no wrong starting point. This helps us meet you where you are.', key: 'experience', type: 'experience' },
  { title: 'What skills are already in your toolkit?', sub: 'Pick anything you have tried, practiced, or want to build on.', key: 'skills', type: 'skills' },
  { title: 'What does your next chapter look like?', sub: 'A few details help make your roadmap fit your life right now.', key: 'goal', type: 'goal' }
];
const initialAssessment = { targetCareer: '', experience: '', skills: [], goal: '', education: '', targetRegion: '', weeklyHours: 5, projects: '' };

function AssessmentSection({ onAuth, onSessionExpired, token }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialAssessment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));
  const active = assessmentSteps[step];
  const valid = active.type === 'career' ? !!data.targetCareer.trim() : active.type === 'experience' ? !!data.experience && !!data.education : active.type === 'skills' ? data.skills.length > 0 && data.skills.length <= 40 : !!data.goal && !!data.targetRegion.trim() && data.weeklyHours >= 1 && data.weeklyHours <= 40;
  const submitAssessment = async () => {
    if (busy) return;
    if (!token) { setError('Sign in or create a free account to save your roadmap.'); onAuth('register'); return; }
    setBusy(true); setError('');
    try {
      const response = await assessmentApi.create(token, data);
      if (!response?.analysis || typeof response.analysis !== 'object') throw new Error('The API returned an incomplete roadmap. Please try again.');
      setResult(response.analysis);
    } catch (e) {
      if (e.status === 401) {
        onSessionExpired();
        setError('Your session has expired. Sign in again to save this roadmap.');
        onAuth('login');
      } else setError(e.message);
    } finally { setBusy(false); }
  };
  const toggleSkill = (skill) => update('skills', data.skills.includes(skill) ? data.skills.filter((s) => s !== skill) : [...data.skills, skill]);
  return <section className="section assessment-section" id="assessment"><div className="container"><SectionTitle kicker="Your next move starts here" title={<>Let’s find your <span>starting point.</span></>} text="A few thoughtful questions. A plan you can actually use." centered />
    <div className="assessment-shell">
      {result ? <div className="result-view"><div className="result-success"><span><Check size={22} /></span><div><span className="eyebrow">YOUR ROADMAP IS READY</span><h3>{result.suggestedPaths?.[0]?.title || data.targetCareer}</h3><p>{result.suggestedPaths?.[0]?.explanation}</p></div></div><div className="result-readiness"><strong>{result.readiness?.score ?? '—'}<small>%</small></strong><span>readiness estimate</span><p>{result.readiness?.explanation}</p></div>{result.suggestedPaths?.length > 1 && <div className="result-paths"><h4>Other paths worth exploring</h4>{result.suggestedPaths.slice(1).map((path) => <div key={path.title}><b>{path.title}</b><p>{path.explanation}</p></div>)}</div>}<div className="result-grid"><div><h4>Build on these strengths</h4>{result.currentSkills?.map((s) => <span className="result-tag" key={s}>{s}</span>)}</div><div><h4>Skills to explore</h4>{result.skillGaps?.map((s) => <span className="result-tag gap" title={s.reason} key={s.skill}>{s.skill}</span>)}</div></div><h4>Your first next steps</h4><ol className="result-list">{result.nextSteps?.map((s, i) => <li key={s}><b>0{i + 1}</b>{s}</li>)}</ol><section className="result-section"><h4>Projects to make your skills visible</h4>{result.projects?.map((project) => <article className="result-project" key={project.title}><b>{project.title}</b><p>{project.description}</p><small>{project.skills.join(' · ')}</small></article>)}</section><section className="result-section"><h4>Your week-by-week roadmap</h4>{result.roadmap?.map((week) => <article className="result-week" key={week.week}><span>WEEK {week.week}</span><div><b>{week.theme}</b><p>{week.tasks.join(' · ')}</p><small>{week.estimatedHours} hours</small></div></article>)}</section><button className="button" onClick={() => { setResult(null); setStep(0); setData(initialAssessment); }}>Start another assessment <ArrowRight size={16} /></button></div> : <div className="assessment-content">
        <aside className="assessment-aside"><div className="aside-icon"><Sparkles size={21} /></div><span className="eyebrow">YOUR ROADMAP BUILDER</span><h3>Good things start with a little curiosity.</h3><p>This is about finding your next step—not having all the answers today.</p><div className="aside-bottom"><div className="aside-progress"><i style={{ width: `${(step + 1) / assessmentSteps.length * 100}%` }} /></div><span>About 3 minutes</span><LockKeyhole size={15} /></div></aside>
        <div className="assessment-form"><div className="form-top"><span>STEP {step + 1} <i /> {assessmentSteps.length}</span><div className="step-dots">{assessmentSteps.map((_, i) => <i key={i} className={i <= step ? 'active' : ''} />)}</div></div>
          <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: .2 }}>
            <h3>{active.title}</h3><p className="form-sub">{active.sub}</p>
            {active.type === 'career' && <div className="choice-grid career-options">{pathways.map((career) => <button type="button" className={`choice-card ${data.targetCareer === career ? 'selected' : ''}`} onClick={() => update('targetCareer', career)} key={career}><BriefcaseBusiness size={17} />{career}<span /></button>)}<label className="input-label full">Or add a different path<input placeholder="e.g. Climate Data Scientist" value={pathways.includes(data.targetCareer) ? '' : data.targetCareer} onChange={(e) => update('targetCareer', e.target.value)} /></label></div>}
            {active.type === 'experience' && <div className="form-fields"><label className="input-label">Your experience<select value={data.experience} onChange={(e) => update('experience', e.target.value)}><option value="">Choose your starting point</option><option>Just getting started</option><option>Some personal or academic projects</option><option>Internship or up to 2 years</option><option>2+ years of experience</option></select></label><label className="input-label">Education or current study<select value={data.education} onChange={(e) => update('education', e.target.value)}><option value="">Choose one</option><option>High school</option><option>Undergraduate</option><option>Graduate</option><option>Self-taught / other</option></select></label></div>}
            {active.type === 'skills' && <><div className="skill-select">{skillsOptions.map((skill) => <button type="button" key={skill} className={`select-chip ${data.skills.includes(skill) ? 'selected' : ''}`} onClick={() => toggleSkill(skill)}>{data.skills.includes(skill) && <Check size={13} />}{skill}</button>)}</div><label className="input-label inline-field">Tools or skills not listed<input placeholder="Add your own (optional)" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { e.preventDefault(); const value = e.currentTarget.value.trim(); if (!data.skills.includes(value)) update('skills', [...data.skills, value]); e.currentTarget.value = ''; } }} /></label></>}
            {active.type === 'goal' && <div className="form-fields"><label className="input-label">What would you love to achieve?<select value={data.goal} onChange={(e) => update('goal', e.target.value)}><option value="">Choose a goal</option><option>Land my first role</option><option>Find an internship</option><option>Build a portfolio</option><option>Explore a career change</option><option>Grow in my current role</option></select></label><div className="two-fields"><label className="input-label">Target region<input placeholder="e.g. Remote, India" value={data.targetRegion} onChange={(e) => update('targetRegion', e.target.value)} /></label><label className="input-label">Hours per week<input type="number" min="1" max="40" value={data.weeklyHours} onChange={(e) => update('weeklyHours', Number(e.target.value))} /></label></div><label className="input-label">Projects or proof of work (optional)<textarea rows="2" placeholder="Anything you’ve made, contributed to, or are proud of…" value={data.projects} onChange={(e) => update('projects', e.target.value)} /></label></div>}
          </motion.div></AnimatePresence>
          {error && <div className="error-message" role="alert">{error}</div>}<div className="assessment-controls">{step > 0 && <button className="back-button" onClick={() => { setError(''); setStep(step - 1); }}><ChevronLeft size={17} /> Back</button>}{step < assessmentSteps.length - 1 ? <button className="button" disabled={!valid} onClick={() => { setError(''); setStep(step + 1); }}>Continue <ChevronRight size={17} /></button> : <button className="button" disabled={!valid || busy} onClick={submitAssessment}>{busy ? 'Building your roadmap…' : 'Create my roadmap'} <ArrowRight size={17} /></button>}</div>
          {!token && <p className="assessment-signin">Already have an account? <button onClick={() => onAuth('login')}>Sign in</button> after finishing to save your assessment.</p>}
        </div></div>}
    </div>
  </div></section>;
}

function AuthModal({ mode, onClose, onMode, onAuthenticated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const handler = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', handler); document.body.style.overflow = 'hidden'; return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; }; }, [onClose]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const { token } = await authApi[mode]({ ...form, name: form.name }); localStorage.setItem('tv_token', token); onAuthenticated(token); onClose(); }
    catch (e2) { setError(e2.message); } finally { setBusy(false); }
  };
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}><motion.div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="auth-modal" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button><Logo /><span className="eyebrow">{mode === 'register' ? 'A GOOD PLACE TO BEGIN' : 'WELCOME BACK'}</span><h2 id="auth-title">{mode === 'register' ? 'Make your next move.' : 'Pick up where you left off.'}</h2><p>{mode === 'register' ? 'Create your free account to save your roadmap.' : 'Sign in to revisit your roadmap.'}</p><form onSubmit={submit}>{mode === 'register' && <label className="input-label">Your name<input required minLength="2" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}<label className="input-label">Email address<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label className="input-label">Password<input required type="password" minLength="8" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <div className="error-message" role="alert">{error}</div>}<button className="button auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button></form><div className="auth-toggle">{mode === 'register' ? 'Already have an account?' : 'New to TalentVerse?'} <button onClick={() => { setError(''); onMode(mode === 'register' ? 'login' : 'register'); }}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button></div><small className="auth-privacy"><LockKeyhole size={12} /> Your career journey stays yours.</small></motion.div></motion.div>;
}

function AssessmentPage({ onAuth, onSessionExpired, token }) {
  const assessmentAuth = (mode) => onAuth(mode, '/assessment');
  return <><Header onAuth={assessmentAuth} token={token} /><main><AssessmentSection onAuth={assessmentAuth} onSessionExpired={onSessionExpired} token={token} /></main><Footer /></>;
}

function NotFoundPage() {
  return <main className="privacy-page"><header className="privacy-header"><Logo /><Link className="inline-link" to="/">Back to TalentVerse <ArrowRight size={15} /></Link></header><article className="privacy-content"><span className="eyebrow">PAGE NOT FOUND</span><h1>This path needs a new direction.</h1><p className="privacy-lead">That page doesn’t exist, but your next step still can.</p><Link className="button" to="/">Return to TalentVerse <ArrowRight size={16} /></Link></article><footer className="privacy-footer"><Logo /><span>Make room for what’s next.</span></footer></main>;
}

function PrivacyPage() {
  const contact = import.meta.env.VITE_CONTACT_EMAIL || 'hello@talentverse.example';
  return <main className="privacy-page"><header className="privacy-header"><Logo /><Link className="inline-link" to="/">Back to TalentVerse <ArrowRight size={15} /></Link></header><article className="privacy-content"><span className="eyebrow">YOUR DATA, YOUR JOURNEY</span><h1>Privacy at TalentVerse</h1><p className="privacy-lead">TalentVerse uses the information you provide to create and save career learning recommendations. This page describes the data handling built into this application.</p><h2>Information we store</h2><p>When you register, the service stores your name, email address, and a securely hashed password. If you complete an assessment, your career goal, experience, education, skills, target region, learning time, project notes, generated analysis, and roadmap progress are stored with your account in MongoDB.</p><h2>AI recommendations</h2><p>To create an analysis, the API sends assessment details and the selected career's skill requirements to the configured external language-model provider. The provider API key is held by the server and is not sent to your browser. Review your provider's privacy and data-retention terms before configuring it.</p><h2>How to manage your information</h2><p>Your information is used to provide your profile, assessment history, and roadmap. For access, correction, or deletion requests, contact the operator of the TalentVerse deployment at <a href={`mailto:${contact}`}>{contact}</a>. The deployment operator is responsible for configuring the database, provider, retention, and contact address.</p><h2>Security and deployment</h2><p>Passwords are hashed before storage and private records are scoped to the signed-in account. Authentication tokens are stored in your browser's local storage. This application does not promise a particular retention period; that depends on the operator's deployment and database practices.</p><p className="privacy-updated">Last updated: October 28, 2026</p><Link className="button" to="/">Return to TalentVerse <ArrowRight size={16} /></Link></article><footer className="privacy-footer"><Logo /><span>Make room for what’s next.</span></footer></main>;
}

function Dashboard({ token, onLogout }) {
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ education: '', experience: '', targetRegion: '', skills: [], goal: '', weeklyHours: 5, projects: '' });
  const [editProfile, setEditProfile] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [progressBusy, setProgressBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setHistoryError('');
    setProfileError('');
    loadDashboardData({
      getUser: () => authApi.me(token),
      getHistory: () => assessmentApi.history(token),
      getProfile: () => profileApi.get(token)
    }).then(({ user: account, history: savedAssessments, profile: savedProfile, errors }) => {
      if (!active) return;
      setUser(account);
      setHistory(savedAssessments);
      setProfile(savedProfile || { education: '', experience: '', targetRegion: '', skills: [], goal: '', weeklyHours: 5, projects: '' });
      setError(errors.user?.message || '');
      setHistoryError(errors.history?.message || '');
      setProfileError(errors.profile?.message || '');
      if (errors.user?.status === 401) onLogout();
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, refreshKey]);
  const latest = getLatestAssessment(history);
  useEffect(() => {
    const id = history[0]?._id;
    if (!id) {
      setCompletedTasks([]);
      return;
    }
    let active = true;
    assessmentApi.progress(token, id).then(({ progress }) => {
      if (active) setCompletedTasks(progress?.completedTasks || []);
    }).catch((e) => { if (active) setProfileMessage(`Could not load roadmap progress: ${e.message}`); });
    return () => { active = false; };
  }, [history, token]);
  const saveProfile = async (e) => {
    e.preventDefault();
    if (profileBusy) return;
    setProfileBusy(true); setProfileMessage('');
    try {
      const { education, experience, targetRegion, skills, goal, weeklyHours, projects } = profile;
      const response = await profileApi.update(token, { education, experience, targetRegion, skills, goal, weeklyHours, projects });
      setProfile(response.profile || profile); setProfileError(''); setEditProfile(false); setProfileMessage('Profile saved.');
    }
    catch (e2) { setProfileMessage(e2.message); }
    finally { setProfileBusy(false); }
  };
  const toggleTask = async (key) => {
    if (progressBusy || !history[0]) return;
    const next = completedTasks.includes(key) ? completedTasks.filter((item) => item !== key) : [...completedTasks, key];
    setCompletedTasks(next); setProgressBusy(true); setProfileMessage('');
    try { await assessmentApi.updateProgress(token, history[0]._id, next); }
    catch (e) { setCompletedTasks(completedTasks); setProfileMessage(`Could not save your progress: ${e.message}`); }
    finally { setProgressBusy(false); }
  };
  return <div className="dashboard-page"><header className="dashboard-nav"><Logo /><div><span>{user?.name ? `Hi, ${user.name}` : 'Your growth space'}</span><button className="text-button" onClick={onLogout}>Sign out</button></div></header><main className="dashboard-main">
    <div className="dashboard-welcome"><div><span className="eyebrow">YOUR TALENTVERSE</span><h1>Your next chapter, at your pace.</h1><p>A little progress is still progress. Here’s where you’re headed.</p></div><div className="dashboard-actions"><button className="button button-outline" onClick={() => setEditProfile(!editProfile)}>Edit profile</button><Link to="/assessment" className="button">New assessment <Plus size={17} /></Link></div></div>
    {profileMessage && <p className="profile-message" role="status">{profileMessage}</p>}
    {error && <div className="dashboard-error" role="alert">{error}<button onClick={() => setRefreshKey((current) => current + 1)}>Retry</button><button onClick={onLogout}>Sign out</button></div>}
    {historyError && <div className="dashboard-error" role="alert">Could not load assessment history: {historyError}<button onClick={() => setRefreshKey((current) => current + 1)}>Retry</button></div>}
    {profileError && <div className="profile-message" role="alert">Could not load your profile: {profileError}<button onClick={() => setRefreshKey((current) => current + 1)}>Retry</button></div>}
    {editProfile && <form className="dash-card profile-form" onSubmit={saveProfile}><div className="panel-title">Your profile <button className="back-button" type="button" onClick={() => setEditProfile(false)}>Cancel</button></div><div className="profile-fields"><label className="input-label">Education<input value={profile.education || ''} onChange={(e) => setProfile({ ...profile, education: e.target.value })} /></label><label className="input-label">Experience<input value={profile.experience || ''} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} /></label><label className="input-label">Target region<input value={profile.targetRegion || ''} onChange={(e) => setProfile({ ...profile, targetRegion: e.target.value })} /></label><label className="input-label">Weekly learning hours<input type="number" min="1" max="40" required value={profile.weeklyHours || 5} onChange={(e) => setProfile({ ...profile, weeklyHours: Number(e.target.value) })} /></label><label className="input-label profile-wide">Career goal<input value={profile.goal || ''} onChange={(e) => setProfile({ ...profile, goal: e.target.value })} /></label><label className="input-label profile-wide">Projects and proof of work<textarea rows="2" value={profile.projects || ''} onChange={(e) => setProfile({ ...profile, projects: e.target.value })} /></label><button className="button profile-wide" disabled={profileBusy}>{profileBusy ? 'Saving…' : 'Save profile'} <Check size={16} /></button></div></form>}
    {loading ? <div className="empty-dashboard" role="status"><div><Sparkles size={24} /></div><h2>Loading your growth space…</h2><p>Gathering your profile and saved roadmap.</p></div> : historyError ? null : history.length ? <>
      <div className="dashboard-overview"><div className="dash-card readiness-dash"><span className="eyebrow">LATEST READINESS ESTIMATE</span><div className="dash-score">{latest?.readiness?.score ?? '—'}<small>%</small></div><p>{latest?.readiness?.explanation}</p><span className="career-badge"><BriefcaseBusiness size={15} /> {latest?.assessment?.targetCareer}</span></div><div className="dash-card skills-dash"><span className="eyebrow">YOUR SKILLS TO EXPLORE</span><h3>Build your next layer</h3>{latest?.skillGaps.slice(0, 4).map((g, index) => <div className="gap-row" key={g.skill || index}><span>{g.skill}</span><span className={`priority priority-${g.priority}`}>{g.priority}</span></div>)}</div></div>
      <div className="dash-card dash-roadmap"><div className="panel-title">Your next steps <span>{latest?.roadmap.length || 0} weeks</span></div>{latest?.roadmap.map((week, index) => <article className="week-card" key={week.week ?? index}><span className="week-number">WEEK {week.week}</span><div><h4>{week.theme}</h4><div className="week-tasks">{week.tasks.map((task, taskIndex) => { const taskKey = `week-${week.week ?? index}:${task}`; const checked = completedTasks.includes(taskKey); return <button key={`${taskKey}-${taskIndex}`} className={`roadmap-task ${checked ? 'is-complete' : ''}`} onClick={() => toggleTask(taskKey)} aria-pressed={checked}><span className="task-check">{checked && <Check size={12} />}</span>{task}</button>; })}</div><small><Clock3 size={13} /> {week.estimatedHours} hours</small></div></article>)}</div>
      {latest?.projects.length > 0 && <div className="dash-card dashboard-projects"><div className="panel-title">Projects to make your skills visible <span>{latest.projects.length} ideas</span></div><div className="dashboard-project-grid">{latest.projects.map((project, index) => <article className="dashboard-project" key={project.title || index}><span className="feature-icon"><Rocket size={17} /></span><h3>{project.title}</h3><p>{project.description}</p><small>{project.skills.join(' · ')}</small></article>)}</div></div>}
      <div className="dash-card assessment-history"><div className="panel-title">Assessment history <span>{history.length} saved</span></div>{history.map((item, index) => <div className="history-row" key={item._id || index}><span className="history-icon"><Target size={17} /></span><div><b>{item.assessment?.targetCareer || 'Career assessment'}</b><small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</small></div><span className="history-score">{item.readiness?.score ?? '—'}%</span></div>)}</div>
    </> : <div className="empty-dashboard"><div><Sparkles size={24} /></div><h2>Your roadmap is waiting.</h2><p>Start with a short assessment and get a thoughtful plan shaped around your goals.</p><Link to="/assessment" className="button">Build my first roadmap <ArrowRight size={17} /></Link></div>}
  </main><footer className="dashboard-footer"><Logo /><span>Make room for what’s next.</span></footer></div>;
}

export default function App() {
  const [authMode, setAuthMode] = useState(null);
  const [authReturnTo, setAuthReturnTo] = useState('/dashboard');
  const [token, setToken] = useState(() => localStorage.getItem('tv_token'));
  const navigate = useNavigate();
  const onAuth = (mode, returnTo = '/dashboard') => {
    if (mode === 'close') setAuthMode(null);
    else if (mode === 'dashboard') navigate('/dashboard');
    else { setAuthReturnTo(returnTo); setAuthMode(mode); }
  };
  const logout = () => { localStorage.removeItem('tv_token'); setToken(null); navigate('/'); };
  const handleSessionExpired = () => { localStorage.removeItem('tv_token'); setToken(null); };
  const handleAuthenticated = (value) => { setToken(value); navigate(authReturnTo); };
  return <MotionConfig reducedMotion="user"><><Routes><Route path="/" element={<Landing onAuth={onAuth} onSessionExpired={handleSessionExpired} token={token} />} /><Route path="/assessment" element={<AssessmentPage onAuth={onAuth} onSessionExpired={handleSessionExpired} token={token} />} /><Route path="/dashboard" element={token ? <Dashboard token={token} onLogout={logout} /> : <Navigate to="/" replace />} /><Route path="/privacy" element={<PrivacyPage />} /><Route path="*" element={<NotFoundPage />} /></Routes><AnimatePresence>{authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onMode={setAuthMode} onAuthenticated={handleAuthenticated} />}</AnimatePresence></></MotionConfig>;
}
