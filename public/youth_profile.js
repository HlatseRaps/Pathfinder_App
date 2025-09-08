 // Hamburger toggle
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });


    document.addEventListener("DOMContentLoaded", () => {
  // Sidebar avatar and info
  fetch("/api/user")
    .then(r => r.json())
    .then(user => {
      document.getElementById("userName").textContent = user.firstName + " " + user.lastName;
      document.getElementById("userRole").textContent = user.role;

      const initials = user.firstName.charAt(0).toUpperCase() + user.lastName.charAt(0).toUpperCase();

      const avatar = document.getElementById("userAvatar");
      avatar.textContent = initials;
      avatar.style.display = "flex";
      avatar.style.alignItems = "center";
      avatar.style.justifyContent = "center";
      avatar.style.fontWeight = "bold";
      avatar.style.color = "white";
      avatar.style.backgroundColor = "orangered";
      avatar.style.borderRadius = "50%";
      avatar.style.width = "50px";
      avatar.style.height = "50px";

      // Profile section
      document.getElementById("profileName").textContent = user.firstName + " " + user.lastName;
      document.getElementById("profileEmail").textContent = user.email;

      const profileAvatar = document.getElementById("profileAvatar");
      profileAvatar.textContent = initials;
      profileAvatar.style.display = "flex";
      profileAvatar.style.alignItems = "center";
      profileAvatar.style.justifyContent = "center";
      profileAvatar.style.fontWeight = "bold";
      profileAvatar.style.color = "white";
      profileAvatar.style.backgroundColor = "orangered";
      profileAvatar.style.borderRadius = "50%";
      profileAvatar.style.width = "80px";
      profileAvatar.style.height = "80px";
    });

  // Fetch profile data and populate inputs
  fetch("/api/profile")
    .then(r => r.json())
    .then(data => {
      if (!data) return;
      for (const key in data) {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) field.value = data[key];
      }
    });
});

    

// Save profile function
function saveProfile() {
  const data = {};
  document.querySelectorAll("input, select, textarea").forEach(f => data[f.name] = f.value);

  fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(res => {
    const msgDiv = document.getElementById("saveMessage");
    if (res.success) {
      msgDiv.textContent = "Saved successfully!";
      msgDiv.style.color = "green";
      msgDiv.style.display = "block";
      setTimeout(() => msgDiv.style.display = "none", 3000);
    } else {
      msgDiv.textContent = "Error saving profile";
      msgDiv.style.color = "red";
      msgDiv.style.display = "block";
      setTimeout(() => msgDiv.style.display = "none", 3000);
    }
  })
  .catch(err => console.log(err));
}

