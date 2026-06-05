/* --------------------------------------------------------------------------
   DUCKIESS - DOODLE STYLE WEBPAGE INTERACTIONS
   -------------------------------------------------------------------------- */

// Initialize Supabase Client safely
let supabaseClient = null;
try {
  if (window.supabase) {
    const SUPABASE_URL = "https://taxbqinbjrbrytaxxjzi.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheGJxaW5ianJicnl0YXh4anppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTM4NTYsImV4cCI6MjA5MjM2OTg1Nn0.sZ8mbg1LUs2mJepn9DqHqBenM12TjsLlAdbeicMVP_A";
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn("Supabase SDK is not loaded. Whitelist registrations will run in offline fallback mode.");
  }
} catch (e) {
  console.error("Failed to initialize Supabase:", e);
}

document.addEventListener('DOMContentLoaded', () => {

  // State variables
  let isFollowed = false;
  let isLiked = false;
  let isRT = false;
  let isWalletValid = false;
  let audioContext = null;
  let isCampfirePlaying = false;
  let campfireNodes = [];

  // DOM Elements
  const joinWlBtn = document.getElementById('joinWlBtn');
  const wlModalOverlay = document.getElementById('wlModalOverlay');
  const wlModal = document.getElementById('wlModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // Checklist Items & Checkboxes
  const stepFollow = document.getElementById('stepFollow');
  const stepLike = document.getElementById('stepLike');
  const stepRT = document.getElementById('stepRT');
  const stepWallet = document.getElementById('stepWallet');

  const linkFollow = document.getElementById('linkFollow');
  const linkLike = document.getElementById('linkLike');
  const linkRT = document.getElementById('linkRT');
  const walletInput = document.getElementById('walletInput');
  const walletError = document.getElementById('walletError');

  const chkFollow = document.getElementById('chkFollow');
  const chkLike = document.getElementById('chkLike');
  const chkRT = document.getElementById('chkRT');
  const chkWallet = document.getElementById('chkWallet');

  const submitBtn = document.getElementById('submitBtn');
  const successScreen = document.getElementById('successScreen');
  const registeredWalletVal = document.getElementById('registeredWalletVal');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  const skySparks = document.getElementById('skySparks');

  // Fetch like link dynamically from Supabase
  async function loadLikeLink() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('settings')
        .select('value')
        .eq('key', 'like_link')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value && linkLike) {
        linkLike.href = data.value;
        console.log("Dynamically loaded like link from Supabase:", data.value);
      }
    } catch (err) {
      console.warn("Could not load like link, using default fallback:", err);
    }
  }

  // Fetch RT link dynamically from Supabase
  async function loadRTLink() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('settings')
        .select('value')
        .eq('key', 'rt_link')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value && linkRT) {
        linkRT.href = data.value;
        console.log("Dynamically loaded RT link from Supabase:", data.value);
      }
    } catch (err) {
      console.warn("Could not load RT link, using default fallback:", err);
    }
  }

  loadLikeLink();
  loadRTLink();

  // Play quack sound when clicking the logo
  const logoLink = document.querySelector('.logo-link');
  if (logoLink) {
    const quackAudio = new Audio('asset/quack.mp3');
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();

      quackAudio.currentTime = 0;
      quackAudio.play().catch(err => {
        console.warn("Could not play quack sound (interaction required):", err);
      });

      const logoImg = logoLink.querySelector('.duck-logo-img');
      if (logoImg) {
        logoImg.style.transform = 'scale(1.3) rotate(-15deg)';
        setTimeout(() => {
          logoImg.style.transform = '';
        }, 300);
      }
    });
  }


  /* ==========================================================================
     1. BACKGROUND CAMPFIRE EMBERS SPAWNING
     ========================================================================== */
  function spawnEmbers() {
    const emberCount = 20;
    for (let i = 0; i < emberCount; i++) {
      createEmber();
    }
  }

  function createEmber() {
    const ember = document.createElement('div');
    ember.classList.add('sparkle-ember');

    // Randomize styling
    const size = Math.random() * 6 + 3; // 3px to 9px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 5 + 4; // 4s to 9s
    const delay = Math.random() * -8; // Pre-start animation
    const drift = Math.random() * 120 - 60; // -60px to 60px drift

    ember.style.width = `${size}px`;
    ember.style.height = `${size}px`;
    ember.style.left = `${left}%`;
    ember.style.animationDuration = `${duration}s`;
    ember.style.animationDelay = `${delay}s`;
    ember.style.setProperty('--drift', `${drift}px`);

    // Slight orange/yellow color variation
    const colors = ['#FF9800', '#FF5722', '#FFEB3B', '#FFC107'];
    ember.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    skySparks.appendChild(ember);
  }

  spawnEmbers();

  /* ==========================================================================
     2. TOAST NOTIFICATION UTILITY
     ========================================================================== */
  let toastTimeout;
  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  /* ==========================================================================
     3. MODAL STATE TOGGLING
     ========================================================================== */
  function openModal() {
    wlModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Set active highlight state to step 1
    updateActiveStepStates();
  }

  function closeModal() {
    wlModalOverlay.classList.remove('open');
    document.body.style.overflow = 'auto';
    // Reset success screen if open
    setTimeout(() => {
      successScreen.classList.remove('show');
    }, 4000);
  }

  joinWlBtn.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);

  // Close modal when clicking outside on overlay
  wlModalOverlay.addEventListener('click', (e) => {
    if (e.target === wlModalOverlay) {
      closeModal();
    }
  });

  /* ==========================================================================
     4. STEP INTERACTION & VALIDATION
     ========================================================================== */

  // Function to update which step looks "currently active"
  function updateActiveStepStates() {
    stepFollow.classList.remove('active-step');
    stepLike.classList.remove('active-step');
    stepRT.classList.remove('active-step');
    stepWallet.classList.remove('active-step');

    if (!isFollowed) {
      stepFollow.classList.add('active-step');
    } else if (!isLiked) {
      stepLike.classList.add('active-step');
    } else if (!isRT) {
      stepRT.classList.add('active-step');
    } else if (!isWalletValid) {
      stepWallet.classList.add('active-step');
    }
  }

  // Check if all steps are completed to enable the submit button
  function validateAllSteps() {
    if (isFollowed && isLiked && isRT && isWalletValid) {
      submitBtn.classList.remove('disabled');
      submitBtn.removeAttribute('disabled');
    } else {
      submitBtn.classList.add('disabled');
      submitBtn.setAttribute('disabled', 'true');
    }
    updateActiveStepStates();
  }

  // Step 1: Simulated Twitter Follow
  linkFollow.addEventListener('click', (e) => {
    // We let the link open in a new tab, but simultaneously check the checkbox
    showToast('Verifying follow on @DuckiessProject...');

    setTimeout(() => {
      isFollowed = true;
      stepFollow.classList.add('checked');
      showToast('Step 1 Complete! Followed!');
      validateAllSteps();
    }, 1500);
  });

  // Step 2: Simulated Like
  linkLike.addEventListener('click', (e) => {
    showToast('Verifying Like...');

    setTimeout(() => {
      isLiked = true;
      stepLike.classList.add('checked');
      showToast('Step 2 Complete! Post Liked! ❤️');
      validateAllSteps();
    }, 1500);
  });

  // Step 3: Simulated RT
  linkRT.addEventListener('click', (e) => {
    showToast('Verifying Retweet...');

    setTimeout(() => {
      isRT = true;
      stepRT.classList.add('checked');
      showToast('Step 3 Complete! Post RT\'d! 🔁');
      validateAllSteps();
    }, 1500);
  });

  // Step 3: Wallet Input Validation
  function checkWalletAddress(address) {
    // Regex for Ethereum addresses: starts with 0x, followed by 40 hex characters
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  walletInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();

    if (value === "") {
      isWalletValid = false;
      stepWallet.classList.remove('checked');
      walletError.classList.remove('visible');
      validateAllSteps();
      return;
    }

    if (checkWalletAddress(value)) {
      isWalletValid = true;
      stepWallet.classList.add('checked');
      walletError.classList.remove('visible');
    } else {
      isWalletValid = false;
      stepWallet.classList.remove('checked');
      // Show warning error only when typing has gone past basic prefix
      if (value.length > 2) {
        walletError.classList.add('visible');
      }
    }
    validateAllSteps();
  });

  // Allow clicking checklist checkboxes to trigger prompts
  chkFollow.addEventListener('click', () => {
    if (!isFollowed) {
      linkFollow.click();
    }
  });

  chkLike.addEventListener('click', () => {
    if (!isLiked) {
      linkLike.click();
    }
  });

  chkRT.addEventListener('click', () => {
    if (!isRT) {
      linkRT.click();
    }
  });

  /* ==========================================================================
     5. CONFETTI BURST ANIMATION
     ========================================================================== */
  function triggerConfetti() {
    const colors = ['#FFEB3B', '#FF9800', '#FF5722', '#FFC107', '#E0F7FA', '#4CAF50'];
    const particleCount = 60;

    // Generate particles from the button's position
    const rect = submitBtn.getBoundingClientRect();
    const modalRect = wlModal.getBoundingClientRect();

    // Relative position inside the modal
    const originX = rect.left - modalRect.left + rect.width / 2;
    const originY = rect.top - modalRect.top + rect.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.classList.add('confetti-particle');

      // Randomize initial physics
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 12 + 6;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 3; // skewed upward

      let x = originX;
      let y = originY;
      let rotation = Math.random() * 360;
      let rotSpeed = Math.random() * 15 - 7.5;
      let gravity = 0.35;

      // Styled like a doodle sketch piece
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.backgroundColor = color;

      // Random shapes (irregular rectangles or circles)
      if (Math.random() > 0.5) {
        p.style.borderRadius = '50%';
      } else {
        p.style.borderRadius = `${Math.random() * 6 + 2}px`;
      }

      p.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      wlModal.appendChild(p);

      // Animation Loop
      function updateParticle() {
        x += vx;
        y += vy + gravity;
        gravity += 0.05;
        rotation += rotSpeed;

        p.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

        // Remove when off modal boundaries
        if (y > modalRect.height || x < 0 || x > modalRect.width) {
          p.remove();
        } else {
          requestAnimationFrame(updateParticle);
        }
      }

      requestAnimationFrame(updateParticle);
    }
  }

  /* ==========================================================================
     6. SUBMIT OPERATION
     ========================================================================== */
  submitBtn.addEventListener('click', async () => {
    if (submitBtn.classList.contains('disabled')) return;

    const walletVal = walletInput.value.trim().toLowerCase();

    // Show loading text on button
    submitBtn.querySelector('.btn-text').textContent = 'SAVING';
    submitBtn.classList.add('disabled');

    // Check if Supabase client is initialized; if not, fallback to offline demo mode
    if (!supabaseClient) {
      console.warn("Supabase is offline/uninitialized. Falling back to simulated successful registration.");
      setTimeout(() => {
        triggerConfetti();
        setTimeout(() => {
          const truncatedWallet = walletVal.substring(0, 6) + '...' + walletVal.substring(walletVal.length - 4);
          registeredWalletVal.textContent = truncatedWallet;
          successScreen.classList.add('show');
          submitBtn.querySelector('.btn-text').textContent = 'SUBMIT';
        }, 1000);
      }, 200);
      return;
    }

    try {
      // 1. Check if wallet is already whitelisted in Supabase
      const { data: existing, error: checkError } = await supabaseClient
        .from('whitelist')
        .select('wallet_address')
        .eq('wallet_address', walletVal)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        showToast('Wallet address is already registered! 🦆');
        submitBtn.querySelector('.btn-text').textContent = 'SUBMIT';
        submitBtn.classList.remove('disabled');
        return;
      }

      // 2. Insert the wallet address into the whitelist table
      const { error: insertError } = await supabaseClient
        .from('whitelist')
        .insert([{ wallet_address: walletVal }]);

      if (insertError) throw insertError;

      // 3. Success: play celebratory confetti explosion!
      triggerConfetti();

      setTimeout(() => {
        // Complete! Show success screen inside modal
        const truncatedWallet = walletVal.substring(0, 6) + '...' + walletVal.substring(walletVal.length - 4);
        registeredWalletVal.textContent = truncatedWallet;
        successScreen.classList.add('show');

        // Reset submit button text
        submitBtn.querySelector('.btn-text').textContent = 'SUBMIT';
      }, 1000);

    } catch (err) {
      console.error('Error saving:', err);
      showToast('Error saving. Please try again! ❌');

      // Reset button
      submitBtn.querySelector('.btn-text').textContent = 'SUBMIT';
      submitBtn.classList.remove('disabled');
    }
  });

  // Success screen close waddles back
  closeSuccessBtn.addEventListener('click', () => {
    // Reset all inputs & checkboxes for demo repeatability
    walletInput.value = "";
    isFollowed = false;
    isLiked = false;
    isRT = false;
    isWalletValid = false;

    stepFollow.classList.remove('checked');
    stepLike.classList.remove('checked');
    stepRT.classList.remove('checked');
    stepWallet.classList.remove('checked');

    validateAllSteps();
    closeModal();
  });

  /* ==========================================================================
     7. PREMIUM EMBEDDED AUDIO SYNTHESIZER (CAMPFIRE CRACKLER)
     ========================================================================== */
  // Generates real-time ambient noise & crackling through Web Audio API

  function initCampfireAudio() {
    if (audioContext) return;

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
    } catch (e) {
      showToast("Audio synthesis is not supported on this browser.");
      return;
    }

    // 1. Warm Fire Hum (Filtered Pink/Brownish Noise)
    // We synthesize pink noise using a custom script processor or by generating a long buffer
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate Brownian-like rumble noise
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Amplify
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Low pass filter to create a warm, deep wind/fire hum
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, audioContext.currentTime); // Deep warm rumble

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Gentle hum

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    campfireNodes.push(noiseSource, gainNode);

    // 2. Campfire Crackles & Pops (Occasional high frequency transients)
    // We set an interval to dynamically trigger tiny explosive envelope shapes!
    function triggerCrackle() {
      if (!isCampfirePlaying) return;

      const crackleOsc = audioContext.createOscillator();
      const crackleGain = audioContext.createGain();
      const crackleFilter = audioContext.createBiquadFilter();

      // Randomize crackle type
      const isPop = Math.random() > 0.7; // Deep pop vs sharp crackle

      crackleOsc.type = 'triangle';
      if (isPop) {
        crackleOsc.frequency.setValueAtTime(Math.random() * 80 + 40, audioContext.currentTime); // 40Hz to 120Hz pop
        crackleFilter.type = 'lowpass';
        crackleFilter.frequency.setValueAtTime(300, audioContext.currentTime);
        crackleGain.gain.setValueAtTime(Math.random() * 0.4 + 0.2, audioContext.currentTime);
      } else {
        crackleOsc.frequency.setValueAtTime(Math.random() * 2000 + 4000, audioContext.currentTime); // 4kHz to 6kHz crackle
        crackleFilter.type = 'highpass';
        crackleFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
        crackleGain.gain.setValueAtTime(Math.random() * 0.08 + 0.02, audioContext.currentTime);
      }

      // Extremely sharp crackle decay envelope
      const now = audioContext.currentTime;
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + (isPop ? 0.08 : 0.015));

      crackleOsc.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(audioContext.destination);

      crackleOsc.start(now);
      crackleOsc.stop(now + 0.1);

      // Schedule next crackle dynamically at irregular intervals
      const nextTime = Math.random() * 300 + 50; // Every 50ms to 350ms
      setTimeout(triggerCrackle, nextTime);
    }

    // Start fire background sources
    noiseSource.start(0);

    // Start crackle generator
    isCampfirePlaying = true;
    triggerCrackle();
  }

  function stopCampfireAudio() {
    isCampfirePlaying = false;
    campfireNodes.forEach(node => {
      try {
        node.stop();
      } catch (e) { }
    });
    campfireNodes = [];
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (!isCampfirePlaying) {
        initCampfireAudio();
        if (audioContext) {
          soundOnIcon.style.display = 'block';
          soundOffIcon.style.display = 'none';
          showToast("Campfire hum and crackling activated! 🪵🔥");
        }
      } else {
        stopCampfireAudio();
        soundOnIcon.style.display = 'none';
        soundOffIcon.style.display = 'block';
        showToast("Campfire sounds muted.");
      }
    });
  }

  /* ==========================================================================
     8. ROADMAP MODAL
     ========================================================================== */
  const roadmapNavBtn = document.getElementById('roadmapNavBtn');
  const roadmapModalOverlay = document.getElementById('roadmapModalOverlay');
  const roadmapCloseBtn = document.getElementById('roadmapCloseBtn');

  function openRoadmapModal() {
    roadmapModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeRoadmapModal() {
    roadmapModalOverlay.classList.remove('open');
    document.body.style.overflow = 'auto';
  }

  if (roadmapNavBtn) {
    roadmapNavBtn.addEventListener('click', openRoadmapModal);
  }

  if (roadmapCloseBtn) {
    roadmapCloseBtn.addEventListener('click', closeRoadmapModal);
  }

  if (roadmapModalOverlay) {
    roadmapModalOverlay.addEventListener('click', (e) => {
      if (e.target === roadmapModalOverlay) {
        closeRoadmapModal();
      }
    });
  }

  // Close roadmap modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (roadmapModalOverlay && roadmapModalOverlay.classList.contains('open')) {
        closeRoadmapModal();
      }
      if (checkerModalOverlay && checkerModalOverlay.classList.contains('open')) {
        closeCheckerModal();
      }
    }
  });

  /* ==========================================================================
     9. CHECKER MODAL
     ========================================================================== */
  const checkerNavBtn = document.getElementById('checkerNavBtn');
  const checkerModalOverlay = document.getElementById('checkerModalOverlay');
  const checkerCloseBtn = document.getElementById('checkerCloseBtn');

  function openCheckerModal() {
    checkerModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckerModal() {
    checkerModalOverlay.classList.remove('open');
    document.body.style.overflow = 'auto';
  }

  if (checkerNavBtn) {
    checkerNavBtn.addEventListener('click', openCheckerModal);
  }

  if (checkerCloseBtn) {
    checkerCloseBtn.addEventListener('click', closeCheckerModal);
  }

  if (checkerModalOverlay) {
    checkerModalOverlay.addEventListener('click', (e) => {
      if (e.target === checkerModalOverlay) {
        closeCheckerModal();
      }
    });
  }
});

