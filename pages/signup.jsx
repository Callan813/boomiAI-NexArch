import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Step 1: Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setMessage("❌ " + authError.message);
      return;
    }

    // Step 2: Insert into public.users
    const user = authData.user;
    const { error: insertError } = await supabase.from("users").insert([
      {
        user_id: user.id, // same as auth.users UUID
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password_hash: "hashed_in_auth", // placeholder (avoid storing plain password)
        address: form.address,
      },
    ]);

    if (insertError) {
      setMessage("⚠️ Insert error: " + insertError.message);
    } else {
      setMessage("✅ User signed up! Please check your email.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input type="text" name="full_name" placeholder="Full Name" onChange={handleChange} /><br />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} /><br />
        <input type="text" name="phone" placeholder="Phone" onChange={handleChange} /><br />
        <input type="text" name="address" placeholder="Address" onChange={handleChange} /><br />
        <button type="submit">Sign Up</button>
      </form>
      <p>{message}</p>
      
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Already have an account? <a href="/login" style={{ color: "#0070f3" }}>Login here</a></p>
      </div>
    </div>
  );
}
