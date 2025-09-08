
  let LOC = null;
  let panorama = null;
  let vrVisible = false;
  let allPosts = [];

// Fetch coordinates from location name if missing
async function getLatLng(placeName) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (err) {
        console.error("Geocoding error:", err);
    }
    return null; // not found
}

// Load location (employer + youth)
async function loadLocation() {
    try {
        const employerRes = await fetch("/api/employer/media/all");
        const employerPosts = await employerRes.json();
        const youthRes = await fetch("/api/youth/media/all");
        const youthPosts = await youthRes.json();

      

        allPosts = [
          ...employerPosts.map(p => ({
              ...p,
              source: "employer",
              displayName: p.location_name || "Employer" 
          })),
          ...youthPosts.map(p => ({
              ...p,
              source: "youth",
              displayName: `${p.first_name || ""} ${p.last_name || ""}`.trim()
          }))
      ];

        

        const params = new URLSearchParams(window.location.search);
        const id = parseInt(params.get("id")) || 1;

        LOC = allPosts.find(l => l.id === id);
        if (!LOC) {
            alert("Location not found!");
            return;
        }

        // Page content
        document.getElementById("title").textContent = LOC.location_name;
        document.getElementById("city").textContent = LOC.city || "";
        document.getElementById("country").textContent = LOC.country || "";
        document.getElementById("summary").textContent = LOC.summary || LOC.description || "";

        // Correct image path
        let imgPath = "images/placeholder.jpg";
        if (LOC.pictures || LOC.image_url) {
            imgPath = LOC.source === "employer"
                ? `/uploads/4/${LOC.pictures.split(",")[0] || LOC.image_url.split(",")[0]}`
                : `/uploads/2/${LOC.pictures.split(",")[0] || LOC.image_url.split(",")[0]}`;
        }
        document.getElementById("heroImg").src = imgPath;

        // Google Maps button
        document.getElementById("dirBtn").onclick = () =>
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${LOC.lat},${LOC.lng}`,
                "_blank"
            );

        // Ensure valid coordinates
        if (!LOC.lat || !LOC.lng) {
            const coords = await getLatLng(LOC.location_name);
            if (coords) {
                LOC.lat = coords.lat;
                LOC.lng = coords.lng;
            } else {
                alert("Could not determine coordinates, using fallback location.");
                LOC.lat = 0;
                LOC.lng = 0;
            }
        }

        // Render map
        const map = L.map("map").setView([LOC.lat, LOC.lng], 14);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        L.marker([LOC.lat, LOC.lng]).addTo(map).bindPopup(LOC.location_name).openPopup();

        renderLocals();
        renderCulture()
        loadReviews();
        loadWeather();
    } catch (err) {
        console.error("Error loading location:", err);
        alert("Failed to load location.");
    }
}

// Toggle VR (Google Street View only)
document.getElementById("toggleVR").addEventListener("click", async () => {
    vrVisible = !vrVisible;
    document.getElementById("map").style.display = vrVisible ? "none" : "block";
    document.getElementById("streetView").style.display = vrVisible ? "block" : "none";
    document.getElementById("toggleVR").textContent = vrVisible ? "Switch to Map" : "Switch to VR";

    if (vrVisible && !panorama) {
        panorama = new google.maps.StreetViewPanorama(document.getElementById("streetView"), {
            pov: { heading: 165, pitch: 0 },
            zoom: 1
        });

        const svService = new google.maps.StreetViewService();
        svService.getPanorama(
            { location: { lat: LOC.lat, lng: LOC.lng }, radius: 200 }, // increased radius
            (data, status) => {
                if (status === "OK") {
                    panorama.setPano(data.location.pano);
                } else {
                    document.getElementById("streetView").innerHTML =
                        "Street View not available for this location. Please try another nearby location or use the Directions button.";
                }
            }
        );
    }
});


// Tabs
document.getElementById("tabs").addEventListener("click",e=>{
  const t=e.target.closest(".tab"); if(!t)return;
  [...document.querySelectorAll(".tab")].forEach(el=>el.classList.toggle("active",el===t));
  [...document.querySelectorAll(".panel")].forEach(p=>p.classList.toggle("active",p.id===t.dataset.tab));
});


function renderCulture() {
  const cultureList = document.getElementById("cultureList");
  const eventsList = document.getElementById("eventsList");

  cultureList.innerHTML = "";
  eventsList.innerHTML = "";

  if (!LOC || LOC.source !== "youth") {
    cultureList.innerHTML = "<p>No media available for this location.</p>";
    return;
  }

  // Pictures
  if (LOC.pictures) {
    const pics = LOC.pictures.split(",");
    pics.forEach(pic => {
      const img = document.createElement("img");
      img.src = `/uploads/2/${pic}`;
      img.style = "width:200px;height:150px;object-fit:cover;border-radius:8px;margin:5px;";
      cultureList.appendChild(img);
    });
  }

  // Videos
  if (LOC.videos) {
    const vids = LOC.videos.split(",");
    vids.forEach(vid => {
      const video = document.createElement("video");
      video.src = `/uploads/2/${vid}`;
      video.controls = true;
      video.style = "width:300px;height:200px;border-radius:8px;margin:5px;";
      eventsList.appendChild(video);
    });
  }

  if (!LOC.pictures && !LOC.videos) {
    cultureList.innerHTML = "<p>No pictures or videos uploaded yet.</p>";
  }
}


function renderLocals() {
    const list = document.getElementById("localsList");
    list.innerHTML = "";

    if (!LOC) {
        list.innerHTML = "<p>No locals available yet.</p>";
        return;
    }

    const name = LOC.displayName || `${LOC.first_name || ""} ${LOC.last_name || ""}`.trim() || "Anonymous";
    const cityCountry = [LOC.city, LOC.country].filter(Boolean).join(", ");

    const div = document.createElement("div");
    div.className = "card small";
    div.innerHTML = `
        <h4>${name}</h4>
        <p>${cityCountry}</p>
        ${
          LOC.email
            ? `<a href="mailto:${LOC.email}" class="btn btn-primary" 
                 style="margin-top:8px;display:inline-block;color:white;">
                 Contact Us
               </a>`
            : `<p style="color:gray;font-size:14px;">No email provided</p>`
        }
    `;
    list.appendChild(div);
}

 // Reviews
  const reviewForm = document.getElementById("reviewForm");
  const reviewsList = document.getElementById("reviewsList");

  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("revName").value.trim();
    const rating = document.getElementById("revRating").value;
    const text = document.getElementById("revText").value.trim();

    if (!name || !rating || !text) {
      alert("Please fill all fields.");
      return;
    }

    const response = await fetch("/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loc_id: LOC.id, name, rating, text })
    });

    const result = await response.json();
    if (result.success) {
      reviewForm.reset();
      loadReviews(); // refresh reviews
    }
  });

  async function loadReviews() {
    if (!LOC) return;
    const res = await fetch(`/reviews/${LOC.id}`);
    const data = await res.json();

    reviewsList.innerHTML = "";
    if (!data.length) {
      reviewsList.innerHTML = "<p>No reviews yet. Be the first!</p>";
      return;
    }

    data.forEach(r => {
      const div = document.createElement("div");
      div.className = "review";
      div.style = "border:1px solid #ddd;padding:10px;margin-bottom:8px;border-radius:6px;";

      div.innerHTML = `
        <strong>${r.name}</strong> 
        <span style="color:gold;">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        <p>${r.text}</p>
        <small style="color:gray;">${new Date(r.created_at).toLocaleString()}</small>
      `;
      reviewsList.appendChild(div);
    });
  }



const weatherNowDiv = document.getElementById("weatherNow");
const forecastDiv = document.getElementById("forecast");
const planBtn = document.getElementById("planBtn");
const planOut = document.getElementById("planOut");

async function loadWeather() {
  if (!LOC) return;

  const apiKey = "c9b2cac8dba5acaa6de0920389fda3a4";
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${LOC.lat}&lon=${LOC.lng}&units=metric&exclude=minutely,hourly,alerts&appid=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    // Current Weather
    const now = data.current;
    weatherNowDiv.innerHTML = `
      <strong>Current Weather:</strong> ${now.temp}°C, ${now.weather[0].description}
      <br>Humidity: ${now.humidity}%, Wind: ${now.wind_speed} m/s
    `;

    // 7-day Forecast
    forecastDiv.innerHTML = "<strong>7-day Forecast:</strong><br>";
    data.daily.slice(0, 7).forEach(day => {
      const date = new Date(day.dt * 1000);
      forecastDiv.innerHTML += `
        <div style="margin-bottom:4px;">
          <strong>${date.toDateString()}:</strong> ${day.temp.day}°C, ${day.weather[0].main}
        </div>
      `;
    });

    // Save for Plan tab
    window.weatherData = data;
  } catch (err) {
    weatherNowDiv.textContent = "Failed to load weather.";
    console.error(err);
  }
}

// Plan preview
planBtn.addEventListener("click", () => {
  const dateStr = document.getElementById("planDate").value;
  const timeStr = document.getElementById("planTime").value;

  if (!dateStr || !timeStr) {
    alert("Select both date and time.");
    return;
  }

  if (!window.weatherData) {
    planOut.textContent = "Weather data not loaded yet.";
    return;
  }

  const selectedDate = new Date(`${dateStr}T${timeStr}`);
  const daily = window.weatherData.daily.find(day => {
    const dayDate = new Date(day.dt * 1000);
    return dayDate.toDateString() === selectedDate.toDateString();
  });

  if (daily) {
    planOut.innerHTML = `
      <strong>Weather on ${selectedDate.toDateString()}:</strong>
      <br>Day Temp: ${daily.temp.day}°C
      <br>Night Temp: ${daily.temp.night}°C
      <br>Condition: ${daily.weather[0].main} - ${daily.weather[0].description}
      <br>Humidity: ${daily.humidity}%, Wind: ${daily.wind_speed} m/s
    `;
  } else {
    planOut.textContent = "No forecast available for this day.";
  }
});


// Initialize
loadLocation();