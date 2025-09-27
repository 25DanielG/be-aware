const logo = document.querySelector('aside .sidebar .logo');
const sidebar = document.querySelector('aside');

setTimeout(() => {
    document.body.classList.add('initialized');
}, 300);

if (logo) {
    logo.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
}