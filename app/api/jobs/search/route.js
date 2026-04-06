import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { resumeText, filters, jobQuery, excludeTitles } = await req.json();

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: 'A resume with sufficient content is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    }

    const locationFilter = filters?.location || 'Remote / Global';
    const typeFilter = filters?.type || 'Any'; // Full-time, Internship, Contract
    const experienceFilter = filters?.experience || 'Any'; // Entry, Mid, Senior

    const prompt = `You are an expert recruiter and job board aggregator with deep knowledge of LinkedIn, Indeed, Glassdoor, Internshala, Wellfound (AngelList), and Naukri.

Analyze this resume alongside the user's specific job search goal and generate 30 highly realistic, relevant job openings that are a strong match for this candidate.

SEARCH GOAL:
"${jobQuery || 'Any relevant roles based on my skills'}"

RESUME:
${resumeText}

SEARCH FILTERS:
- Location Preference: ${locationFilter}
- Job Type: ${typeFilter}
- Experience Level: ${experienceFilter}

${excludeTitles?.length > 0 ? `DO NOT include any of these specific job titles in your results as they was already shown: ${excludeTitles.join(', ')}. Please find DIFFERENT roles or similar roles at different companies.` : ''}

Return ONLY valid JSON (no markdown, no backticks) as an object with a "jobs" array. Each job must have this exact schema:
{
  "jobs": [
    {
      "id": "<unique string id, e.g. 'job_1'>",
      "title": "<Job Title>",
      "company": "<Company Name>",
      "location": "<City, Country or Remote>",
      "type": "<Full-time | Internship | Contract | Part-time>",
      "salary": "<e.g. $80k–$120k/yr or ₹8–15 LPA or Unpaid/Stipend for internships>",
      "matchScore": <integer 0-100 representing how well this resume fits this job>,
      "matchReason": "<1 concise sentence explaining the top reason this is a good match>",
      "missingSkills": [<array of max 3 strings: key skills this resume lacks for this role>],
      "platform": "<LinkedIn | Indeed | Glassdoor | Wellfound | Internshala | Naukri | Greenhouse>",
      "postedAgo": "<e.g. 2 days ago, 1 week ago, just now>",
      "tags": [<array of 3-4 short skill/technology tags, e.g. ['React', 'Node.js', 'TypeScript']>],
      "description": "<2-3 sentence realistic job description snippet>",
      "applyUrl": "<a realistic-looking URL to the platform, e.g. https://www.linkedin.com/jobs/view/12345678>",
      "isHot": <boolean, true if this is an especially great match (matchScore > 75)>
    }
  ]
}

Rules:
- Jobs should be diverse: mix of companies (FAANG-tier, startups, mid-size), locations, types.
- Match scores should be realistic (40–92 range), not all the same. The top 2–3 should be 80+.
- If the resume suggests a student or entry-level, include 3–4 internships.
- Platform URLs must look realistic but are not required to be live.
- Tags should reflect actual technologies/skills from the resume and job.
- The output must be perfectly valid JSON only.`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (err) {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      result = await model.generateContent(prompt);
    }

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response. Try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Sort by matchScore descending
    if (parsed.jobs && Array.isArray(parsed.jobs)) {
      parsed.jobs.sort((a, b) => b.matchScore - a.matchScore);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Jobs Search API error:', err);
    return NextResponse.json({ error: err.message || 'Job search failed.' }, { status: 500 });
  }
}
