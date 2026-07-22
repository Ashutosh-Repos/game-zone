'use client';

import React, { useState } from 'react';
import StudyPulseFacade from '@/components/StudyPulseFacade';
import SecretVaultChat from '@/components/SecretVaultChat';

export default function Home() {
  const [viewState, setViewState] = useState<'facade' | 'secret_vault'>('facade');
  const [activePasscode, setActivePasscode] = useState<string | null>(null);

  const handleSecretTriggered = (enteredPasscode: string) => {
    setActivePasscode(enteredPasscode);
    setViewState('secret_vault');
  };

  const handlePanicExit = () => {
    setActivePasscode(null);
    setViewState('facade');
  };

  return (
    <>
      {viewState === 'facade' || !activePasscode ? (
        <StudyPulseFacade onSecretTriggered={handleSecretTriggered} />
      ) : (
        <SecretVaultChat passcode={activePasscode} onPanicExit={handlePanicExit} />
      )}
    </>
  );
}
