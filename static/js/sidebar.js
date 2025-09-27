const logo = document.querySelector('aside .sidebar .logo');
const sidebar = document.querySelector('aside');

if (logo) {
    logo.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
}