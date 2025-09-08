const counters = document.querySelectorAll(".count");
    counters.forEach(counter => {
      const updateCount = () => {
        const target = +counter.getAttribute("data-target");
        const count = +counter.innerText;
        const increment = target / 200;
        if(count < target){
          counter.innerText = Math.ceil(count + increment);
          setTimeout(updateCount, 10);
        } else{
          counter.innerText = target;
        }
      };
      updateCount();
    });

    // Filter Buttons
    const filterBtns = document.querySelectorAll(".filter-btn");
    const skillCards = document.querySelectorAll(".skill_card");
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");
        skillCards.forEach(card => {
          if(filter === "all" || card.classList.contains(filter)){
            card.style.display = "block";
          } else{
            card.style.display = "none";
          }
        });
      });
    });
