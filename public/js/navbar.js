document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const body = document.body;

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isActive = hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
      // Prevent body scrolling when menu is open
      body.style.overflow = isActive ? "hidden" : "";
      // Update ARIA attributes
      hamburger.setAttribute("aria-expanded", isActive);
    });

    // Dropdown Toggle for Mobile
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const link = item.querySelector(".nav-link");
      link.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const isActive = item.classList.contains("active");
          navItems.forEach((i) => i.classList.remove("active"));
          if (!isActive) {
            item.classList.add("active");
            link.setAttribute("aria-expanded", "true");
          } else {
            link.setAttribute("aria-expanded", "false");
          }
        }
      });
    });

    // Close Menu When Clicking Outside
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        navItems.forEach((item) => {
          item.classList.remove("active");
          const link = item.querySelector(".nav-link");
          if (link) link.setAttribute("aria-expanded", "false");
        });
        body.style.overflow = "";
        hamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    const backToTop = document.querySelector(".back-to-top");
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
      backToTop.classList.add("show");
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
      backToTop.classList.remove("show");
    }
  });
});
