// Role selection
  function selectRole(formId) {
    const forms = ['youthForm', 'employerForm', 'touristForm'];

    forms.forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });

    document.getElementById(formId).classList.remove('hidden');
    document.querySelector('.role_selection').style.display = 'none';

    const title = document.getElementById('registerTitle');
    const desc = document.getElementById('registerDescription');

    if (formId === 'youthForm') {
      title.textContent = "Welcome Job Seeker!";
      desc.textContent = "Create your account and let us help you find the perfect hospitality job!";
    } else if (formId === 'employerForm') {
      title.textContent = "Welcome Employer!";
      desc.textContent = "Register your company and start finding the best talent for your hospitality needs!";
    } else if (formId === 'touristForm') {
      title.textContent = "Welcome Tourist!";
      desc.textContent = "Sign up to explore hospitality opportunities and services for travelers!";
    }
  }

  // Password match validation for ALL forms
  document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", function(e) {
      const password = form.querySelector("input[name='password']").value;
      const confirmPassword = form.querySelector("input[name='confirm_password']").value;
      const message = form.querySelector(".form_message");

      if (password !== confirmPassword) {
        e.preventDefault();
        message.style.color = "red";
        message.textContent = "Passwords do not match!";
      }
    });
  });