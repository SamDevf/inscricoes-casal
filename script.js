// ====== CONFIGURAÇÃO ======
// Troque pela URL de produção quando o backend estiver publicado.
const API_BASE_URL = "https://encontro-casais-api.onrender.com";
const ENDPOINT_INSCRICAO = `${API_BASE_URL}/api/v1/inscricoes`;
const VALOR_INSCRICAO = 200.0;

// ====== ELEMENTOS ======
const campos = {
  conjuge1: document.getElementById("conjuge1"),
  conjuge2: document.getElementById("conjuge2"),
  email:    document.getElementById("email"),
  telefone: document.getElementById("telefone"),
  igreja:   document.getElementById("igreja"),
};
const form      = document.getElementById("form-inscricao");
const btnEnviar = document.getElementById("btn-enviar");
const erro      = document.getElementById("erro");
const TEXTO_BOTAO = btnEnviar.textContent;
let envioEmAndamento = false;

// ====== MÁSCARA (XX) XXXXX-XXXX ======
campos.telefone.addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 6)      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  else if (v.length > 0) v = `(${v}`;
  e.target.value = v;
});

// ====== FOTOS AUSENTES: mostra iniciais ======
document.querySelectorAll(".photo img").forEach((img) => {
  img.addEventListener("error", () => {
    img.parentElement.textContent = img.dataset.initials || "";
  });
});

// ====== AUXILIARES ======
function mostrarErro(texto) {
  erro.textContent = texto;
  erro.hidden = false;
}

function limparErro() {
  erro.hidden = true;
  Object.values(campos).forEach((c) => c.classList.remove("invalid"));
}

function setCarregando(carregando) {
  btnEnviar.disabled = carregando;
  btnEnviar.textContent = carregando
    ? "Gerando ambiente seguro de pagamento..."
    : TEXTO_BOTAO;
}

function validar() {
  let ok = true;
  for (const c of Object.values(campos)) {
    if (!c.value.trim()) { c.classList.add("invalid"); ok = false; }
  }
  if (campos.telefone.value.replace(/\D/g, "").length < 10) {
    campos.telefone.classList.add("invalid");
    ok = false;
  }
  if (!campos.email.validity.valid) {
    campos.email.classList.add("invalid");
    ok = false;
  }
  if (!ok) mostrarErro("Preencha todos os campos corretamente antes de continuar.");
  return ok;
}

// ====== ENVIO PARA O BACKEND ======
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (envioEmAndamento) return;

  limparErro();
  if (!validar()) return;

  const payload = {
    nomeConjuge1: campos.conjuge1.value.trim(),
    nomeConjuge2: campos.conjuge2.value.trim(),
    email:        campos.email.value.trim(),
    telefone:     campos.telefone.value.trim(),
    igreja:       campos.igreja.value.trim(),
    valor:        VALOR_INSCRICAO,
  };

  envioEmAndamento = true;
  setCarregando(true);

  try {
    const resposta = await fetch(ENDPOINT_INSCRICAO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      throw new Error(`Resposta do servidor: ${resposta.status}`);
    }

    const resultado = await resposta.json();

    if (!resultado.initPoint) {
      throw new Error("A resposta não trouxe o link de pagamento (initPoint).");
    }

    // Mantém o botão desabilitado: o usuário está sendo redirecionado.
    window.location.href = resultado.initPoint;
  } catch (err) {
    console.error("Erro ao criar inscrição:", err);
    mostrarErro("Não foi possível concluir sua inscrição agora. Verifique sua conexão e tente novamente em instantes.");
    setCarregando(false);
    envioEmAndamento = false;
  }
});
