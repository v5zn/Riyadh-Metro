let mybutton = document.getElementById("myBtn");

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("user"));
    const usernameDisplay = document.getElementById("username-display");
    const usernameLink = document.getElementById("username-link");
    
    if (user) {
        if (usernameDisplay) {
            usernameDisplay.textContent = user.username;
        }
        if (usernameLink) {
            usernameLink.href = "account.html";
        }
    } else {
        if (usernameLink) {
            usernameLink.href = "login.html";
        }
    }

   
    if (window.location.pathname.includes('index.html')) {
        loadActiveTickets();
    }
});

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
