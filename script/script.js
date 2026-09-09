const countrySelect = document.getElementById("country");
const citySelect = document.getElementById("city");
const timeInput = document.getElementById("time");
const timeUnit = document.getElementById("timeUnit");
const buildButton = document.getElementById("buildRoute");

const routeSection = document.getElementById("routeSection");
const routeContainer = document.getElementById("route");
const routeInfo = document.getElementById("routeInfo");
const message = document.getElementById("message");


/* =========================
   ЗАГРУЗКА СТРАН
========================= */

async function loadCountries() {
    try {
        const response = await fetch("../php/get_countries.php");
        const countries = await response.json();

        countries.forEach(country => {
            const option = document.createElement("option");

            option.value = country.id;
            option.textContent = country.name;

            countrySelect.appendChild(option);
        });

    } catch (error) {
        showMessage("Не удалось загрузить страны.");
        console.error(error);
    }
}


/* =========================
   ВЫБОР СТРАНЫ
========================= */

countrySelect.addEventListener("change", async function () {

    const countryId = this.value;

    citySelect.innerHTML = "";

    if (!countryId) {

        citySelect.disabled = true;

        const option = document.createElement("option");

        option.textContent = "Сначала выберите страну";

        citySelect.appendChild(option);

        return;
    }

    citySelect.disabled = false;

    const loadingOption = document.createElement("option");

    loadingOption.textContent = "Загрузка...";

    citySelect.appendChild(loadingOption);

    try {

        const response =
            await fetch(`../php/get_cities.php?country_id=${countryId}`);

        const cities = await response.json();

        citySelect.innerHTML = "";

        const firstOption = document.createElement("option");

        firstOption.value = "";
        firstOption.textContent = "Выберите город";

        citySelect.appendChild(firstOption);

        cities.forEach(city => {

            const option = document.createElement("option");

            option.value = city.id;
            option.textContent = city.name;

            citySelect.appendChild(option);
        });

    } catch (error) {

        showMessage("Не удалось загрузить города.");

        console.error(error);
    }

});


/* =========================
   ПОСТРОЕНИЕ МАРШРУТА
========================= */

buildButton.addEventListener("click", async function () {

    hideMessage();

    const cityId = citySelect.value;
    const cityName =
        citySelect.options[citySelect.selectedIndex].text;

    const countryName =
        countrySelect.options[countrySelect.selectedIndex].text;

    const time = Number(timeInput.value);

    if (!cityId) {

        showMessage("Пожалуйста, выберите город.");

        return;
    }

    if (!time || time <= 0) {

        showMessage("Введите доступное время.");

        return;
    }

    let availableMinutes;

    if (timeUnit.value === "hours") {

        availableMinutes = time * 60;

    } else {

        availableMinutes = time;
    }

    try {

        const response =
            await fetch(`../php/get_attractions.php?city_id=${cityId}`);

        const attractions = await response.json();

        if (attractions.length === 0) {

            showMessage(
                "Для этого города пока нет достопримечательностей."
            );

            return;
        }

        const walkingTime = 15;

        let currentTime = 0;

        const selectedAttractions = [];

        for (let i = 0; i < attractions.length; i++) {

            const attraction = attractions[i];

            const visitTime = Number(attraction.visit_time);

            let additionalTime = visitTime;

            if (selectedAttractions.length > 0) {

                additionalTime += walkingTime;
            }

            if (currentTime + additionalTime <= availableMinutes) {

                selectedAttractions.push(attraction);

                currentTime += additionalTime;

            } else {

                break;
            }
        }

        if (selectedAttractions.length === 0) {

            showMessage(
                "Недостаточно времени даже для посещения первой достопримечательности."
            );

            return;
        }

        showRoute(
            selectedAttractions,
            currentTime,
            availableMinutes
        );


        /* =========================
           СОХРАНЕНИЕ МАРШРУТА
        ========================= */

        saveRouteToHistory({
            country: countryName,
            city: cityName,
            availableTime: availableMinutes,
            usedTime: currentTime,
            attractions: selectedAttractions
        });


    } catch (error) {

        showMessage("Ошибка при построении маршрута.");

        console.error(error);
    }

});


/* =========================
   СОХРАНЕНИЕ В LOCALSTORAGE
========================= */

function saveRouteToHistory(route) {

    let history = [];

    try {
        history =
            JSON.parse(localStorage.getItem("routeHistory")) || [];
    } catch (error) {
        history = [];
    }

    const newRoute = {

        id: Date.now(),

        country: route.country,

        city: route.city,

        availableTime: route.availableTime,

        usedTime: route.usedTime,

        attractions: route.attractions.map(attraction => ({

            name: attraction.name,

            description: attraction.description,

            visit_time: attraction.visit_time,

            image: attraction.image

        })),

        createdAt: new Date().toLocaleString("ru-RU")

    };

    history.unshift(newRoute);

    localStorage.setItem(
        "routeHistory",
        JSON.stringify(history)
    );

}


/* =========================
   ОТОБРАЖЕНИЕ МАРШРУТА
========================= */

function showRoute(attractions, usedTime, availableTime) {

    routeContainer.innerHTML = "";

    routeSection.classList.remove("hidden");

    const cityName =
        citySelect.options[citySelect.selectedIndex].text;

    routeInfo.textContent =
        `Город: ${cityName} • ${attractions.length} достопримечательностей • использовано ${usedTime} мин. из ${availableTime} мин.`;

    attractions.forEach((attraction, index) => {

        const card = document.createElement("div");

        card.className = "route-card";

        const imageName =
            String(attraction.image || "").trim();

        card.innerHTML = `
            <img 
                src="../images/${imageName}" 
                alt="${escapeHtml(attraction.name)}"
                class="attraction-image"
                onerror="console.log('НЕ НАЙДЕНА КАРТИНКА:', this.src)"
            >

            <div class="route-number">${index + 1}</div>

            <h3>${escapeHtml(attraction.name)}</h3>

            <p>${escapeHtml(attraction.description)}</p>

            <span class="visit-time">
                ⏱ Время посещения: ${attraction.visit_time} мин.
            </span>
        `;

        routeContainer.appendChild(card);

        if (index < attractions.length - 1) {

            const arrow = document.createElement("div");

            arrow.className = "route-arrow";

            arrow.textContent = "↓ 15 мин. пешком";

            routeContainer.appendChild(arrow);
        }

    });

    window.scrollTo({
        top: routeSection.offsetTop - 20,
        behavior: "smooth"
    });

}


/* =========================
   СООБЩЕНИЯ
========================= */

function showMessage(text) {

    message.textContent = text;

    message.classList.remove("hidden");
}


function hideMessage() {

    message.classList.add("hidden");
}


/* =========================
   ЗАЩИТА ОТ HTML
========================= */

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================
   ЗАПУСК
========================= */

loadCountries();