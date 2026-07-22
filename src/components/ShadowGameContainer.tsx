'use client';

import React, { useEffect, useRef } from 'react';

interface ShadowGameContainerProps {
  htmlContent: string;
  isFullscreen?: boolean;
}

export default function ShadowGameContainer({ htmlContent, isFullscreen }: ShadowGameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !htmlContent) return;

    const container = containerRef.current;

    // Parse the server-provided HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Extract styles
    const styles = Array.from(doc.querySelectorAll('style'));
    const styleCss = styles.map((s) => s.textContent).join('\n');

    // Create or update scoped style element
    let styleEl = container.querySelector('#game-scoped-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'game-scoped-styles';
      container.appendChild(styleEl);
    }
    styleEl.textContent = styleCss;

    // Extract body HTML (excluding script tags)
    const bodyClone = doc.body.cloneNode(true) as HTMLElement;
    const bodyScripts = bodyClone.querySelectorAll('script');
    bodyScripts.forEach((s) => s.remove());

    // Create or update content container
    let contentEl = container.querySelector('#game-content-root') as HTMLDivElement;
    if (!contentEl) {
      contentEl = document.createElement('div');
      contentEl.id = 'game-content-root';
      contentEl.className = 'w-full h-full flex flex-col items-center justify-center';
      container.appendChild(contentEl);
    }
    contentEl.innerHTML = bodyClone.innerHTML;

    // Re-execute scripts so canvas contexts and event listeners attach properly
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      container.appendChild(newScript);
    });

    return () => {
      // Clean up executed scripts and game content on unmount
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [htmlContent]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col items-center justify-center relative bg-slate-100 dark:bg-[#090d16] transition-colors duration-200 ${
        isFullscreen ? 'p-0' : 'p-1 sm:p-3'
      }`}
    />
  );
}
