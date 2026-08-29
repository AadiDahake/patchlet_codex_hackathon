import { beforeEach, describe, expect, it } from 'vitest';
import { scanAffordances } from '../src/scan/affordances';

const FIXTURE = `
  <nav aria-label="Main">
    <a href="/home">Home</a>
    <a href="/keys">API Keys</a>
  </nav>
  <header>
    <button aria-label="Open the account menu" id="account">A</button>
  </header>
  <main>
    <label for="username">Username</label>
    <input id="username" value="Aadi" />
    <button id="update">Update profile</button>
    <button id="ghost" style="display: none">Hidden action</button>
    <div aria-hidden="true"><button id="masked">Masked action</button></div>
    <input type="hidden" name="csrf" value="x" />
    <span id="not-interactive">Just text</span>
  </main>
`;

beforeEach(() => {
  document.body.innerHTML = FIXTURE;
});

describe('scanAffordances', () => {
  it('reports interactive elements only', () => {
    const { page } = scanAffordances({ question: 'change my username' });
    const names = page.affordances.map((affordance) => affordance.name);
    expect(names).toContain('Update profile');
    expect(names).toContain('Open the account menu');
    expect(names).not.toContain('Just text');
    expect(page.affordances.some((affordance) => affordance.name === 'x')).toBe(false);
  });

  it('gives stable ids for an unchanged page', () => {
    const first = scanAffordances({ question: 'change my username' });
    const second = scanAffordances({ question: 'change my username' });
    expect(second.page.affordances).toEqual(first.page.affordances);
    for (const [id, element] of first.lookup) expect(second.lookup.get(id)).toBe(element);
  });

  it('excludes hidden elements from the visible set', () => {
    const { page } = scanAffordances({ question: 'change my username' });
    const visible = page.affordances.filter((affordance) => affordance.visible).map((a) => a.name);
    expect(visible).toContain('Update profile');
    expect(visible).not.toContain('Hidden action');
    expect(visible).not.toContain('Masked action');
  });

  it('takes accessible names from aria-label and from label[for]', () => {
    const { page } = scanAffordances({ question: 'change my username' });
    const byName = (name: string) => page.affordances.find((affordance) => affordance.name === name);
    expect(byName('Open the account menu')?.role).toBe('button');
    expect(byName('Username')?.role).toBe('textbox');
  });

  it('records the landmark and the link target', () => {
    const { page } = scanAffordances({ question: 'home' });
    const home = page.affordances.find((affordance) => affordance.name === 'Home');
    expect(home?.landmark).toBe('sidebar');
    expect(home?.href).toBe('/home');
  });

  it('keeps the question-relevant controls when the cap is small', () => {
    const { page } = scanAffordances({ question: 'change my username', limit: 2 });
    expect(page.affordances.map((affordance) => affordance.name)).toContain('Username');
  });

  it('skips the host element of the widget', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button>Open support</button>';
    document.body.appendChild(host);
    const { page } = scanAffordances({ question: 'support', exclude: host });
    expect(page.affordances.some((affordance) => affordance.name === 'Open support')).toBe(false);
  });
});

describe('stateOf', () => {
  it('reports a tab that is already showing its panel', () => {
    document.body.innerHTML = `
      <div role="dialog" aria-label="Profile">
        <button role="tab" aria-selected="true">Profile</button>
        <button role="tab" aria-selected="false">Preferences</button>
      </div>`;
    const { page } = scanAffordances({ question: 'profile' });
    const byName = (name: string) => page.affordances.find((affordance) => affordance.name === name);
    expect(byName('Profile')?.state).toBe('selected');
    expect(byName('Preferences')?.state).toBeUndefined();
  });

  it('reports a menu button that is already open', () => {
    document.body.innerHTML = '<button aria-expanded="true">Account</button>';
    const { page } = scanAffordances({ question: 'account' });
    expect(page.affordances[0]?.state).toBe('expanded');
  });
});
