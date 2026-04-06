'use client';
import { motion } from 'framer-motion';
import { FileText, Copy, Check, Sparkles, Download, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function TailoredResumePreview({ data, onBack }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    let text = `SUMMARY\n${data.summary}\n\nEXPERIENCE\n`;
    data.experience.forEach(exp => {
      text += `${exp.role} | ${exp.company} (${exp.period})\n`;
      exp.bullets.forEach(b => text += `- ${b}\n`);
      text += `\n`;
    });
    text += `SKILLS\n${data.skills.join(', ')}\n\nEDUCATION\n`;
    data.education.forEach(edu => {
      text += `${edu.degree} | ${edu.school} (${edu.year})\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="tailored-preview-container"
    >
      <div className="preview-header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back to Analysis
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copyToClipboard} className="btn btn-primary btn-sm">
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Content</>}
          </button>
        </div>
      </div>

      <div className="resume-paper">
        <div className="resume-badge">
          <Sparkles size={12} /> AI Tailored
        </div>

        {/* Summary */}
        <section className="resume-section">
          <h2 className="section-title">Professional Summary</h2>
          <p className="summary-text">{data.summary}</p>
        </section>

        {/* Experience */}
        <section className="resume-section">
          <h2 className="section-title">Experience</h2>
          <div className="experience-list">
            {data.experience.map((exp, i) => (
              <div key={i} className="experience-item">
                <div className="experience-header">
                  <div className="role-company">
                    <span className="role">{exp.role}</span>
                    <span className="company">@{exp.company}</span>
                  </div>
                  <span className="period">{exp.period}</span>
                </div>
                <ul className="bullet-list">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="resume-section">
          <h2 className="section-title">Skills & Technologies</h2>
          <div className="skills-grid">
            {data.skills.map((skill, i) => (
              <span key={i} className="skill-chip">{skill}</span>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="resume-section">
          <h2 className="section-title">Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} className="edu-item">
              <span className="degree">{edu.degree}</span>
              <span className="school">{edu.school}</span>
              <span className="year">{edu.year}</span>
            </div>
          ))}
        </section>
      </div>

      <style jsx>{`
        .tailored-preview-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .resume-paper {
          background: var(--bg-card);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 60px;
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
          color: var(--text-primary);
        }
        .resume-badge {
          position: absolute;
          top: 30px;
          right: 30px;
          background: rgba(var(--accent-rgb), 0.1);
          color: var(--accent);
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(var(--accent-rgb), 0.2);
        }
        .resume-section {
          margin-bottom: 40px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border-bottom: 1px solid var(--border-soft);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .summary-text {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-primary);
          font-weight: 400;
        }
        .experience-item {
          margin-bottom: 28px;
        }
        .experience-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 12px;
        }
        .role {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .company {
          font-size: 15px;
          font-weight: 500;
          color: var(--accent);
          margin-left: 8px;
        }
        .period {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .bullet-list {
          margin: 0;
          padding-left: 18px;
          list-style-type: none;
        }
        .bullet-list li {
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 8px;
          color: var(--text-secondary);
          position: relative;
        }
        .bullet-list li::before {
          content: "—";
          position: absolute;
          left: -20px;
          color: var(--border);
        }
        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .skill-chip {
          background: var(--bg-secondary);
          border: 1px solid var(--border-soft);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .edu-item {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 14px;
        }
        .degree {
          font-weight: 700;
        }
        .school {
          color: var(--text-secondary);
        }
        .year {
          margin-left: auto;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .resume-paper {
            padding: 30px;
          }
          .experience-header {
            flex-direction: column;
            gap: 4px;
          }
          .period {
            margin-top: 4px;
          }
        }
      `}</style>
    </motion.div>
  );
}
