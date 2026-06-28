/**
 * Tirth Patel - Portfolio Main JS Core Logic
 * Handles light/dark theme toggling, scroll events, mobile nav, and contact form AJAX submissions.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // Mobile Navigation Menu & Headers
  // ==========================================================================
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const mainHeader = document.getElementById('main-header');
  const scrollIndicator = document.getElementById('scroll-indicator');

  // Toggle mobile navigation
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  // Close mobile nav when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // Header background fade & scroll indicator update on scroll
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolledVal = (scrollY / docHeight) * 100;
    
    // Scroll progress bar
    scrollIndicator.style.width = `${scrolledVal}%`;

    // Navbar compact view
    if (scrollY > 50) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }
  });

  // ==========================================================================
  // Light / Dark Theme Switcher
  // ==========================================================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const bodyElement = document.body;

  // Retrieve theme preference from localStorage on load
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  
  if (savedTheme === 'light') {
    bodyElement.classList.remove('dark-theme');
    bodyElement.classList.add('light-theme');
  } else {
    bodyElement.classList.remove('light-theme');
    bodyElement.classList.add('dark-theme');
  }

  // Toggle theme action
  themeToggleBtn.addEventListener('click', () => {
    if (bodyElement.classList.contains('dark-theme')) {
      bodyElement.classList.remove('dark-theme');
      bodyElement.classList.add('light-theme');
      localStorage.setItem('portfolio-theme', 'light');
    } else {
      bodyElement.classList.remove('light-theme');
      bodyElement.classList.add('dark-theme');
      localStorage.setItem('portfolio-theme', 'dark');
    }
  });

  // ==========================================================================
  // Scroll Reveal Animations & Active Nav Observer
  // ==========================================================================
  const revealSections = document.querySelectorAll('.scroll-reveal');
  const sectionsForNav = document.querySelectorAll('section[id]');

  // Reveal observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.15 });

  revealSections.forEach(section => {
    revealObserver.observe(section);
  });

  // Active section nav highlighter
  const navActiveObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sectionsForNav.forEach(section => {
    navActiveObserver.observe(section);
  });

  // ==========================================================================
  // Simplified Contact Form AJAX Submissions
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  const formFeedbackText = document.getElementById('form-feedback-text');
  const btnSubmitContact = document.getElementById('btn-submit-contact');
  
  const successIcon = formFeedback.querySelector('.feedback-icon.success');
  const errorIcon = formFeedback.querySelector('.feedback-icon.error');

  // Form validation utility
  function validateForm(name, email, subject, message) {
    // Reset previous error classes
    document.querySelectorAll('.contact-form-container input, .contact-form-container textarea').forEach(el => {
      el.classList.remove('error-border');
    });

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;

    if (!name || !nameRegex.test(name.trim())) {
      showValidationError('Please enter a valid name (at least 2 letters, letters and spaces only).', 'name');
      return false;
    }

    if (!email || !emailRegex.test(email.trim())) {
      showValidationError('Please enter a valid email address (e.g. yourname@domain.com).', 'email');
      return false;
    }

    if (!subject || subject.trim().length < 3) {
      showValidationError('Please enter a valid subject (at least 3 characters).', 'form-subject');
      return false;
    }

    if (!message || message.trim().length < 10) {
      showValidationError('Please write a slightly longer message (at least 10 characters).', 'message');
      return false;
    }

    return true;
  }

  function showValidationError(messageText, fieldId) {
    formFeedback.classList.remove('hidden');
    successIcon.classList.add('hidden');
    errorIcon.classList.remove('hidden');
    formFeedbackText.textContent = messageText;
    
    // Clear spinner if present
    const spinner = formFeedback.querySelector('.form-spinner');
    if (spinner) spinner.remove();

    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add('error-border');
      field.focus();
    }
  }

  // Listen to form submit events
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Compile form data
    const formData = new FormData(contactForm);
    const formObject = Object.fromEntries(formData.entries());

    // Validate fields on submission
    if (!validateForm(formObject.name, formObject.email, formObject.subject_line, formObject.message)) {
      return;
    }

    // Show sending feedback status
    formFeedback.classList.remove('hidden');
    successIcon.classList.add('hidden');
    errorIcon.classList.add('hidden');
    
    // Add form spinner
    const spinnerSpan = document.createElement('span');
    spinnerSpan.className = 'form-spinner';
    formFeedback.insertBefore(spinnerSpan, formFeedbackText);
    
    formFeedbackText.textContent = 'Sending your message...';
    btnSubmitContact.disabled = true;

    // Submit request via Serverless API Endpoint Proxy
    fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formObject)
    })
    .then(async (response) => {
      const responseJson = await response.json();
      
      // Clean up loader spinner
      const currentSpinner = formFeedback.querySelector('.form-spinner');
      if (currentSpinner) currentSpinner.remove();

      if (response.status === 200 && responseJson.success) {
        // Success
        successIcon.classList.remove('hidden');
        formFeedbackText.textContent = 'Thank you! Your message was delivered successfully. I will get back to you shortly.';
        contactForm.reset();
        
        // Hide success message after 7 seconds
        setTimeout(() => {
          formFeedback.classList.add('hidden');
        }, 7000);
      } else {
        // Error returned by API
        console.error('Serverless Error Response:', responseJson);
        throw new Error(responseJson.error || 'Server error occurred');
      }
    })
    .catch((err) => {
      // Clean up loader spinner
      const currentSpinner = formFeedback.querySelector('.form-spinner');
      if (currentSpinner) currentSpinner.remove();

      errorIcon.classList.remove('hidden');
      formFeedbackText.innerHTML = `Submission failed: ${err.message}. Alternatively, please email me at <a href="mailto:tirthpatel42722@gmail.com" style="color: var(--accent-cyan); text-decoration: underline; font-weight: bold;">tirthpatel42722@gmail.com</a>.`;
      console.error(err);
    })
    .finally(() => {
      btnSubmitContact.disabled = false;
    });
  });

});
