import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api.js";
import "./styles.css";

const demoAccounts = [
  ["Customer", "customer@cinema.test"],
  ["Cashier", "cashier@cinema.test"],
  ["Owner", "owner@cinema.test"]
];

function App() {
  const [user, setUser] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [email, setEmail] = useState("customer@cinema.test");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([api("/api/auth/me"), api("/api/screenings")])
      .then(([auth, shows]) => { setUser(auth.user); setScreenings(shows); })
      .catch((error) => setMessage(error.message));
  }, []);

  async function login(event) {
    event.preventDefault();
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "demo1234" })
      });
      setUser(result.user);
      setMessage(`Welcome, ${result.user.name}!`);
    } catch (error) { setMessage(error.message); }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMessage("You signed out.");
  }

  async function buy(screeningId) {
    try {
      const result = await api("/api/purchases", {
        method: "POST",
        body: JSON.stringify({ screeningId, seats: ["C7"], guestEmail: "guest@example.com" })
      });
      setMessage(`Booking ${result.id.slice(0, 8)} was created ${user ? "for your account" : "as a guest purchase"}.`);
    } catch (error) { setMessage(error.message); }
  }

  async function tryProtected(path) {
    try { setMessage(JSON.stringify(await api(path))); }
    catch (error) { setMessage(error.message); }
  }

  return <main>
    <header>
      <div><span className="eyebrow">AUTHENTICATION DEMO</span><h1>Aurora Cinema</h1></div>
      {user ? <div className="identity"><span>{user.name}<small>{user.role}</small></span><button onClick={logout}>Sign out</button></div> : <span>Guest</span>}
    </header>
    {message && <div className="message" role="status">{message}</div>}
    {!user && <section className="panel login">
      <div><h2>Sign in or continue as a guest</h2><p>Every demo account uses <code>demo1234</code>.</p></div>
      <form onSubmit={login}><label>Email<select value={email} onChange={(event) => setEmail(event.target.value)}>{demoAccounts.map(([label, value]) => <option key={value} value={value}>{label}: {value}</option>)}</select></label><button type="submit">Sign in</button></form>
    </section>}
    <section><h2>Screenings</h2><div className="grid">{screenings.map((show) => <article key={show.id} className="card"><span>Auditorium {show.auditorium}</span><h3>{show.movie}</h3><p>{new Date(show.startsAt).toLocaleString("en-GB")}</p><p>{show.availableSeats} seats available</p><button onClick={() => buy(show.id)}>Book seat C7 {user ? "to my account" : "as a guest"}</button></article>)}</div></section>
    <section className="panel"><h2>Try authorization</h2><p>Hiding a button does not protect an API. The server checks permission on every request.</p><div className="actions"><button onClick={() => tryProtected("/api/my-purchases")}>My purchases</button><button onClick={() => tryProtected("/api/cashier/sales")}>Cashier sales</button><button onClick={() => tryProtected("/api/owner/report")}>Owner report</button></div></section>
  </main>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
