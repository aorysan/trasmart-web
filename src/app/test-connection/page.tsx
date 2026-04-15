"use client";

import { useState } from "react";
import { testConnection } from "@/lib/test-supabase";

export default function TestConnectionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleTest = async () => {
    setLoading(true);
    setError("");
    setResult("Testing...");

    try {
      const success = await testConnection();
      if (success) {
        setResult("✅ Connection successful!");
      } else {
        setResult("❌ Connection failed!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>🧪 Supabase Connection Test</h1>

      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#3B82F6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "⏳ Testing..." : "🚀 Test Connection"}
      </button>

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#F0F9FF",
            border: "1px solid #3B82F6",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          {result}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#FEE2E2",
            border: "1px solid #EF4444",
            borderRadius: "4px",
            fontSize: "16px",
            color: "#DC2626",
          }}
        >
          ❌ Error: {error}
        </div>
      )}

      <p style={{ marginTop: "40px", color: "#666", fontSize: "14px" }}>
        💡 Tip: Buka browser console (F12) untuk melihat detail log
      </p>
    </div>
  );
}
