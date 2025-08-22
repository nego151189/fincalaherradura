/* /js/nav.js — Botonera inferior común
   - Inyecta <nav> con enlaces a las secciones clave.
   - Resalta la página activa.
   - No usa imports; funciona offline.
*/
(function () {
  var LINKS = [
    { href: "/index.html",       icon: "🏠", label: "Inicio" },
    { href: "/produccion.html",  icon: "🌿", label: "Cosecha" },
    { href: "/riegos.html",      icon: "💧", label: "Riego" },
    { href: "/precios.html",     icon: "💰", label: "Precios" },
    { href: "/ventas.html",      icon: "🧾", label: "Ventas" },
    { href: "/gastos.html",      icon: "📉", label: "Gastos" },
    { href: "/tratamientos.html",icon: "🧪", label: "Tratam." },
    { href: "/arboles.html",     icon: "🌳", label: "Árboles" }
  ];

  function isActive(href) {
    var p = (location.pathname || "/").replace(/\/+$/, "");
    if (!p) p = "/index.html";
    if (p === "/") return href === "/index.html";
    return p.endsWith(href);
  }

  function render() {
    var nav = document.createElement("nav");
    nav.className = "bottom-nav";
    var html = "";
    for (var i = 0; i < LINKS.length; i++) {
      var L = LINKS[i];
      html += '<a class="' + (isActive(L.href) ? 'active' : '') + '" href="' + L.href + '" aria-label="' + L.label + '">'
           +   '<span class="ico">' + L.icon + '</span>'
           +   '<span class="lbl">' + L.label + '</span>'
           + '</a>';
    }
    nav.innerHTML = html;
    document.body.appendChild(nav);
    document.body.classList.add('has-bottom-nav');
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
