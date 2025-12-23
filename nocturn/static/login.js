let isRegister = false;
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('toggleBtn');
const info = document.getElementById('info');
const barGroups = document.querySelectorAll('.bar-group.register');

const loadingScreen = document.getElementById('loadingScreen')

const loginInputs = document.querySelectorAll('.loginInput')


const userNameInput = document.getElementById('userNameInput');

const passwordInput = document.getElementById('passwordInput');

const firstNameInput = document.getElementById('firstNameInput');

const lastNameInput = document.getElementById('lastNameInput');

let alertTimeout = null;


document.addEventListener('DOMContentLoaded', () => {
    loadingScreen.classList.add('hide')
    loginInputs.forEach(loginInput => {
        loginInput.addEventListener('keydown', (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                submitBtn.click();
            }
        })
    })
})


function toggleBar() {
    if (isRegister) {
        isRegister = !isRegister;
        submitBtn.textContent = "Giriş yap";
        toggleBtn.textContent = "Kayıt ol";
        info.textContent = "Henüz bir hesabın yok mu?";
        barGroups.forEach(bar => {
            bar.classList.toggle('active', isRegister);
        })
    } else {
        isRegister = !isRegister;
        submitBtn.textContent = "Kayıt ol";
        toggleBtn.textContent = "Giriş yap";
        info.textContent = "Zaten bir hesabın var mı?";
        barGroups.forEach(bar => {
            bar.classList.toggle('active', isRegister);
        })
    }
}


function login_register() {
    const username = userNameInput.value;
    const password = passwordInput.value;
    const firstname = firstNameInput.value;
    const lastname = lastNameInput.value;

    if (isRegister) {
        console.log(firstname,lastname)
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password,
                firstname: firstname,
                lastname: lastname,
            })
        })
            .then(res => res.json())
            .then(data => {
                if(data.success){
                    showAlert(data);
                    setTimeout(()=> {
                        window.location.href = "/";

                    },1000);
                } else {
                    showAlert(data)
                }
            })
    } else {
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAlert(data);
                    setTimeout(()=> {
                        window.location.href = "/";
                    },1000);
                } else {
                    showAlert(data);
                }
            })
    }
}

function showAlert(data, duration = 2000) {
    const alertBar = document.getElementById('alert-bar');

    if (alertTimeout) clearTimeout(alertTimeout);

    if (data.success) {
        alertBar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30px" height="30px" viewBox="0 0 512 512" version="1.1">
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="add-copy-2" fill="#0dac0dff" transform="translate(42.666667, 42.666667)">
                        <path d="M213.333333,3.55271368e-14 C95.51296,3.55271368e-14 3.55271368e-14,95.51296 3.55271368e-14,213.333333 C3.55271368e-14,331.153707 95.51296,426.666667 213.333333,426.666667 C331.153707,426.666667 426.666667,331.153707 426.666667,213.333333 C426.666667,95.51296 331.153707,3.55271368e-14 213.333333,3.55271368e-14 Z M293.669333,137.114453 L323.835947,167.281067 L192,299.66912 L112.916693,220.585813 L143.083307,190.4192 L192,239.335893 L293.669333,137.114453 Z" id="Shape">
                        </path>
                    </g>
                </g>
            </svg>
            <div id="alert-bar-message">
                ${data.success}
            </div>
            `;
    } else if (data.error) {
        alertBar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.5-5.009c0-.867.659-1.491 1.491-1.491.85 0 1.509.624 1.509 1.491 0 .867-.659 1.509-1.509 1.509-.832 0-1.491-.642-1.491-1.509zM11.172 6a.5.5 0 0 0-.499.522l.306 7a.5.5 0 0 0 .5.478h1.043a.5.5 0 0 0 .5-.478l.305-7a.5.5 0 0 0-.5-.522h-1.655z" fill="#770000ff"/></svg>
            <div id="alert-bar-message">
                ${data.error}
            </div>
            `;
    } else {
        alertBar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="30px" height="30px">
                <circle cx="50" cy="50" r="45" fill="var(--main-color)" opacity="0.15" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--main-color)" stroke-width="3" />
                <circle cx="50" cy="32" r="4" fill="var(--main-color)" />
                <rect x="46" y="42" width="8" height="28" rx="2" fill="var(--main-color)" />
            </svg>
            <div id="alert-bar-message">
                ${data}
            </div>
            `
    }

    alertBar.classList.add('show');
    alertTimeout = setTimeout(() => {
        alertBar.classList.remove('show');
        alertTimeout = null;
    }, duration)
}