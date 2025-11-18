import { User } from '../types.ts';

// FIX: Add missing properties 'plan', 'credits', and 'creditResetDate' to each mock user to conform to the updated User type.
const creditResetDate = new Date().toISOString();

export const mockUsers: User[] = [
  {
    firstName: 'Laura',
    lastName: 'Bianchi',
    email: 'laura.bianchi@example.com',
    dateOfBirth: '1985-03-22',
    placeOfBirth: 'Milano',
    role: 'user',
    plan: 'free',
    credits: 10,
    creditResetDate: creditResetDate,
  },
  {
    firstName: 'Marco',
    lastName: 'Verdi',
    email: 'marco.verdi@example.com',
    dateOfBirth: '1992-11-10',
    placeOfBirth: 'Napoli',
    role: 'user',
    plan: 'free',
    credits: 10,
    creditResetDate: creditResetDate,
  },
  {
    firstName: 'Giulia',
    lastName: 'Russo',
    email: 'giulia.russo@example.com',
    dateOfBirth: '1998-07-01',
    placeOfBirth: 'Torino',
    role: 'user',
    plan: 'free',
    credits: 10,
    creditResetDate: creditResetDate,
  },
  {
    firstName: 'Alessandro',
    lastName: 'Ferrari',
    email: 'alessandro.f@example.com',
    dateOfBirth: '1989-09-18',
    placeOfBirth: 'Bologna',
    role: 'user',
    plan: 'free',
    credits: 10,
    creditResetDate: creditResetDate,
  },
  {
    firstName: 'Sofia',
    lastName: 'Esposito',
    email: 'sofia.esposito@example.com',
    dateOfBirth: '1995-02-25',
    placeOfBirth: 'Firenze',
    role: 'user',
    plan: 'free',
    credits: 10,
    creditResetDate: creditResetDate,
  },
];