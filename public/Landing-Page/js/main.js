const header = document.getElementById("header");
const heroSection = document.querySelector(".hero");

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const currentScroll = window.scrollY;
  const heroHeight = heroSection.offsetHeight;

  // إذا نزلنا تحت الهيرو → اخفي الهيدر
  if (currentScroll > heroHeight) {
    header.classList.add("hide");
  } else {
    header.classList.remove("hide");
  }

  lastScrollY = currentScroll;
});

const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const closeMenuBtn = document.getElementById("close-menu-btn");
const overlay = document.getElementById("mobile-overlay");

// فتح القائمة
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.add("open");
    if (overlay) overlay.classList.add("active");
  });
}

// غلق القائمة
function closeMenu() {
  if (mobileMenu) mobileMenu.classList.remove("open");
  if (overlay) overlay.classList.remove("active");
}

if (closeMenuBtn) {
  closeMenuBtn.addEventListener("click", closeMenu);
}

if (overlay) {
  overlay.addEventListener("click", closeMenu);
}

// غلق القائمة عند الضغط على أي رابط
document.querySelectorAll("#mobile-menu .menu-link").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

function loadProducts(jsonFile, containerId, maxItems = 4) {
  fetch(jsonFile)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((products) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = "";

      // نسخة من المصفوفة عشان ما نعدلش الأصلية
      const shuffled = products.slice();

      // خوارزمية Fisher-Yates لترتيب عشوائي حقيقي
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // نأخذ أول maxItems بعد الترتيب العشوائي
      shuffled.slice(0, maxItems).forEach((product) => {
        const productCard = `
          <div class="product-card group cursor-pointer">
            <div class="overflow-hidden">
              <img src="${product.image}" alt="منتج" class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <!-- تم حذف الاسم والسعر لأننا حذفناهم من الـ JSON -->
            <!-- إذا بدك تضيف نص بديل أو شيء ثاني هنا، ممكن -->
          </div>`;
        container.innerHTML += productCard;
      });
    })
    .catch((error) => {
      console.error("خطأ في تحميل المنتجات:", error);
    });
}

// استدعاء الدالة لكل قسم (هيختار 4 عشوائيين كل مرة)
loadProducts("data/makeup.json", "makeup-container", 4);
loadProducts("data/perfumes.json", "perfumes-container", 4);
loadProducts("data/skincare.json", "skincare-container", 4);
loadProducts("data/clothes.json", "clothes-container", 4);
loadProducts("data/bag.json", "bag-container", 4);
loadProducts("data/magat.json", "magat-container", 4);

// Smooth scrolling لجميع الروابط الداخلية (#)
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    if (targetId === "#") return; // تجاهل الروابط الفارغة

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // إغلاق الموبايل مينيو إذا كان مفتوحًا
      const mobileMenu = document.getElementById("mobile-menu");
      if (mobileMenu && mobileMenu.classList.contains("open")) {
        mobileMenu.classList.remove("open");
        const menuIcon = document.getElementById("menu-icon");
        if (menuIcon) menuIcon.classList.replace("fa-xmark", "fa-bars");
      }
    }
  });
});