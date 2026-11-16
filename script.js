// Seleção dos elementos do DOM
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const messageArea = document.getElementById('message-area');
const weatherPanel = document.getElementById('weather-panel');

const cityNameEl = document.getElementById('city-name');
const regionCountryEl = document.getElementById('region-country');
const weatherIconEl = document.getElementById('weather-icon');
const frogAccessoryEl = document.getElementById('frog-accessory');
const currentTempEl = document.getElementById('current-temp');
const weatherConditionEl = document.getElementById('weather-condition');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');

// Acessórios vetoriais para o sapinho conforme o clima
const acessoriosSapo = {
    sol: `
        <circle cx="134" cy="24" r="12" fill="#ffd43b" stroke="#f59f00" stroke-width="2"/>
        <path d="M 34 42 L 62 42 L 59 53 Q 48 56 37 53 Z" fill="#2b2d42" opacity="0.88"/>
        <path d="M 98 42 L 126 42 L 123 53 Q 112 56 101 53 Z" fill="#2b2d42" opacity="0.88"/>
        <line x1="62" y1="45" x2="98" y2="45" stroke="#2b2d42" stroke-width="3"/>
    `,
    chuva: `
        <path d="M 102 36 Q 130 8 156 36 Z" fill="#ffd43b" stroke="#4a5d23" stroke-width="2.5"/>
        <path d="M 129 36 L 129 92 Q 129 100 122 100" fill="none" stroke="#4a5d23" stroke-width="3" stroke-linecap="round"/>
        <circle cx="22" cy="34" r="2.5" fill="#4dabf7"/>
        <circle cx="18" cy="56" r="2.5" fill="#4dabf7"/>
    `,
    nublado: `
        <path d="M 114 26 Q 124 14 136 22 Q 148 16 154 28 Q 158 38 144 40 L 116 40 Q 106 36 114 26 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    `,
    frio: `
        <path d="M 46 104 Q 80 116 114 104 L 110 116 Q 80 126 50 116 Z" fill="#ff6b6b" stroke="#c92a2a" stroke-width="2"/>
        <path d="M 94 114 L 102 134 L 90 134 L 84 116 Z" fill="#ff6b6b" stroke="#c92a2a" stroke-width="2"/>
    `
};

// Mapeamento dos códigos meteorológicos WMO (Open-Meteo)
function interpretarCodigoClima(code) {
    if (code === 0) {
        return { texto: 'Céu limpo', icone: '☀️', acessorio: acessoriosSapo.sol, tema: 'theme-sunny' };
    }
    if (code >= 1 && code <= 3) {
        return { texto: 'Parcialmente nublado', icone: '⛅', acessorio: acessoriosSapo.nublado, tema: 'theme-cloudy' };
    }
    if (code === 45 || code === 48) {
        return { texto: 'Neblina ou nevoeiro', icone: '🌫️', acessorio: acessoriosSapo.frio, tema: 'theme-cloudy' };
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return { texto: 'Chuva ou chuvisco', icone: '🌧️', acessorio: acessoriosSapo.chuva, tema: 'theme-rain' };
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        return { texto: 'Neve', icone: '❄️', acessorio: acessoriosSapo.frio, tema: 'theme-cloudy' };
    }
    if (code >= 95 && code <= 99) {
        return { texto: 'Tempestade', icone: '⛈️', acessorio: acessoriosSapo.chuva, tema: 'theme-rain' };
    }
    return { texto: 'Clima agradável', icone: '🌤️', acessorio: acessoriosSapo.nublado, tema: 'theme-sunny' };
}

// Exibição de mensagens de status (carregando ou erro)
function mostrarMensagem(texto, tipo) {
    messageArea.textContent = texto;
    messageArea.className = `message-area ${tipo}`;
    messageArea.classList.remove('hidden');
}

function esconderMensagem() {
    messageArea.classList.add('hidden');
    messageArea.textContent = '';
}

// Busca coordenadas da cidade e depois consulta o clima atual
async function buscarClima(cidade) {
    weatherPanel.classList.add('hidden');
    mostrarMensagem('Consultando o céu e buscando dados meteorológicos...', 'loading');

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error('Falha ao conectar com o serviço de localização.');
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            mostrarMensagem(`Cidade "${cidade}" não encontrada. Verifique a ortografia e tente novamente.`, 'error');
            return;
        }

        const local = geoData.results[0];
        const { latitude, longitude, name, admin1, country } = local;

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error('Falha ao obter os dados meteorológicos.');
        }

        const weatherData = await weatherResponse.json();
        atualizarInterface(name, admin1, country, weatherData.current);

    } catch (erro) {
        mostrarMensagem('Ocorreu um erro ao buscar os dados do tempo. Verifique sua conexão.', 'error');
        console.error(erro);
    }
}

// Atualiza o HTML com os dados recebidos da API
function atualizarInterface(cidade, estado, pais, dadosAtuais) {
    esconderMensagem();

    const partesLocal = [estado, pais].filter(Boolean);
    cityNameEl.textContent = cidade;
    regionCountryEl.textContent = partesLocal.length > 0 ? partesLocal.join(', ') : 'Localização identificada';

    const temperatura = Math.round(dadosAtuais.temperature_2m);
    const sensacao = Math.round(dadosAtuais.apparent_temperature);
    const umidade = Math.round(dadosAtuais.relative_humidity_2m);
    const vento = Math.round(dadosAtuais.wind_speed_10m);

    const condicao = interpretarCodigoClima(dadosAtuais.weather_code);

    currentTempEl.textContent = `${temperatura}°C`;
    feelsLikeEl.textContent = `${sensacao}°C`;
    humidityEl.textContent = `${umidade}%`;
    windSpeedEl.textContent = `${vento} km/h`;

    weatherConditionEl.textContent = condicao.texto;
    weatherIconEl.textContent = condicao.icone;
    frogAccessoryEl.innerHTML = condicao.acessorio;

    document.body.className = condicao.tema;
    weatherPanel.classList.remove('hidden');
}

// Evento de envio do formulário
searchForm.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const cidadeDigitada = cityInput.value.trim();

    if (!cidadeDigitada) {
        weatherPanel.classList.add('hidden');
        mostrarMensagem('Por favor, digite o nome de uma cidade antes de buscar.', 'error');
        cityInput.focus();
        return;
    }

    buscarClima(cidadeDigitada);
});