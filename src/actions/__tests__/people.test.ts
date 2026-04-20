import { describe, it, expect } from 'vitest';
import { addPerson, markContacted, updatePersonNotesAction, updatePersonUrlAction } from '@/actions/people';
import { getPersonById, getAllPeople } from '@/lib/queries/people';

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe('addPerson', () => {
  it('rejects empty name', async () => {
    const res = await addPerson(makeFormData({ name: '' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Name');
  });

  it('rejects whitespace-only name', async () => {
    const res = await addPerson(makeFormData({ name: '   ' }));
    expect(res.success).toBe(false);
  });

  it('succeeds with only name', async () => {
    const res = await addPerson(makeFormData({ name: 'Alice' }));
    expect(res.success).toBe(true);
    const people = getAllPeople();
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Alice');
  });

  it('succeeds with all fields', async () => {
    const res = await addPerson(makeFormData({
      name: 'Bob',
      role: 'CTO',
      company: 'TechCo',
      url: 'https://example.com',
    }));
    expect(res.success).toBe(true);
  });
});

describe('markContacted', () => {
  it('returns failure for missing person_id', async () => {
    const res = await markContacted(makeFormData({ person_id: '0' }));
    expect(res.success).toBe(false);
  });

  it('updates last_interaction', async () => {
    await addPerson(makeFormData({ name: 'Test' }));
    const people = getAllPeople();
    const personId = people[0].id;

    const res = await markContacted(makeFormData({ person_id: String(personId) }));
    expect(res.success).toBe(true);
    expect(getPersonById(personId)!.last_interaction).toBeTruthy();
  });
});

describe('updatePersonNotesAction', () => {
  it('returns failure for missing person_id', async () => {
    const res = await updatePersonNotesAction(makeFormData({ person_id: '0', notes: 'hi' }));
    expect(res.success).toBe(false);
  });

  it('updates notes for valid person', async () => {
    await addPerson(makeFormData({ name: 'Test' }));
    const person = getAllPeople()[0];

    await updatePersonNotesAction(makeFormData({ person_id: String(person.id), notes: 'Met at event' }));
    expect(getPersonById(person.id)!.notes).toBe('Met at event');
  });
});

describe('updatePersonUrlAction', () => {
  it('updates URL', async () => {
    await addPerson(makeFormData({ name: 'Test' }));
    const person = getAllPeople()[0];

    await updatePersonUrlAction(makeFormData({ person_id: String(person.id), url: 'https://new.com' }));
    expect(getPersonById(person.id)!.url).toBe('https://new.com');
  });
});
