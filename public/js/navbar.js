document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const body = document.body;

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isActive = hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
      body.style.overflow = isActive ? "hidden" : "";
      hamburger.setAttribute("aria-expanded", isActive);
    });

    // Handle Dropdowns and Sub-Dropdowns
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const link = item.querySelector(".nav-link");
      const dropdown = item.querySelector(".dropdown");
      const subDropdownItems = item.querySelectorAll(".has-sub-dropdown");

      // Toggle Dropdown on Mobile
      if (dropdown) {
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
      }

      // Toggle Sub-Dropdown on Mobile
      subDropdownItems.forEach((subItem) => {
        const subLink = subItem.querySelector(".dropdown-item");
        const subDropdown = subItem.querySelector(".sub-dropdown");
        if (subLink && subDropdown) {
          subLink.addEventListener("click", (e) => {
            if (window.innerWidth <= 768) {
              e.preventDefault();
              const isActive = subItem.classList.contains("active");
              subDropdownItems.forEach((i) => i.classList.remove("active"));
              if (!isActive) {
                subItem.classList.add("active");
                subLink.setAttribute("aria-expanded", "true");
              } else {
                subLink.setAttribute("aria-expanded", "false");
              }
            }
          });
        }
      });
    });

    // Close Menu on Outside Click
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        navItems.forEach((item) => {
          item.classList.remove("active");
          const link = item.querySelector(".nav-link");
          if (link) link.setAttribute("aria-expanded", "false");
          const subDropdownItems = item.querySelectorAll(".has-sub-dropdown");
          subDropdownItems.forEach((subItem) => {
            subItem.classList.remove("active");
            const subLink = subItem.querySelector(".dropdown-item");
            if (subLink) subLink.setAttribute("aria-expanded", "false");
          });
        });
        body.style.overflow = "";
        hamburger.setAttribute("aria-expanded", "false");
      }
    });

    // Keyboard Accessibility
    navItems.forEach((item) => {
      const link = item.querySelector(".nav-link");
      const dropdown = item.querySelector(".dropdown");
      if (dropdown && link) {
        link.addEventListener("focus", () => {
          item.classList.add("focus-within");
        });
        link.addEventListener("blur", (e) => {
          if (!item.contains(e.relatedTarget)) {
            item.classList.remove("focus-within");
          }
        });
      }

      const subDropdownItems = item.querySelectorAll(".has-sub-dropdown");
      subDropdownItems.forEach((subItem) => {
        const subLink = subItem.querySelector(".dropdown-item");
        const subDropdown = subItem.querySelector(".sub-dropdown");
        if (subLink && subDropdown) {
          subLink.addEventListener("focus", () => {
            subItem.classList.add("focus-within");
          });
          subLink.addEventListener("blur", (e) => {
            if (!subItem.contains(e.relatedTarget)) {
              subItem.classList.remove("focus-within");
            }
          });
        }
      });
    });
  }

  // Scroll Effect
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    const backToTop = document.querySelector(".back-to-top");
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
      if (backToTop) backToTop.classList.add("show");
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
      if (backToTop) backToTop.classList.remove("show");
    }
  });
});
