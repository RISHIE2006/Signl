"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  HardDrive,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: "800",
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "2px",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function Badge({ text, variant }) {
  const colors = {
    success: { bg: "#05966915", text: "#059669", border: "#05966925" },
    warning: { bg: "#D9770615", text: "#D97706", border: "#D9770625" },
    info: { bg: "#3B82F615", text: "#3B82F6", border: "#3B82F625" },
    default: {
      bg: "var(--bg-secondary)",
      text: "var(--text-muted)",
      border: "var(--border)",
    },
  };
  const c = colors[variant] || colors.default;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: "600",
        padding: "3px 10px",
        borderRadius: "100px",
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {text}
    </span>
  );
}

export default function DatabaseDemoPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apps, setApps] = useState([]);
  const [newApp, setNewApp] = useState({
    company: "",
    role: "",
    stage: "applied",
  });
  const [profile, setProfile] = useState({});
  const [profileForm, setProfileForm] = useState({
    targetRole: "",
    industry: "",
  });
  const [dbStatus, setDbStatus] = useState(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, appsRes, profileRes] = await Promise.all([
        fetch("/api/db/stats"),
        fetch("/api/db/applications"),
        fetch("/api/db/profile"),
      ]);
      if (!statsRes.ok || !appsRes.ok || !profileRes.ok) {
        throw new Error("Failed to fetch data");
      }
      const statsData = await statsRes.json();
      const appsData = await appsRes.json();
      const profileData = await profileRes.json();
      setStats(statsData);
      setApps(appsData);
      setProfile(profileData);
      setProfileForm({
        targetRole: profileData.targetRole || "",
        industry: profileData.industry || "",
      });
      setDbStatus("connected");
    } catch (e) {
      setError(e.message);
      setDbStatus("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    fetchAll();
  }, [isLoaded, isSignedIn]);

  async function addApplication() {
    if (!newApp.company || !newApp.role) return;
    await fetch("/api/db/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newApp),
    });
    setNewApp({ company: "", role: "", stage: "applied" });
    fetchAll();
  }

  async function deleteApp(id) {
    await fetch(`/api/db/applications/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function saveProfile() {
    await fetch("/api/db/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    fetchAll();
  }

  if (!isLoaded)
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "40px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <Database size={28} color="var(--accent)" />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Database Console
          </h1>
          <Badge
            text={dbStatus === "connected" ? "Connected" : "Error"}
            variant={dbStatus === "connected" ? "success" : "warning"}
          />
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
          SQLite-backed persistent storage. All data is stored server-side in{" "}
          <code
            style={{
              background: "var(--bg-secondary)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            data/signl.db
          </code>
        </p>
      </motion.div>

      {/* Refresh */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={fetchAll}
          disabled={loading}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-primary)",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#DC262615",
            border: "1px solid #DC262625",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "24px",
            color: "#DC2626",
            fontSize: "14px",
          }}
        >
          <XCircle
            size={16}
            style={{
              display: "inline",
              marginRight: "8px",
              verticalAlign: "middle",
            }}
          />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "14px",
            marginBottom: "40px",
          }}
        >
          <StatCard
            icon={HardDrive}
            label="Database Engine"
            value="SQLite"
            color="#3B82F6"
          />
          <StatCard
            icon={Activity}
            label="Applications"
            value={stats.applications}
            color="#059669"
          />
          <StatCard
            icon={Activity}
            label="Analyses"
            value={stats.analyses}
            color="#8B5CF6"
          />
          <StatCard
            icon={Activity}
            label="Preps"
            value={stats.preps}
            color="#D97706"
          />
          <StatCard
            icon={CheckCircle}
            label="Has Resume"
            value={stats.hasResume ? "Yes" : "No"}
            color={stats.hasResume ? "#059669" : "#DC2626"}
          />
          <StatCard
            icon={CheckCircle}
            label="Has Profile"
            value={stats.hasProfile ? "Yes" : "No"}
            color={stats.hasProfile ? "#059669" : "#DC2626"}
          />
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        {/* ── Applications CRUD ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={16} color="var(--accent)" /> Applications
          </h2>

          {/* Add form */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <input
              value={newApp.company}
              onChange={(e) =>
                setNewApp({ ...newApp, company: e.target.value })
              }
              placeholder="Company"
              style={{
                flex: 1,
                minWidth: "100px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                fontSize: "13px",
                color: "var(--text-primary)",
              }}
            />
            <input
              value={newApp.role}
              onChange={(e) => setNewApp({ ...newApp, role: e.target.value })}
              placeholder="Role"
              style={{
                flex: 1,
                minWidth: "100px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                fontSize: "13px",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={addApplication}
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              Add
            </button>
          </div>

          {/* List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {apps.length === 0 && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                No applications yet
              </p>
            )}
            {apps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>
                    {app.company}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {app.role} · <Badge text={app.stage} variant="info" />
                  </div>
                </div>
                <button
                  onClick={() => deleteApp(app.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#DC2626",
                    padding: "4px",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Profile CRUD ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Database size={16} color="var(--accent)" /> Profile
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              value={profileForm.targetRole}
              onChange={(e) =>
                setProfileForm({ ...profileForm, targetRole: e.target.value })
              }
              placeholder="Target Role (e.g. Senior Frontend Engineer)"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                fontSize: "13px",
                color: "var(--text-primary)",
              }}
            />
            <input
              value={profileForm.industry}
              onChange={(e) =>
                setProfileForm({ ...profileForm, industry: e.target.value })
              }
              placeholder="Industry (e.g. Fintech)"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                fontSize: "13px",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={saveProfile}
              style={{
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Save Profile
            </button>
            {profile.targetRole && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#05966910",
                  border: "1px solid #05966920",
                  fontSize: "13px",
                }}
              >
                <strong>Saved:</strong> {profile.targetRole} in{" "}
                {profile.industry || "N/A"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Info */}
      <div
        style={{
          marginTop: "32px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <HardDrive size={20} color="var(--text-muted)" />
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600" }}>
              Database Location
            </div>
            <code style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              data/signl.db
            </code>
          </div>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/db/clear", { method: "DELETE" });
            fetchAll();
          }}
          style={{
            background: "#DC262615",
            color: "#DC2626",
            border: "1px solid #DC262625",
            borderRadius: "8px",
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          Clear My Data
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
