'use client';

// Namespaced localStorage helpers so multiple Clerk users don't share data
function key(userId, name) {
  return `signl_${userId}_${name}`;
}

export function getPlan(userId) {
  if (typeof window === 'undefined') return 'free';
  try {
    return localStorage.getItem(key(userId, 'plan')) || 'free';
  } catch {
    return 'free';
  }
}

export function savePlan(userId, plan) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(userId, 'plan'), plan);
}

export function getProfile(userId) {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'profile')) || 'null');
  } catch {
    return null;
  }
}

export function saveProfile(userId, data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(userId, 'profile'), JSON.stringify(data));
}

export function getApplications(userId) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'applications')) || '[]');
  } catch {
    return [];
  }
}

export function saveApplications(userId, apps) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(userId, 'applications'), JSON.stringify(apps));
}

export function addApplication(userId, app) {
  const apps = getApplications(userId);
  const newApp = { ...app, id: Date.now().toString(), createdAt: new Date().toISOString() };
  apps.unshift(newApp);
  saveApplications(userId, apps);
  return newApp;
}

export function getApplicationById(userId, appId) {
  return getApplications(userId).find(a => a.id === appId) || null;
}

export function updateApplication(userId, appId, updates) {
  const apps = getApplications(userId).map(a =>
    a.id === appId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
  );
  saveApplications(userId, apps);
}

export function deleteApplication(userId, appId) {
  const apps = getApplications(userId).filter(a => a.id !== appId);
  saveApplications(userId, apps);
}

export function getAnalyses(userId) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'analyses')) || '[]');
  } catch {
    return [];
  }
}

export function addAnalysis(userId, analysis) {
  const analyses = getAnalyses(userId);
  const newAnalysis = { ...analysis, id: Date.now().toString(), createdAt: new Date().toISOString() };
  analyses.unshift(newAnalysis);
  localStorage.setItem(key(userId, 'analyses'), JSON.stringify(analyses));
  return newAnalysis;
}

export function getPreps(userId) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'preps')) || '[]');
  } catch {
    return [];
  }
}

export function addPrep(userId, prep) {
  const preps = getPreps(userId);
  const newPrep = { ...prep, id: Date.now().toString(), createdAt: new Date().toISOString() };
  preps.unshift(newPrep);
  localStorage.setItem(key(userId, 'preps'), JSON.stringify(preps));
  return newPrep;
}

export function deletePrep(userId, prepId) {
  const preps = getPreps(userId).filter(p => p.id !== prepId);
  localStorage.setItem(key(userId, 'preps'), JSON.stringify(preps));
}

export function getBenchmarks(userId) {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'benchmarks')) || 'null');
  } catch {
    return null;
  }
}

export function saveBenchmarks(userId, data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(userId, 'benchmarks'), JSON.stringify(data));
}

export function clearAllData(userId) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key(userId, 'profile'));
  localStorage.removeItem(key(userId, 'applications'));
  localStorage.removeItem(key(userId, 'analyses'));
  localStorage.removeItem(key(userId, 'preps'));
  localStorage.removeItem(key(userId, 'benchmarks'));
  localStorage.removeItem(key(userId, 'dna'));
}

export function getDNA(userId) {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'dna')) || 'null');
  } catch {
    return null;
  }
}

export function saveDNA(userId, data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(userId, 'dna'), JSON.stringify(data));
}

export function getResume(userId) {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(key(userId, 'resume')) || 'null');
  } catch {
    return null;
  }
}

export function saveResume(userId, resumeData) {
  if (typeof window === 'undefined') return;
  if (!resumeData) {
    localStorage.removeItem(key(userId, 'resume'));
    return;
  }
  localStorage.setItem(key(userId, 'resume'), JSON.stringify({
    ...resumeData,
    updatedAt: new Date().toISOString()
  }));
}
