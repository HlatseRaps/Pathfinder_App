const q = document.getElementById('q');
  const clearBtn = document.getElementById('clearBtn');
  let allLocations = [];

  async function loadLocations() {
    try {
      // Fetch employer and youth posts
      const [empRes, youthRes] = await Promise.all([
        fetch("/api/employer/media/all"),
        fetch("/api/youth/media/all") 
      ]);


      const employerLocations = await empRes.json();
      const youthLocations = await youthRes.json();

      // Normalize fields so both look the same
      const normalizedEmployer = employerLocations.map(loc => ({
        id: loc.id,
        location_name: loc.location_name,
        city: loc.city,
        country: loc.country,
        summary: loc.summary,
        tips: loc.tips,
        category: loc.category,
        image_url: loc.image_url, 
        source: "employer"
      }));

      const normalizedYouth = youthLocations.map(post => ({
        id: post.id,
        location_name: post.location_name || `${post.first_name} ${post.last_name}`,
        city: post.city,
        country: post.country,
        summary: post.description,
        category: post.category,
        image_url: post.pictures, 
        source: "youth",
        first_name: post.first_name,
        last_name: post.last_name,
        email : post.email
      }));

      allLocations = [...normalizedEmployer, ...normalizedYouth];

      renderLocations(allLocations);
    } catch (err) {
      console.error("Failed to load locations:", err);
      document.getElementById("locationsList").innerHTML = "<p>Error loading locations.</p>";
    }
  }

  function renderLocations(locations) {
    const container = document.getElementById("locationsList");
    container.innerHTML = "";

    if (!locations.length) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    locations.forEach(loc => {
      const card = document.createElement("div");
      card.className = 'card';

      // handle images
      let imagePath = "images/logo.jpg";

      if (loc.image_url) {
        if (loc.source === "employer") {
          imagePath = `/uploads/4/${loc.image_url.split(",")[0]}`;
        } else if (loc.source === "youth") {
          imagePath = `/uploads/2/${loc.image_url.split(",")[0]}`;
        }
      }

      card.innerHTML = `
        <img src="${imagePath}" alt="${loc.location_name}">
        <div class="body">
          <h3 style="color:orangered;margin:0 0 6px">${loc.location_name}</h3>
          <div style="margin-bottom:8px">
            <span class="pill">${loc.city || ''}</span>
            <span class="pill">${loc.country || ''}</span>
          </div>
          <p style="color:#555">${loc.summary || ''}</p>
          <p style="color:#666;font-size:0.95rem">${loc.category || ''}</p>
          <p style="font-size:0.8rem;color:#888">Posted by: ${loc.source}</p>
          <div class="actions">
             <button class="btn btn-lite" onclick="window.location.href='location.html?id=${loc.id}'"> View </button>
             <button class="btn btn-primary" onclick="window.location.href='location.html?id=${loc.id}&tab=plan'"> Plan Trip </button> 
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }


// Filter buttons
document.getElementById("filterAll").addEventListener("click", () => {
  setActiveButton("filterAll");
  renderLocations(allLocations);
});

document.getElementById("filterRural").addEventListener("click", () => {
  setActiveButton("filterRural");
  const rural = allLocations.filter(loc => loc.category && loc.category.toLowerCase() === "rural");
  renderLocations(rural);
});

document.getElementById("filterUrban").addEventListener("click", () => {
  setActiveButton("filterUrban");
  const urban = allLocations.filter(loc => loc.category && loc.category.toLowerCase() === "urban");
  renderLocations(urban);
});

// Helper: set active button styling
function setActiveButton(activeId) {
  document.querySelectorAll(".filter-buttons button").forEach(btn => {
    btn.classList.toggle("active", btn.id === activeId);
  });
}

// Search input
document.getElementById("q").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allLocations.filter(loc => 
    loc.location_name.toLowerCase().includes(query) ||
    (loc.city && loc.city.toLowerCase().includes(query)) ||
    (loc.country && loc.country.toLowerCase().includes(query))
  );
  renderLocations(filtered);
});

// Clear search
document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("q").value = "";
  renderLocations(allLocations);
});

// Init
loadLocations();
