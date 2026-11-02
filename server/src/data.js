// Pre-generated bcrypt hash for the classroom-only password "demo1234".
// A real application stores a different hash for every user in a database.
const passwordHash = "$2b$10$zNzxXdpoEVZUqsVug3d50e4erjF2O9L.gkHYPT/8T4KqcxXlYKZTy";

export const users = [
  { id: 1, name: "Oona Omistaja", email: "owner@cinema.test", role: "owner", passwordHash },
  { id: 2, name: "Kalle Kassa", email: "cashier@cinema.test", role: "cashier", passwordHash },
  { id: 3, name: "Aino Asiakas", email: "customer@cinema.test", role: "customer", passwordHash }
];

export const screenings = [
  { id: 101, movie: "Northern Lights Mystery", startsAt: "2027-01-15T18:00:00+02:00", auditorium: 1, availableSeats: 42 },
  { id: 102, movie: "Code 404", startsAt: "2027-01-15T20:30:00+02:00", auditorium: 2, availableSeats: 27 }
];

export const purchases = [];

export function publicUser(user) {
  // STEP 5 — Remove the password hash before placing the user in the session or response.
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function publicUser2(user) {

  const safeUser = { ...user };
  

  delete safeUser.passwordHash;

  return safeUser;
}
