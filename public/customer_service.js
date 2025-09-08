const chapters = [
  {
    title: "1) The Mindset of Advanced Customer Service",
    kicker: "Shifting from transactions to transformation.",
    blocks: [
      {
        h: "The difference between basic and advanced service",
        p: `Basic service means fulfilling requests; advanced service means anticipating 
        them. At the advanced level, staff do not wait for the guest to explain—they 
        read context, predict needs, and adapt tone and actions seamlessly.`
      },
      {
        h: "Key attributes of an advanced service professional",
        ul: [
          "Empathy at scale: treating each guest as an individual while handling volume.",
          "Proactivity: preventing problems before they surface.",
          "Adaptability: shifting between cultures, personalities, and expectations.",
          "Ownership: taking responsibility for outcomes, not just tasks."
        ]
      },
      {
        h: "Example: Anticipating unspoken needs",
        p: `A guest asks about breakfast time. Instead of answering “7 to 10,” 
        an advanced staff member adds: “If you need to leave earlier, I can 
        prepare a takeaway box for you.”`
      }
    ],
    takeaway: [
      "Advanced service requires anticipation, not reaction.",
      "Every answer should add value beyond the literal question.",
      "Empathy and ownership separate excellent staff from average staff."
    ]
  },

  {
    title: "2) Emotional Intelligence in Guest Interactions",
    kicker: "Reading emotions to respond with precision.",
    blocks: [
      {
        h: "The role of emotional intelligence (EQ)",
        p: `Guests rarely remember every word said, but they always remember 
        how they felt. High-EQ staff sense frustration, fatigue, or joy 
        even when unspoken—and respond in ways that de-escalate, reassure, or celebrate.`
      },
      {
        h: "Techniques for applying EQ",
        ul: [
          "Observe non-verbal cues: posture, tone, pace of speech.",
          "Mirror and validate emotions: “I understand it’s frustrating.”",
          "Pause before reacting—avoid matching negativity with negativity.",
          "Offer solutions framed in the guest’s emotional language."
        ]
      },
      {
        h: "Case study",
        p: `A tired traveler snaps: “Why is my room not ready?” Instead of 
        defending policy, the staff member says: “You must be exhausted. 
        Let me see how quickly I can prioritize your room, and in the meantime 
        please enjoy a complimentary coffee.”`
      }
    ],
    takeaway: [
      "Guests value emotional alignment over technical perfection.",
      "Validating feelings builds trust faster than explanations.",
      "EQ turns tense moments into loyalty opportunities."
    ]
  },

  {
    title: "3) Personalization at Scale",
    kicker: "Making every guest feel unique—even in a crowd.",
    blocks: [
      {
        h: "Why personalization matters",
        p: `Hospitality is not about treating everyone the same—it’s about 
        making each guest feel seen. Personalized touches increase satisfaction, 
        reviews, and return visits.`
      },
      {
        h: "Methods of personalization",
        ul: [
          "Name recognition: use names naturally during service.",
          "Preference memory: record dietary, room, or activity choices.",
          "Context awareness: note purpose of travel (honeymoon, business, family).",
          "Micro-surprises: handwritten notes, favorite snacks, tailored advice."
        ]
      },
      {
        h: "Balancing personalization with consistency",
        p: `While personalization makes the guest feel special, it must never 
        compromise service standards. A tailored experience should always 
        fit within operational guidelines.`
      }
    ],
    takeaway: [
      "Personalization transforms ordinary service into extraordinary care.",
      "Recording and remembering details is an investment in loyalty.",
      "Consistency and creativity must work together."
    ]
  },

  {
    title: "4) Handling Difficult Guests with Grace",
    kicker: "Turning complaints into opportunities.",
    blocks: [
      {
        h: "The mindset for conflict situations",
        p: `A complaint is not an attack; it’s a request for help. Guests who 
        complain give you a chance to fix things—silent guests simply leave unhappy.`
      },
      {
        h: "4-step model for complaint handling",
        ul: [
          "Listen fully without interruption.",
          "Acknowledge and empathize sincerely.",
          "Offer clear solutions or alternatives.",
          "Follow up to confirm satisfaction."
        ]
      },
      {
        h: "Real-world recovery example",
        p: `A couple finds their anniversary dinner delayed. Instead of excuses, 
        staff quickly offer a complimentary starter, apologize sincerely, 
        and update them on progress. The couple feels valued rather than ignored.`
      }
    ],
    takeaway: [
      "Difficult guests often become the most loyal after good recovery.",
      "Empathy and ownership calm anger faster than rules.",
      "Follow-up ensures the guest leaves with closure, not resentment."
    ]
  },

  {
    title: "5) Creating Lasting Impressions",
    kicker: "The art of farewells and memories.",
    blocks: [
      {
        h: "Why endings matter most",
        p: `Psychology shows people remember peaks and endings. A great check-out 
        or farewell often outweighs small mistakes during the stay.`
      },
      {
        h: "Ways to design positive endings",
        ul: [
          "Farewell by name, with eye contact and gratitude.",
          "Offer genuine wishes for safe travel or success in their journey.",
          "Provide small tokens—discount cards, local tips, or thank-you notes.",
          "Encourage feedback and invite return visits."
        ]
      },
      {
        h: "Case example",
        p: `At check-out, staff notice a guest wore a marathon medal. They congratulate 
        them and offer complimentary water and a snack for recovery. The guest 
        leaves smiling, likely to share the story online.`
      }
    ],
    takeaway: [
      "Last impressions last longest—design them deliberately.",
      "Small gestures at departure can drive big loyalty returns.",
      "Every guest should leave with a sense of closure and appreciation."
    ]
  }
];
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