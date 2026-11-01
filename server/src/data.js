import bcrypt from "bcryptjs";

const passwordHash = bcrypt.hashSync("demo1234", 10);

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
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
