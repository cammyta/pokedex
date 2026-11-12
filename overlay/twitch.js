/* Conexão com o chat da Twitch (somente leitura, sem login) */
(function () {
  window.USUM = window.USUM || {};
  const CFG = window.USUM_CONFIG || {};
  const qs = new URLSearchParams(location.search);
  const canal = (qs.get("canal") || CFG.canal || "").toLowerCase().replace(/^#|^@/, "").trim();
  const ouvintes = [];
  USUM.canal = canal;
  USUM.aoMensagem = (fn) => ouvintes.push(fn);
  const emitir = (m) => ouvintes.forEach((fn) => { try { fn(m); } catch (e) { console.error(e); } });

  function lerTags(raw) {
    const t = {};
    raw.split(";").forEach((p) => { const i = p.indexOf("="); t[p.slice(0, i)] = p.slice(i + 1).replace(/\\s/g, " "); });
    return t;
  }
  function interpretar(linha) {
    // @tags :user!user@user.tmi.twitch.tv PRIVMSG #canal :texto
    const m = linha.match(/^@(\S+) :(\w+)!\S+ PRIVMSG #\S+ :(.*)$/);
    if (!m) return null;
    const tags = lerTags(m[1]);
    const badges = (tags.badges || "").split(",").map((b) => b.split("/")[0]).filter(Boolean);
    let texto = m[3];
    const acao = texto.match(/^\u0001ACTION (.*)\u0001$/); if (acao) texto = acao[1];
    return {
      id: tags.id || Math.random().toString(36).slice(2),
      login: m[2].toLowerCase(),
      nome: tags["display-name"] || m[2],
      cor: tags.color || "",
      texto,
      emotes: tags.emotes || "",
      dono: badges.includes("broadcaster") || m[2].toLowerCase() === canal,
      ajudante: (CFG.ajudantes || []).map((x) => String(x).toLowerCase()).includes(m[2].toLowerCase()),
      mod: badges.includes("moderator") || tags.mod === "1",
      vip: badges.includes("vip"),
      sub: badges.includes("subscriber") || badges.includes("founder"),
      meses: parseInt(((tags["badge-info"] || "").match(/(?:subscriber|founder)\/(\d+)/) || [])[1] || "0", 10),
      bits: parseInt(tags.bits || "0", 10),
      respostaPara: (tags["reply-parent-user-login"] || "").toLowerCase(),
      respostaNome: tags["reply-parent-display-name"] || "",
      recompensa: tags["custom-reward-id"] || ""   // resgate de pontos do canal (com texto)
    };
  }
  // avisos da Twitch: sub, resub, sub de presente...
  function interpretarEvento(linha) {
    const m = linha.match(/^@(\S+) :tmi\.twitch\.tv USERNOTICE #\S+/);
    if (!m) return null;
    const t = lerTags(m[1]);
    return {
      tipo: "evento", id: t.id || Math.random().toString(36).slice(2), evento: t["msg-id"] || "",
      login: (t.login || "").toLowerCase(), nome: t["display-name"] || t.login || "",
      meses: parseInt(t["msg-param-cumulative-months"] || "0", 10),
      presentesTotal: parseInt(t["msg-param-sender-count"] || "0", 10),
      presentesAgora: parseInt(t["msg-param-mass-gift-count"] || "0", 10)
    };
  }

  let espera = 1000, avisado = false;
  function conectar() {
    if (!canal || canal === "seucanal") { console.warn("[USUM] Configure o canal no config.js"); emitir({ tipo: "status", ok: false, canal: "" }); return; }
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      espera = 1000;
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + (10000 + Math.floor(Math.random() * 80000)));
      ws.send("JOIN #" + canal);
    };
    ws.onmessage = (ev) => {
      ev.data.split("\r\n").forEach((l) => {
        if (!l) return;
        if (l.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }
        if (/ ROOMSTATE #/.test(l) && !avisado) { avisado = true; emitir({ tipo: "status", ok: true, canal }); }
        if (/ CLEARCHAT /.test(l) || / CLEARMSG /.test(l)) { emitir({ tipo: "limpar", raw: l }); return; }
        const msg = interpretar(l) || interpretarEvento(l); if (msg) emitir(msg);
      });
    };
    ws.onclose = () => { setTimeout(conectar, espera); espera = Math.min(espera * 2, 30000); };
  }

  // Envia uma mensagem falsa (para testes e modo demonstração)
  USUM.simular = (nome, texto, extra) => emitir(Object.assign({
    id: Math.random().toString(36).slice(2), login: nome.toLowerCase(), nome, cor: "", texto, emotes: "",
    dono: false, mod: false, vip: false, sub: false
  }, extra || {}));

  // espera as telas montarem o chat e a party antes de conectar
  window.addEventListener("load", () => setTimeout(() => {
    if (qs.get("demo")) return USUM.demo && USUM.demo();
    conectar();
  }, 300));

  /* ---------- modo demonstração: ?demo=1 ---------- */
  USUM.demo = function () {
    USUM.modoDemo = true;
    const dono = { dono: true, sub: true };
    const eu = USUM.canal && USUM.canal !== "seucanal" ? USUM.canal : "Camaleao";
    const roteiro = [
      ["AshKetchum", "!sol", { sub: true }],
      ["AshKetchum", "!pokemon pikachu", { sub: true }],
      ["AshKetchum", "!bola love ball", { sub: true }],
      ["Lillie_Fan", "!lua", { vip: true }],
      ["Lillie_Fan", "!pokemon vulpix alola", { vip: true }],
      ["Kukui", "Woo! Bora pra mais uma aventura em Alola!!", { mod: true }],
      ["Lillie_Fan", "a Lua vai ganhar hoje, confia 🌙", { sub: true }],
      [eu, "!party rowlet:love pikachu:great mimikyu:dusk", dono],
      ["AshKetchum", "ROWLET DE INICIAL SIM kkkkk", { sub: true }],
      ["Gladion", "!lua"], ["Gladion", "!pokemon lunala"],
      ["Hau", "!sol"], ["Hau", "!pokemon solgaleo"], ["Hau", "!bola dusk", { sub: true }],
      ["Hau", "Malasada pra todo mundo 🍩 bora!", { sub: true }],
      [eu, "!slot 4 rockruff Totó", dono],
      ["Gladion", "Necrozma vai dar trabalho... como assim??"],
      [eu, "!slot 5 litten shiny luxury ball", dono],
      ["Acerola", "!pokemon mimikyu"], ["Acerola", "!lua"],
      [eu, "!slot 6 popplio", dono],
      ["Acerola", "o Mimikyu é o melhor do time kkkk", { sub: true }],
      ["Mallow", "!pokemon rockruff"], ["Mallow", "!sol"],
      ["Mallow", "vai Totó!! 🔥", { sub: true }],
      ["Gladion", "ok? o boss curou de novo"],
      ["Mallow", "NAO ACREDITO QUE ERROU", { sub: true }],
      ["Acerola", "perdeu a captura :(", { sub: true }],
      ["Hau", "CamyXany", { sub: true }],
      ["AshKetchum", "blz! próxima rota", { sub: true }],
      [eu, "!party2 litten popplio cosmog", dono],
      [eu, "!slot2 4 lycanroc meia noite", dono],
      [eu, "!evento conversa", dono],
      ["Hau", "@Gladion bora trocar Pokémon depois?", { sub: true, meses: 3 }],
      ["Gladion", "pode ser, mas o Lunala não sai do time", { respostaPara: "hau", respostaNome: "Hau" }],
      ["Hau", "kkkk justo", { sub: true, meses: 3, respostaPara: "gladion", respostaNome: "Gladion" }],
      ["Gladion", "@Hau amanhã eu te passo um Rockruff", {}],
      ["Hau", "fechou, parceiro!", { sub: true, meses: 3, respostaPara: "gladion", respostaNome: "Gladion" }],
      ["Gladion", "tmj", { respostaPara: "hau", respostaNome: "Hau" }],
      ["Lillie_Fan", "!minhasfitas", { sub: true }],
      ["Hau", "!fita bate-papo", { sub: true }],
      ["Hau", "olha minha fita nova 😎", { sub: true, meses: 3 }]
    ];
    let i = 0;
    (function prox() {
      const r = roteiro[i % roteiro.length]; i++;
      USUM.simular(r[0], r[1], r[2]);
      setTimeout(prox, 1400 + Math.random() * 1600);
    })();
  };
})();
