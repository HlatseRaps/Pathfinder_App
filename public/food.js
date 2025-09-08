 const chapters = [
  {
    title: "1) Introduction to Food Safety & Hygiene",
    kicker: "Protecting health starts with clean practices.",
    blocks: [
      { h: "Why food safety matters", p: "Food safety ensures that the food we prepare, serve, and consume is free from hazards that could harm people. Contaminated food can cause foodborne illnesses, damage reputations, and even close businesses. Hygiene is the foundation that prevents contamination." },
      { h: "Core hygiene principles", ul: [
        "Clean: Wash hands, surfaces, and utensils frequently.",
        "Separate: Avoid cross-contamination between raw and cooked food.",
        "Cook: Use correct temperatures to kill harmful bacteria.",
        "Chill: Store food safely to prevent bacterial growth."
      ] },
      { h: "The food handler’s role", p: "As a food worker, you are the first line of defense. Your habits directly affect guests’ health and safety. Even one careless action can cause illness for many customers." }
    ],
    takeaway: [
      "Food safety protects health, reputation, and business.",
      "Hygiene rules are simple but must be consistent.",
      "Every staff member is responsible for safe food."
    ]
  },
  {
    title: "2) Understanding Food Contamination",
    kicker: "Know the enemy before you can fight it.",
    blocks: [
      { h: "Types of contamination", ul: [
        "Biological: bacteria, viruses, fungi, parasites.",
        "Chemical: cleaning agents, pesticides, toxic metals.",
        "Physical: glass shards, plastic, hair, jewelry."
      ] },
      { h: "How contamination happens", p: "Unsafe handling, dirty equipment, poor storage, or careless personal hygiene all increase contamination risk. Even small lapses—like reusing chopping boards—can spread harmful bacteria." },
      { h: "High-risk foods", p: "Dairy, poultry, seafood, cooked rice, and ready-to-eat salads spoil quickly and must be handled with extra care." }
    ],
    takeaway: [
      "Contamination is invisible but dangerous.",
      "Always separate raw and cooked food.",
      "Be extra cautious with high-risk foods."
    ]
  },
  {
    title: "3) Personal Hygiene & Food Handling",
    kicker: "You carry food safety in your habits every day.",
    blocks: [
      { h: "Personal hygiene checklist", ul: [
        "Wash hands properly before and after handling food.",
        "Wear clean uniforms and protective clothing.",
        "Keep nails short, no jewelry, cover cuts with waterproof bandages.",
        "Never handle food when sick, especially with diarrhea or vomiting."
      ] },
      { h: "Safe food handling habits", p: "Always use utensils or gloves when possible. Avoid touching food directly. Replace gloves regularly and never use them as a substitute for handwashing." },
      { h: "Professional responsibility", p: "Guests trust you with their health. Protecting food safety shows respect and professionalism." }
    ],
    takeaway: [
      "Personal hygiene is the strongest defense against contamination.",
      "Handwashing must be frequent and thorough.",
      "Sick workers should not handle food."
    ]
  },
  {
    title: "4) Cleaning, Sanitizing & Pest Control",
    kicker: "Clean kitchens make safe kitchens.",
    blocks: [
      { h: "Cleaning vs sanitizing", p: "Cleaning removes dirt and grease; sanitizing kills harmful microorganisms. Both are essential for food safety." },
      { h: "Cleaning best practices", ul: [
        "Follow 'clean as you go' policy.",
        "Use approved cleaning agents correctly.",
        "Sanitize food-contact surfaces before and after use.",
        "Store chemicals away from food."
      ] },
      { h: "Pest prevention", p: "Keep doors closed, seal cracks, store food properly, and dispose of waste quickly. Pests spread disease and are signs of poor hygiene." }
    ],
    takeaway: [
      "Cleaning and sanitizing are different but both vital.",
      "Prevent pests by eliminating food and water sources.",
      "A dirty kitchen is a dangerous kitchen."
    ]
  },
  {
    title: "5) Safe Cooking & Storage Temperatures",
    kicker: "Temperature control keeps food safe.",
    blocks: [
      { h: "The danger zone", p: "Bacteria multiply fastest between 5°C and 60°C (41°F–140°F). Food must not remain in this zone for more than 2 hours." },
      { h: "Cooking temperatures", ul: [
        "Poultry: 74°C (165°F)",
        "Ground meats: 71°C (160°F)",
        "Seafood: 63°C (145°F)",
        "Reheated food: 74°C (165°F)"
      ] },
      { h: "Storage rules", ul: [
        "Refrigerate perishable food below 5°C.",
        "Freeze at –18°C or lower.",
        "Use FIFO (First In, First Out) method."
      ] }
    ],
    takeaway: [
      "Temperature is the best tool to control bacteria.",
      "Keep hot food hot, cold food cold.",
      "Follow proper storage and cooking standards."
    ]
  },
  {
    title: "6) Food Allergies & Special Diets",
    kicker: "One mistake can mean life or death.",
    blocks: [
      { h: "Common allergens", ul: [
        "Milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish."
      ] },
      { h: "Allergy-safe practices", p: "Always read labels, prevent cross-contact, use separate equipment when possible, and never guess about ingredients. Take customer allergy requests seriously." },
      { h: "Special diets", p: "Respect cultural, medical, or personal dietary needs (e.g., vegetarian, gluten-free, halal). Provide accurate information about menu items." }
    ],
    takeaway: [
      "Food allergies require zero mistakes.",
      "Cross-contact can be as dangerous as direct exposure.",
      "Respecting dietary needs builds trust and loyalty."
    ]
  },
  {
    title: "7) Building a Food Safety Culture",
    kicker: "Safety is a team responsibility, not just a rulebook.",
    blocks: [
      { h: "What is a food safety culture?", p: "It’s the shared values, beliefs, and practices that put safety first in every action—from washing hands to reporting issues." },
      { h: "Team practices", ul: [
        "Train all staff in safety basics.",
        "Encourage speaking up when mistakes happen.",
        "Recognize and reward safe behaviors.",
        "Managers must set the example."
      ] },
      { h: "Long-term benefits", p: "A strong food safety culture prevents incidents, improves customer confidence, reduces waste, and ensures compliance with regulations." }
    ],
    takeaway: [
      "Food safety culture means everyone takes ownership.",
      "Leaders must model the right behavior.",
      "Consistent training and teamwork create lasting safety."
    ]
  }
];

    // ------------------------------
    // Rendering logic (same as your pattern)
    // ------------------------------
    const chapterListEl   = document.getElementById("chapterList");
    const chapterTitleEl  = document.getElementById("chapterTitle");
    const chapterKickerEl = document.getElementById("chapterKicker");
    const chapterContentEl= document.getElementById("chapterContent");
    const chapterCountEl  = document.getElementById("chapterCount");
    const progressBarEl   = document.getElementById("progressBar");
    const progressTextEl  = document.getElementById("progressText");

    const btnPrev  = document.getElementById("btnPrev");
    const btnNext  = document.getElementById("btnNext");
    const btnSave  = document.getElementById("btnSave");
    const btnReset = document.getElementById("btnReset");

    const STORAGE_KEY = "pf_hospitality_basics_progress";
    let current = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    if (Number.isNaN(current) || current < 0 || current > chapters.length - 1) current = 0;

    function renderChapterList(){
      chapterListEl.innerHTML = "";
      chapters.forEach((ch, idx) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "chapter_btn" + (idx === current ? " active" : "");
        btn.innerHTML = `<i class="far fa-file-alt"></i> ${ch.title}`;
        btn.addEventListener("click", () => {
          current = idx;
          renderAll();
        });
        li.appendChild(btn);
        chapterListEl.appendChild(li);
      });
    }

    function renderChapter(){
      const ch = chapters[current];
      chapterTitleEl.textContent  = ch.title;
      chapterKickerEl.textContent = ch.kicker;
      chapterContentEl.innerHTML  = "";

      ch.blocks.forEach(block => {
        const div = document.createElement("div");
        div.className = "panel";
        const h4 = document.createElement("h4");
        h4.textContent = block.h;
        div.appendChild(h4);

        if (block.p){
          const p = document.createElement("p");
          p.textContent = block.p;
          div.appendChild(p);
        }
        if (block.ul){
          const ul = document.createElement("ul");
          block.ul.forEach(item=>{
            const li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
          });
          div.appendChild(ul);
        }
        chapterContentEl.appendChild(div);
      });

      if (ch.takeaway){
        const t = document.createElement("div");
        t.className = "panel";
        const h4 = document.createElement("h4");
        h4.textContent = "Key Takeaways";
        t.appendChild(h4);
        const ul = document.createElement("ul");
        ch.takeaway.forEach(x=>{
          const li = document.createElement("li");
          li.textContent = x;
          ul.appendChild(li);
        });
        t.appendChild(ul);
        chapterContentEl.appendChild(t);
      }

      chapterCountEl.textContent = `Chapter ${current+1} of ${chapters.length}`;
      btnPrev.disabled = current === 0;
      btnNext.disabled = current === chapters.length - 1;
    }

    function renderProgress(){
      const pct = Math.round(((current+1) / chapters.length) * 100);
      progressBarEl.style.width = pct + "%";
      progressTextEl.textContent = `${pct}% complete`;
    }

    function renderAll(){
      renderChapterList();
      renderChapter();
      renderProgress();
    }

    // Nav handlers
    btnPrev.addEventListener("click", ()=>{
      if (current > 0){ current--; renderAll(); }
    });
    btnNext.addEventListener("click", ()=>{
      if (current < chapters.length - 1){ current++; renderAll(); }
    });
    btnSave.addEventListener("click", ()=>{
      localStorage.setItem(STORAGE_KEY, String(current));
      alert("Progress saved!");
    });
    btnReset.addEventListener("click", ()=>{
      if (confirm("Reset your course progress?")){
        current = 0;
        localStorage.removeItem(STORAGE_KEY);
        renderAll();
      }
    });

    renderAll();