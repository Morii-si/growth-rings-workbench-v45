/*!
 * React Bits Text Type, adapted to this vanilla JavaScript app.
 * https://reactbits.dev/text-animations/text-type
 * https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/TextType/TextType.jsx
 * Upstream settings: typingSpeed=50, initialDelay=0, loop=false,
 * showCursor=true, cursorCharacter='|', cursorBlinkDuration=0.5.
 * Local changes: stable layout, one animation per conversation session,
 * reduced-motion support, accessible complete heading and DOM cleanup.
 *
 * MIT + Commons Clause License Condition v1.0
 * Copyright (c) 2026 David Haz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, and distribute the Software as part of
 * an application, website, or product, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * Commons Clause Restriction
 * You may use this Software, including for any commercial purpose, so long as
 * you do not sell, sublicense, or redistribute the components themselves-whether
 * alone, in a bundle, or as a ported version.
 *
 * No Warranty
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const playedSessions = new Set();
let activeAnimation = null;

/** Mount after each app render; returns a disposer for the current heading. */
export function mountWelcomeTextType(root = document) {
  activeAnimation?.dispose();
  activeAnimation = null;

  const heading = root.querySelector('[data-welcome-text-type]');
  if (!heading) return () => {};
  const content = heading.querySelector('.text-type__content');
  if (!content) return () => {};

  const text = heading.dataset.welcomeTextType;
  const characters = Array.from(text);
  const session = new URL(window.location.href).searchParams.get('demo-session') || 'original';
  const key = session + ':' + text;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;
  let observer = null;
  let disposed = false;
  let index = 0;

  function finish() {
    clearTimeout(timer);
    timer = null;
    content.textContent = text;
    heading.dataset.typingState = 'complete';
  }
  function onMotionPreferenceChange(event) {
    if (event.matches) finish();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimeout(timer);
    observer?.disconnect();
    reducedMotion.removeEventListener('change', onMotionPreferenceChange);
    heading.dataset.typingState = 'disposed';
    if (activeAnimation?.heading === heading) activeAnimation = null;
  }
  function typeNextCharacter() {
    if (disposed || !heading.isConnected) {
      dispose();
      return;
    }
    index += 1;
    content.textContent = characters.slice(0, index).join('');
    if (index >= characters.length) finish();
    else timer = setTimeout(typeNextCharacter, 50);
  }

  activeAnimation = { heading, dispose };
  reducedMotion.addEventListener('change', onMotionPreferenceChange);
  observer = new MutationObserver(() => {
    if (!heading.isConnected) dispose();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const alreadyPlayed = playedSessions.has(key);
  playedSessions.add(key);
  if (reducedMotion.matches || alreadyPlayed) finish();
  else {
    content.textContent = '';
    heading.dataset.typingState = 'typing';
    timer = setTimeout(typeNextCharacter, 50);
  }
  return dispose;
}
