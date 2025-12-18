document.addEventListener('DOMContentLoaded', () => {
    
    // ПЕРЕМЕННЫЕ
    let cart = JSON.parse(localStorage.getItem('technoCart')) || [];
    let isRegisterMode = false;

    // Элементы
    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('auth-modal');
    const closeBtns = document.querySelectorAll('.close');
    const cartCount = document.getElementById('cart-count');
    const cartTableBody = document.getElementById('cart-table-body');
    const cartTotalSum = document.getElementById('cart-total-sum');
    const checkoutPageBtn = document.getElementById('checkout-page-btn');
    const buyModal = document.getElementById('buy-modal');
    const buyForm = document.getElementById('buy-form');
    const orderTotal = document.getElementById('order-total');

    // Форма входа
    const loginForm = document.getElementById('login-form');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const toggleAuthLink = document.getElementById('toggle-auth');
    const nameInput = document.getElementById('reg-name');
    const nameWrap = document.getElementById('name-wrap');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const confirmPasswordWrap = document.getElementById('confirm-password-wrap');

    // ГАЛЕРЕЯ
    const galleryContainer = document.querySelector('.product-gallery-container');
    if (galleryContainer) {
        const mainImage = galleryContainer.querySelector('.main-image-wrapper img');
        const thumbnails = galleryContainer.querySelectorAll('.thumb-box');
        const prevBtn = galleryContainer.querySelector('.carousel-arrow.prev');
        const nextBtn = galleryContainer.querySelector('.carousel-arrow.next');
        let currentIndex = 0;

        function updateGallery(index) {
            if (index < 0) index = thumbnails.length - 1;
            if (index >= thumbnails.length) index = 0;
            currentIndex = index;
            thumbnails.forEach(t => t.classList.remove('active'));
            const activeThumb = thumbnails[currentIndex];
            activeThumb.classList.add('active');
            mainImage.style.opacity = 0;
            setTimeout(() => {
                mainImage.src = activeThumb.querySelector('img').src;
                mainImage.style.opacity = 1;
            }, 200);
        }
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => { updateGallery(index); });
        });
        if (prevBtn && nextBtn) {
            nextBtn.addEventListener('click', () => { updateGallery(currentIndex + 1); });
            prevBtn.addEventListener('click', () => { updateGallery(currentIndex - 1); });
        }
    }

    // АВТОРИЗАЦИЯ (РАБОТА С СЕРВЕРОМ)
    const activeUserName = localStorage.getItem('activeUserName');
    if (activeUserName) setLoggedInState(activeUserName);
    
    updateCartCounter();

    if (authBtn) {
        authBtn.addEventListener('click', () => {
            if (localStorage.getItem('activeUserName')) {
                if(confirm("Выйти из аккаунта?")) { 
                    localStorage.removeItem('activeUserName');
                    location.reload(); 
                }
            } else {
                if(authModal) { 
                    authModal.style.display = 'block'; 
                    isRegisterMode = false; 
                    updateAuthUI(); 
                    loginForm.reset(); 
                }
            }
        });
    }

    if (toggleAuthLink) {
        toggleAuthLink.addEventListener('click', (e) => {
            e.preventDefault(); isRegisterMode = !isRegisterMode; updateAuthUI();
        });
    }

    function updateAuthUI() {
        if (isRegisterMode) {
            authTitle.textContent = "Регистрация"; authSubmitBtn.textContent = "Зарегистрироваться"; toggleAuthLink.textContent = "Уже есть аккаунт? Войти";
            nameWrap.style.display = 'block'; nameInput.setAttribute('required', 'true');
            confirmPasswordWrap.style.display = 'block'; confirmPasswordInput.setAttribute('required', 'true');
        } else {
            authTitle.textContent = "Вход"; authSubmitBtn.textContent = "Войти"; toggleAuthLink.textContent = "Нет аккаунта? Регистрация";
            nameWrap.style.display = 'none'; nameInput.removeAttribute('required');
            confirmPasswordWrap.style.display = 'none'; confirmPasswordInput.removeAttribute('required');
        }
    }

    // ОТПРАВКА НА СЕРВЕР (AJAX/FETCH)
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (isRegisterMode) {
                // РЕГИСТРАЦИЯ
                const name = nameInput.value.trim();
                const confirmPass = confirmPasswordInput.value.trim();
                if (password !== confirmPass) { alert("Пароли не совпадают!"); return; }

                try {
                    let response = await fetch('/register', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ name, email, password })
                    });
                    let result = await response.json();
                    if (result.success) {
                        alert("Успешно! Теперь войдите.");
                        isRegisterMode = false; updateAuthUI();
                    } else {
                        alert("Ошибка: " + result.message);
                    }
                } catch (err) { alert("Ошибка сервера"); }
            } else {
                // ВХОД
                try {
                    let response = await fetch('/login', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ email, password })
                    });
                    let result = await response.json();
                    if (result.success) {
                        localStorage.setItem('activeUserName', result.name);
                        setLoggedInState(result.name);
                        authModal.style.display = 'none';
                    } else {
                        alert("Ошибка: " + result.message);
                    }
                } catch (err) { alert("Ошибка сервера"); }
            }
        });
    }

    function setLoggedInState(name) {
        if(authBtn) {
            authBtn.textContent = 'Выйти'; 
            authBtn.classList.add('logged-in-btn');
            let greeting = document.getElementById('greeting');
            if (!greeting) {
                greeting = document.createElement('span'); greeting.id = 'greeting';
                authBtn.parentNode.insertBefore(greeting, authBtn);
            }
            greeting.textContent = `Привет, ${name}`;
        }
    }

    // КОРЗИНА
    document.querySelectorAll('.add-to-cart-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            let id, name, price, img;
            if (btn.dataset.name) {
                id = btn.dataset.id; name = btn.dataset.name; price = parseInt(btn.dataset.price);
                const imgElem = btn.closest('.product-card').querySelector('img');
                img = imgElem ? imgElem.src : '';
            } else {
                const infoBlock = btn.closest('.product-info');
                name = infoBlock.querySelector('h1').innerText;
                const priceText = infoBlock.querySelector('.price').innerText;
                price = parseInt(priceText.replace(/\D/g, ''));
                id = name;
                const mainImg = document.querySelector('.main-image-wrapper img');
                img = mainImg ? mainImg.src : '';
            }
            cart.push({ id, name, price, img });
            localStorage.setItem('technoCart', JSON.stringify(cart));
            updateCartCounter();
            const originalText = btn.innerText;
            btn.innerText = "✓ Добавлено";
            btn.style.background = "#28a745";
            setTimeout(() => { btn.innerText = originalText; btn.style.background = ""; }, 1000);
        });
    });

    function updateCartCounter() { if(cartCount) cartCount.innerText = cart.length; }

    if (cartTableBody) renderCartPage();

    function renderCartPage() {
        cartTableBody.innerHTML = '';
        let total = 0;
        if (cart.length === 0) {
            cartTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px;">Корзина пуста</td></tr>';
        } else {
            cart.forEach((item, index) => {
                total += item.price;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="text-align:center;"><img src="${item.img}" class="cart-img-preview" alt="foto"></td>
                    <td><div class="cart-item-name">${item.name}</div></td>
                    <td>${item.price.toLocaleString()} руб.</td>
                    <td style="text-align:center;"><button class="btn-remove" onclick="removePageCart(${index})">&times;</button></td>
                `;
                cartTableBody.appendChild(row);
            });
        }
        if (cartTotalSum) cartTotalSum.innerText = total.toLocaleString();
    }

    window.removePageCart = function(index) {
        cart.splice(index, 1);
        localStorage.setItem('technoCart', JSON.stringify(cart));
        updateCartCounter();
        renderCartPage();
    };

    if (checkoutPageBtn) {
        checkoutPageBtn.addEventListener('click', () => {
            if (cart.length === 0) { alert("Корзина пуста!"); return; }
            if (buyModal) buyModal.style.display = 'block';
        });
    }

    if (buyForm) {
        buyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Заказ оформлен! Мы свяжемся с вами.");
            cart = [];
            localStorage.removeItem('technoCart');
            updateCartCounter();
            renderCartPage();
            buyModal.style.display = 'none';
        });
    }

    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        if(authModal) authModal.style.display = 'none';
        if(buyModal) buyModal.style.display = 'none';
    }));
    window.addEventListener('click', (e) => {
        if (e.target == authModal) authModal.style.display = 'none';
        if (e.target == buyModal) buyModal.style.display = 'none';
    });

    if (document.getElementById('map') && typeof ymaps !== 'undefined') {
        ymaps.ready(() => {
            var myMap = new ymaps.Map("map", { center: [55.759082, 37.611171], zoom: 15 });
            myMap.geoObjects.add(new ymaps.Placemark([55.759082, 37.611171]));
        });
    }
});