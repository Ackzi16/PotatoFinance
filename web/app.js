let currentStep = 1;
const stepCount = 3;

const stepEls = Array.from(document.querySelectorAll('.step'));
const prevBtn = document.getElementById('prevStep');
const nextBtn = document.getElementById('nextStep');

const setStep = (step) => {
  currentStep = Math.max(1, Math.min(step, stepCount));

  stepEls.forEach((el) => {
    const isActive = Number(el.dataset.step) === currentStep;
    el.classList.toggle('step--active', isActive);
  });

  prevBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === stepCount ? 'Done' : 'Next';
};

prevBtn.addEventListener('click', () => setStep(currentStep - 1));
nextBtn.addEventListener('click', () => {
  if (currentStep === stepCount) {
    setStep(1);
    return;
  }

  setStep(currentStep + 1);
});

setStep(1);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // no-op for preview environments
  });
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    return;
  }

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
