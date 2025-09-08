// Hamburger toggle
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });


    // Fetch logged-in user info
    fetch("/api/user")
    .then(response => {
      if (!response.ok) throw new Error("Not logged in");
      return response.json();
    })
    .then(user => {
      // Set full name in welcome message and sidebar
      const fullName = `${user.firstName} ${user.lastName}`;
      document.getElementById("userDisplayName").textContent = fullName;
      document.getElementById("userName").textContent = fullName;
      document.getElementById("userRole").textContent = user.role;

      // Set avatar initials
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
    })
    .catch(err => {
      console.log("Error fetching user info:", err);
    });
