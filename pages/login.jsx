import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // First, try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setMessage("❌ Authentication failed: " + authError.message);
        return;
      }

      // If auth succeeds, verify user exists in public.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", form.email)
        .single();

      if (userError || !userData) {
        setMessage("❌ User not found in database");
        return;
      }

      // Login successful
      setMessage("✅ Login successful! Welcome back, " + userData.full_name);
      
      // You can redirect here or set user state
      // For example, redirect to dashboard:
      // window.location.href = "/dashboard";
      
    } catch (error) {
      setMessage("❌ An error occurred: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "20px" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px"
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      {message && (
        <div style={{
          marginTop: "20px",
          padding: "10px",
          borderRadius: "4px",
          backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24",
          border: `1px solid ${message.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Don't have an account? <a href="/signup" style={{ color: "#0070f3" }}>Sign up here</a></p>
      </div>
    </div>
  );
}
