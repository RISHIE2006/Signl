import { getProfile as getStoredProfile, saveProfile as saveStoredProfile, getApplications as getStoredApplications } from '@/lib/store';

const API_BASE = "/api/db";

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

function get(path) {
  return request("GET", path);
}
function post(path, body) {
  return request("POST", path, body);
}
function del(path) {
  return request("DELETE", path);
}

// ── Profile ──
export async function fetchProfile(userId) {
  try {
    return await get("/profile");
  } catch {
    return userId ? getStoredProfile(userId) : null;
  }
}
export async function saveProfileToDB(data, userId) {
  try {
    return await post("/profile", data);
  } catch {
    if (userId) {
      saveStoredProfile(userId, data);
    }
    return { success: true, fallback: true };
  }
}

// ── Applications ──
export async function fetchApplications(userId) {
  try {
    return await get("/applications");
  } catch {
    return userId ? getStoredApplications(userId) : [];
  }
}
export async function fetchApplicationById(appId) {
  try {
    return await get(`/applications/${appId}`);
  } catch {
    return null;
  }
}
export async function addApplicationToDB(app) {
  return post("/applications", app);
}
export async function updateApplicationInDB(appId, updates) {
  return request("PATCH", `/applications/${appId}`, updates);
}
export async function deleteApplicationFromDB(appId) {
  return del(`/applications/${appId}`);
}

// ── Analyses ──
export async function fetchAnalyses() {
  try {
    return await get("/analyses");
  } catch {
    return [];
  }
}
export async function addAnalysisToDB(analysis) {
  return post("/analyses", analysis);
}

// ── Preps ──
export async function fetchPreps() {
  try {
    return await get("/preps");
  } catch {
    return [];
  }
}
export async function addPrepToDB(prep) {
  return post("/preps", prep);
}
export async function deletePrepFromDB(prepId) {
  return request("DELETE", "/preps", { id: prepId });
}

// ── Resume ──
export async function fetchResume() {
  try {
    return await get("/resume");
  } catch {
    return null;
  }
}
export async function saveResumeToDB(data) {
  return post("/resume", data);
}

// ── Benchmarks ──
export async function fetchBenchmarks() {
  try {
    return await get("/benchmarks");
  } catch {
    return null;
  }
}
export async function saveBenchmarksToDB(data) {
  return post("/benchmarks", data);
}

// ── DNA ──
export async function fetchDNA() {
  try {
    return await get("/dna");
  } catch {
    return null;
  }
}
export async function saveDNAToDB(data) {
  return post("/dna", data);
}

// ── Plan ──
export async function fetchPlan() {
  try {
    const d = await get("/plan");
    return d.plan || "free";
  } catch {
    return "free";
  }
}
export async function savePlanToDB(plan) {
  return post("/plan", { plan });
}

// ── Stats ──
export async function fetchStats() {
  try {
    return await get("/stats");
  } catch {
    return null;
  }
}

// ── Clear ──
export async function clearAllDataInDB() {
  return del("/clear");
}
