/* Pokémon selvagens: sorteio, chance de captura e a caixa (Pokémon capturados) de cada pessoa.
   Dados oficiais de taxa de captura (PokeAPI) dos 807 Pokémon do Ultra Sun / Ultra Moon. */
(function () {
  window.USUM = window.USUM || {};
  const C = Object.assign({ minutosMin: 10, minutosMax: 20, segundos: 12, chanceLendario: 0.02, chanceShiny: 0.003, chanceUltimaForma: 0.005, chanceMeioForma: 0.01, bonusAlola: 4,
    vida: 0.5, bonusCaptura: 0, limitePorEspecie: 10, recompensaId: "", iniciais: [722, 725, 728, 25, 133, 35] },
    (window.USUM_CONFIG || {}).selvagens);

  const TAXA = [0,45,45,45,45,45,45,45,45,45,255,120,45,255,120,45,255,120,45,255,127,255,90,255,90,190,75,255,90,235,120,45,235,120,45,150,25,190,75,170,50,255,90,255,120,45,190,75,190,75,255,50,255,90,190,75,190,75,190,75,255,120,45,200,100,50,180,90,45,255,120,45,190,60,255,120,45,190,60,190,75,190,60,45,190,45,190,75,190,75,190,60,190,90,45,45,190,75,225,60,190,60,90,45,190,75,45,45,45,190,60,120,60,30,45,45,225,75,225,60,225,60,45,45,45,45,45,45,45,255,45,45,35,45,45,45,45,45,45,45,45,45,45,25,3,3,3,45,45,45,3,45,45,45,45,45,45,45,45,45,45,255,90,255,90,255,90,255,90,90,190,75,190,150,170,190,75,190,75,235,120,45,45,190,75,65,45,255,120,45,45,235,120,75,255,90,45,45,30,70,45,225,45,60,190,75,190,60,25,190,75,45,25,190,45,60,120,60,190,75,225,75,60,190,75,45,25,25,120,45,45,120,60,45,45,45,75,45,45,45,45,45,30,3,3,3,45,45,45,3,3,45,45,45,45,45,45,45,45,45,45,255,127,255,90,255,120,45,120,45,255,120,45,255,120,45,200,45,190,45,235,120,45,200,75,255,90,255,120,45,255,120,45,190,120,45,180,200,150,255,255,60,45,45,180,90,45,180,90,120,45,200,200,150,150,150,225,75,225,60,125,60,255,150,90,255,60,255,255,120,45,190,60,255,45,90,90,45,45,190,75,205,155,255,90,45,45,45,45,255,60,45,200,225,45,190,90,200,45,30,125,190,75,255,120,45,255,60,60,25,225,45,45,45,3,3,3,3,3,3,3,3,3,3,45,3,3,45,45,45,45,45,45,45,45,45,255,120,45,255,127,255,45,235,120,45,255,75,45,45,45,45,120,45,45,120,45,200,190,75,190,75,190,75,45,125,60,190,60,45,30,190,75,120,225,60,255,90,255,145,130,30,100,45,45,45,50,75,45,140,60,120,45,140,75,200,190,75,25,120,60,45,30,30,30,30,30,30,30,30,45,45,30,50,30,45,60,45,75,45,3,3,3,3,3,3,3,3,3,30,3,3,45,3,3,45,45,45,45,45,45,45,45,45,255,255,255,120,45,255,90,190,75,190,75,190,75,190,75,255,120,45,190,75,255,120,45,190,45,120,60,255,180,90,45,255,120,45,45,45,255,120,45,255,120,45,190,75,190,75,25,180,90,45,120,60,255,190,75,180,90,45,190,90,45,45,45,45,190,60,75,45,255,60,200,100,50,200,100,50,190,45,255,120,45,190,75,200,200,75,190,75,190,60,75,190,75,255,90,130,60,30,190,60,30,255,90,190,90,45,75,60,45,120,60,25,200,75,75,180,45,45,190,90,120,45,45,190,60,190,60,90,90,45,45,45,45,15,3,3,3,3,3,3,3,3,3,3,3,3,45,45,45,45,45,45,45,45,45,255,127,255,120,45,255,120,45,220,65,225,120,45,200,45,220,65,160,190,75,180,90,45,200,140,200,140,190,80,120,45,225,55,225,55,190,75,45,45,45,45,45,100,180,60,45,45,45,75,120,60,120,60,190,55,190,45,45,45,3,3,3,3,45,45,45,45,45,45,45,45,45,255,120,45,255,127,255,120,45,225,60,45,190,75,190,90,60,190,75,190,60,200,100,190,75,190,75,120,45,140,70,235,120,45,60,45,45,90,45,140,60,60,3,3,30,45,70,180,45,80,70,25,45,45,45,3,3,3,3,45,45,45,45,45,45,45,45,45,45,45,255,3,3,45,45,30,30,3];
  const LENDARIOS = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721,772,773,785,786,787,788,789,790,791,792,800,801,802,807,
    793,794,795,796,797,798,799,803,804,805,806]; // + Ultra Beasts
  const ehLendario = new Set(LENDARIOS);
  const INICIAIS = new Set(C.iniciais);
  // evoluções (filho:pai) dos 807 Pokémon do Ultra Sun / Ultra Moon
  const EVOLUI = {};
  "2:1,3:2,5:4,6:5,8:7,9:8,11:10,12:11,14:13,15:14,17:16,18:17,20:19,22:21,24:23,25:172,26:25,28:27,30:29,31:30,33:32,34:33,35:173,36:35,38:37,39:174,40:39,42:41,44:43,45:44,47:46,49:48,51:50,53:52,55:54,57:56,59:58,61:60,62:61,64:63,65:64,67:66,68:67,70:69,71:70,73:72,75:74,76:75,78:77,80:79,82:81,85:84,87:86,89:88,91:90,93:92,94:93,97:96,99:98,101:100,103:102,105:104,106:236,107:236,110:109,112:111,113:440,117:116,119:118,121:120,122:439,124:238,125:239,126:240,130:129,134:133,135:133,136:133,139:138,141:140,143:446,148:147,149:148,153:152,154:153,156:155,157:156,159:158,160:159,162:161,164:163,166:165,168:167,169:42,171:170,176:175,178:177,180:179,181:180,182:44,183:298,184:183,185:438,186:61,188:187,189:188,192:191,195:194,196:133,197:133,199:79,202:360,205:204,208:95,210:209,212:123,217:216,219:218,221:220,224:223,226:458,229:228,230:117,232:231,233:137,237:236,242:113,247:246,248:247,253:252,254:253,256:255,257:256,259:258,260:259,262:261,264:263,266:265,267:266,268:265,269:268,271:270,272:271,274:273,275:274,277:276,279:278,281:280,282:281,284:283,286:285,288:287,289:288,291:290,292:290,294:293,295:294,297:296,301:300,305:304,306:305,308:307,310:309,315:406,317:316,319:318,321:320,323:322,326:325,329:328,330:329,332:331,334:333,340:339,342:341,344:343,346:345,348:347,350:349,354:353,356:355,358:433,362:361,364:363,365:364,367:366,368:366,372:371,373:372,375:374,376:375,388:387,389:388,391:390,392:391,394:393,395:394,397:396,398:397,400:399,402:401,404:403,405:404,407:315,409:408,411:410,413:412,414:412,416:415,419:418,421:420,423:422,424:190,426:425,428:427,429:200,430:198,432:431,435:434,437:436,444:443,445:444,448:447,450:449,452:451,454:453,457:456,460:459,461:215,462:82,463:108,464:112,465:114,466:125,467:126,468:176,469:193,470:133,471:133,472:207,473:221,474:233,475:281,476:299,477:356,478:361,496:495,497:496,499:498,500:499,502:501,503:502,505:504,507:506,508:507,510:509,512:511,514:513,516:515,518:517,520:519,521:520,523:522,525:524,526:525,528:527,530:529,533:532,534:533,536:535,537:536,541:540,542:541,544:543,545:544,547:546,549:548,552:551,553:552,555:554,558:557,560:559,563:562,565:564,567:566,569:568,571:570,573:572,575:574,576:575,578:577,579:578,581:580,583:582,584:583,586:585,589:588,591:590,593:592,596:595,598:597,600:599,601:600,603:602,604:603,606:605,608:607,609:608,611:610,612:611,614:613,617:616,620:619,623:622,625:624,628:627,630:629,634:633,635:634,637:636,651:650,652:651,654:653,655:654,657:656,658:657,660:659,662:661,663:662,665:664,666:665,668:667,670:669,671:670,673:672,675:674,678:677,680:679,681:680,683:682,685:684,687:686,689:688,691:690,693:692,695:694,697:696,699:698,700:133,705:704,706:705,709:708,711:710,713:712,715:714,723:722,724:723,726:725,727:726,729:728,730:729,732:731,733:732,735:734,737:736,738:737,740:739,743:742,745:744,748:747,750:749,752:751,754:753,756:755,758:757,760:759,762:761,763:762,768:767,770:769,773:772,783:782,784:783,790:789,791:790,792:790,804:803".split(",").forEach((par) => { const [f, pai] = par.split(":").map(Number); (EVOLUI[pai] = EVOLUI[pai] || []).push(f); });

  /* ---- tipos (para Net, Dive, Sport, Dream) ---- */
  const conj = (t) => new Set(t.split(",").map(Number));
  const AGUA = conj("7,8,9,54,55,60,61,62,72,73,79,80,86,87,90,91,98,99,116,117,118,119,120,121,129,130,131,134,138,139,140,141,158,159,160,170,171,183,184,186,194,195,199,211,222,223,224,226,230,245,258,259,260,270,271,272,278,279,283,318,319,320,321,339,340,341,342,349,350,363,364,365,366,367,368,369,370,382,393,394,395,400,418,419,422,423,456,457,458,484,489,490,501,502,503,515,516,535,536,537,550,564,565,580,581,592,593,594,647,656,657,658,688,689,690,692,693,721,728,729,730,746,747,748,751,752,767,768,771,779,788"), INSETO = conj("10,11,12,13,14,15,46,47,48,49,123,127,165,166,167,168,193,204,205,212,213,214,265,266,267,268,269,283,284,290,291,292,313,314,347,348,401,402,412,413,414,415,416,451,469,540,541,542,543,544,545,557,558,588,589,595,596,616,617,632,636,637,649,664,665,666,736,737,738,742,743,751,752,767,768,794,795"), PSI = conj("63,64,65,79,80,96,97,102,103,121,122,124,150,151,177,178,196,199,201,202,203,238,249,251,280,281,282,307,308,325,326,337,338,343,344,358,360,374,375,376,380,381,385,386,433,436,437,439,475,480,481,482,488,494,517,518,527,528,561,574,575,576,577,578,579,605,606,648,655,677,678,686,687,720,765,779,786,789,790,791,792,800"), FADA = conj("35,36,39,40,122,173,174,175,176,183,184,209,210,280,281,282,298,303,439,468,546,547,669,670,671,682,683,684,685,700,702,703,707,716,719,730,742,743,755,756,764,778,785,786,787,788,801");
  const ULTRA_BEASTS = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);
  const EVOLUIDOS = new Set(); Object.values(EVOLUI).forEach((fs) => fs.forEach((f) => EVOLUIDOS.add(f)));

  /* ---- Pokébolas. Compráveis com pontos do canal (gastam 1 por arremesso).
     Johto (level, lure, moon, friend, love, heavy, fast) e Premier: só visuais para subs. ---- */
  const COMPRAVEIS = ["great", "ultra", "master", "quick", "timer", "repeat", "nest", "net", "dive", "dusk", "dream",
                      "beast", "safari", "sport", "luxury", "heal", "cherish"];
  const JOHTO = ["level", "lure", "moon", "friend", "love", "heavy", "fast"];   // subs usam à vontade; quem forjou no rancho usa enquanto tiver
  const EFEITO = {
    poke: "Padrão de todo mundo, infinita",
    great: "1,5× a chance",
    ultra: "2× a chance",
    master: "Nunca falha",
    quick: "5× se você digitar !capturar nos 6 primeiros segundos",
    timer: "Quanto mais tarde você digitar !capturar, mais forte (até 4×)",
    repeat: "3,5× se você já capturou essa espécie",
    nest: "3× em Pokémon que ainda não evoluíram",
    net: "3,5× em Pokémon de Água ou Inseto",
    dive: "3,5× em Pokémon de Água",
    dusk: "3× à noite (das 18h às 6h)",
    dream: "4× em Pokémon Psíquico ou Fada",
    beast: "5× em Ultra Beasts, mas só 0,1× nos outros",
    safari: "1,5× a chance",
    sport: "1,5×, ou 3× em Pokémon Inseto",
    luxury: "Captura normal, mas vale +2 pontos para a sua equipe",
    heal: "Captura normal, mas não gasta se o Pokémon escapar",
    cherish: "2× em lendários e shinies",
    premier: "Captura normal. Vem de brinde em cada pacote de 10 bolas"
  };
  // força da bola nesse encontro. ctx = { login, t: segundos desde que a barra começou, shiny }
  function forca(bola, num, ctx) {
    ctx = ctx || {};
    const h = new Date().getHours(), t = Math.max(0, ctx.t || 0), seg = C.segundos || 10;
    switch (bola) {
      case "great": case "safari": return 1.5;
      case "ultra": return 2;
      case "master": return 999;
      case "quick": return t <= 6 ? 5 : 1;
      case "timer": return 1 + 3 * Math.min(1, t / seg);
      case "repeat": return ctx.login && caixa(ctx.login).p[num] ? 3.5 : 1;
      case "nest": return !EVOLUIDOS.has(num) && !ehLendario.has(num) ? 3 : 1;
      case "net": return AGUA.has(num) || INSETO.has(num) ? 3.5 : 1;
      case "dive": return AGUA.has(num) ? 3.5 : 1;
      case "dusk": return h >= 18 || h < 6 ? 3 : 1;
      case "dream": return PSI.has(num) || FADA.has(num) ? 4 : 1;
      case "beast": return ULTRA_BEASTS.has(num) ? 5 : 0.1;
      case "sport": return INSETO.has(num) ? 3 : 1.5;
      case "cherish": return ehLendario.has(num) || ctx.shiny ? 2 : 1;
      default: return 1;   // poke, luxury, heal e as visuais
    }
  }
  /* ---- quem aparece na grama ----
     Forma básica (ou Pokémon que não evolui) é o normal. Forma do meio (Pidgeotto, Ivysaur) e última forma
     (Pidgeot, Venusaur) são raras: chanceMeioForma e chanceUltimaForma no config.js. Lendários: chanceLendario.
     Estamos em Alola: os Pokémon da 7ª geração e os que têm forma de Alola aparecem bonusAlola vezes mais. */
  const PAI = {}; Object.entries(EVOLUI).forEach(([pai, fs]) => fs.forEach((f) => (PAI[f] = +pai)));
  const estagio = (n) => (!PAI[n] ? "basico" : (EVOLUI[n] || []).length ? "meio" : "final");
  const COM_FORMA_ALOLA = new Set([19, 20, 26, 27, 28, 37, 38, 50, 51, 52, 53, 74, 75, 76, 88, 89, 103, 105]);
  const deAlola = (n) => (n >= 722 && n <= 807) || COM_FORMA_ALOLA.has(n);
  // Pokédex de Alola (USUM, 403). Só esses aparecem na grama; os de outras regiões só com !surto <região> ligado
  const DEX_ALOLA = new Set([722,723,724,725,726,727,728,729,730,731,732,733,734,735,19,20,10,11,12,165,166,167,168,427,428,686,687,570,571,676,172,25,26,736,737,738,438,185,440,113,242,446,143,79,80,199,278,279,63,64,65,52,53,81,82,462,88,89,439,122,23,24,206,58,59,96,97,296,297,235,739,740,92,93,94,425,426,198,430,41,42,169,714,715,50,51,21,22,627,628,629,630,56,57,225,701,741,742,743,669,670,671,548,549,546,547,54,55,238,124,129,130,339,340,86,87,66,67,68,524,525,526,703,302,303,744,745,327,72,73,456,457,746,370,222,747,748,90,91,366,367,368,223,224,458,226,371,372,373,506,507,508,133,134,135,136,196,197,470,471,700,179,180,181,749,750,174,39,40,128,241,283,284,751,752,753,754,755,756,46,47,60,61,62,186,118,119,550,349,350,594,661,662,663,757,758,104,105,115,240,126,467,636,637,759,760,761,762,763,764,127,163,164,352,765,766,704,705,706,351,767,768,120,121,769,770,138,139,140,141,345,346,347,348,408,409,410,411,566,567,564,565,696,697,698,699,246,247,248,708,709,177,178,299,476,771,170,171,772,773,803,804,718,568,569,572,573,204,205,227,132,173,35,36,605,606,774,374,375,376,137,233,474,674,675,775,324,776,228,229,702,777,309,310,239,125,466,74,75,76,551,552,553,328,329,330,443,444,445,343,344,622,623,707,778,353,354,592,593,779,780,359,361,362,478,215,461,27,28,37,38,582,583,584,559,560,624,625,209,210,422,423,369,781,318,319,690,691,692,693,320,321,131,357,102,103,341,342,619,620,782,783,784,587,123,212,214,190,424,667,668,200,429,621,108,463,447,448,147,148,149,142,785,786,787,788,789,790,791,792,793,805,806,794,795,796,797,798,799,800,801,802,807]);
  const grupos = { basico: [], meio: [], final: [] };
  // bebês (Pichu, Togepi, Riolu…) só nascem de ovo no Day Care do rancho: não aparecem na grama
  const BEBES = new Set([172, 173, 174, 175, 236, 238, 239, 240, 298, 360, 406, 433, 438, 439, 440, 446, 447, 458]);
  for (let n = 1; n <= 807; n++) if (!ehLendario.has(n) && !BEBES.has(n)) grupos[estagio(n)].push([n, Math.pow(TAXA[n], 0.6) * (deAlola(n) ? (C.bonusAlola || 1) : 1)]);
  /* ---- surtos (eventos de 1 hora): !surto rapido (aparece 50% mais rápido) · !surto kanto (Pokémon de Kanto 50% mais) ---- */
  const REGIOES = { kanto: [1, 151, "Kanto"], johto: [152, 251, "Johto"], hoenn: [252, 386, "Hoenn"], sinnoh: [387, 493, "Sinnoh"],
    unova: [494, 649, "Unova"], kalos: [650, 721, "Kalos"], alola: [722, 807, "Alola"] };
  const ALIAS_REGIAO = { isshu: "unova", unova: "unova", galar: "", paldea: "" };
  function acharRegiao(t) {
    const k = String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
    const id = REGIOES[k] ? k : ALIAS_REGIAO[k];
    return id ? { id, nome: REGIOES[id][2] } : null;
  }
  function surto() {
    const x = ler("usum_surto", {}), agora = Date.now();
    return { rapido: (x.rapido || 0) > agora ? x.rapido : 0, regiao: x.regiao && x.regiao.ate > agora ? x.regiao : null };
  }
  const daRegiao = (n, id) => id === "alola" ? deAlola(n) : (n >= REGIOES[id][0] && n <= REGIOES[id][1]);
  function sortearDe(lista) {
    const reg = surto().regiao, mais = C.surtoRegiao || 1.6;
    // fora da Pokédex de Alola: peso 0, a não ser que o surto seja da região dele
    const pode = (n) => DEX_ALOLA.has(n) || (reg && reg.id !== "alola" && daRegiao(n, reg.id));
    lista = lista.filter(([n]) => pode(n)); if (!lista.length) return 10;
    const peso = (n, p) => (reg && daRegiao(n, reg.id) ? p * mais : p);
    let r = Math.random() * lista.reduce((a, x) => a + peso(x[0], x[1]), 0);
    for (const [n, p] of lista) { r -= peso(n, p); if (r <= 0) return n; }
    return lista[0][0];
  }

  /* ---- rota: os Pokémon que apareceram para o streamer no jogo (Citra) nos últimos minutos ----
     Enquanto tiver alguém na lista, a grama sorteia entre eles (é a rota onde ela está). */
  const minutosRota = () => (((window.USUM_CONFIG || {}).citra || {}).rotaMinutos || 30);
  function rota() {
    const lim = Date.now() - minutosRota() * 60e3;
    return ler("usum_rota", []).filter((x) => x.t > lim);
  }
  function anotarRota(num) {
    const l = rota().filter((x) => x.num !== num); l.push({ num, t: Date.now() });
    gravar("usum_rota", l.slice(-20));
  }
  const chanceRota = () => { const c = ((window.USUM_CONFIG || {}).citra || {}).chanceRota; return c == null ? 0.5 : c; };
  function sortear(opc) {
    opc = opc || {};
    // metade das vezes vem da rota do jogo, metade é aleatório (citra.chanceRota). Com surto de região ligado, vale o surto
    if (!opc.num && !opc.lendario && !opc.semRota && !surto().regiao && Math.random() < chanceRota()) { const r = rota(); if (r.length) opc = Object.assign({}, opc, { num: r[Math.floor(Math.random() * r.length)].num, daRota: true }); }
    const r = Math.random(), cL = C.chanceLendario, cF = C.chanceUltimaForma, cM = C.chanceMeioForma;
    const lendario = opc.lendario || (!opc.num && r < cL);
    let num = opc.num;
    if (!num) {
      if (lendario) { const reg = surto().regiao, ls = LENDARIOS.filter((n) => DEX_ALOLA.has(n) || (reg && reg.id !== "alola" && daRegiao(n, reg.id))); num = (ls.length ? ls : LENDARIOS)[Math.floor(Math.random() * (ls.length || LENDARIOS.length))]; }
      else if (opc.ultima) num = sortearDe(grupos.final);   // Hiper Mel / Raid: última forma
      else if (r < cL + (C.chanceInicialAlola ?? 0.01)) num = [722, 725, 728][Math.floor(Math.random() * 3)];   // Rowlet, Litten ou Popplio: 1% a mais
      else if (r < cL + (C.chanceInicialAlola ?? 0.01) + cF) num = sortearDe(grupos.final);       // última forma: raríssimo
      else if (r < cL + (C.chanceInicialAlola ?? 0.01) + cF + cM) num = sortearDe(grupos.meio);   // forma do meio: raro
      else num = sortearDe(grupos.basico);
    }
    // o que veio do jogo (Citra) é igual ao da tela: shiny só se for shiny no jogo, sem sorteio daqui
    const shiny = opc.espelho ? !!opc.shiny : (opc.shiny || Math.random() < C.chanceShiny);
    return { num, shiny, lendario: ehLendario.has(num), nome: USUM.nomeDe ? USUM.nomeDe(num) : "#" + num };
  }

  // Fórmula dos jogos (Gen 7) com Great Ball: a = (3*HPmax - 2*HPatual) * taxa * bola / (3*HPmax)
  function chance(num, bola, ctx) {
    const mult = forca(bola, num, ctx);
    if (mult >= 255) return 1;                     // Master Ball nunca falha
    const taxa = TAXA[num] || 45;
    const a = (3 - 2 * C.vida) * taxa * mult / 3;
    return Math.min(1, a / 255 + (C.bonusCaptura || 0));   // bônus extra (0 = chance normal dos jogos)
  }

  /* ---- caixa: usum_caixa = { login: { nome, p: { "722": { q, s, t } } } } ---- */
  const ler = (k, p) => { try { return JSON.parse(localStorage.getItem(k) || "null") || p; } catch (e) { return p; } };
  const gravar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  function caixa(login) { return (ler("usum_caixa", {})[login] || { p: {} }); }
  /* ---- status: cada Pokémon capturado tem 6 valores de força (0 a 31, como os IVs dos jogos) ----
     l: [{ iv: [ps, atq, def, atqE, defE, vel], s: 0|1, t: data }]. Força = soma / 186 (100% = perfeito) */
  const novoIV = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 32));
  // natureza (como nos jogos, em inglês): cada Pokémon capturado tem uma
  const NATUREZAS = ["Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax", "Timid", "Hasty",
    "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash", "Calm", "Gentle", "Sassy", "Careful", "Quirky"];
  const novaNatureza = () => Math.floor(Math.random() * 25);
  const nomeNatureza = (n) => NATUREZAS[n] || "";
  const forcaIV = (iv) => Math.round(((iv || []).reduce((a, b) => a + b, 0) / 186) * 100);
  const nota = (f) => (f >= 100 ? "Perfeito ✦" : f >= 90 ? "Incrível" : f >= 75 ? "Ótimo" : f >= 50 ? "Bom" : f >= 25 ? "Razoável" : "Fraco");
  // Pokémon capturados antes dos status ganham valores sorteados (uma vez só)
  function completar(e) {
    e.l = e.l || [];
    let sh = e.l.filter((x) => x.s).length;
    while (e.l.length < e.q) { const s = sh < e.s ? 1 : 0; sh += s; e.l.push({ iv: novoIV(), s, t: e.t || Date.now(), n: novaNatureza() }); }
    e.l.forEach((x) => { if (x.n == null) x.n = novaNatureza(); });   // os de antes ganham natureza (uma vez só)
    if (e.l.length > e.q) e.l = ordenar(e.l).slice(0, e.q);
    return e;
  }
  const ordenar = (l) => l.slice().sort((a, b) => forcaIV(b.iv) - forcaIV(a.iv) || a.t - b.t);
  (function migrar() {
    const todos = ler("usum_caixa", {}); let mudou = false;
    Object.values(todos).forEach((u) => Object.values(u.p || {}).forEach((e) => { if (!e.l || e.l.length !== e.q || e.l.some((x) => x.n == null)) { completar(e); mudou = true; } }));
    if (mudou) gravar("usum_caixa", todos);
  })();
  // lista da espécie em ordem (1 = mais forte); filtra shiny se pedir

  /* ---- nível e XP (no lugar do tempo de convívio) ----
     O parceiro ganha XP quando a pessoa fala no chat da live. Até o nível 63 sobe rápido; do 63 ao 100 é bem mais difícil.
     Para evoluir, precisa do nível do jogo (USUM_NIVEL_EVO, em core/golpes.js); quem evolui com pedra/item/troca não precisa de nível. */
  const sorte = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function nivelInicial(num) {
    if (ehLendario.has(num)) return sorte(50, 60);
    const e = estagio(num); return e === "final" ? sorte(32, 45) : e === "meio" ? sorte(18, 30) : sorte(3, 12);
  }
  // Pokémon que já estavam na caixa antes do nível existir: nível fixo calculado pela força (sem precisar salvar)
  function nivelDe(ind, num) {
    if (ind && ind.lv) return ind.lv;
    const h = ((ind && ind.iv) || []).reduce((a, b, i) => (a * 31 + b + i) >>> 0, 7), e = estagio(num);
    if (ehLendario.has(num)) return 50 + (h % 11);
    return e === "final" ? 32 + (h % 14) : e === "meio" ? 18 + (h % 13) : 5 + (h % 8);
  }
  const custoNivel = (L) => (L < 63 ? 6 + Math.floor(L / 4) : 40 + (L - 63) * 4);
  // dá XP ao parceiro (o melhor dessa espécie, shiny ou não igual ao parceiro). Devolve { antes, lv, xp, prox }
  function ganharXP(login, num, shiny, xp) {
    const todos = ler("usum_caixa", {}), u = todos[login], e = u && u.p && u.p[num];
    if (!e) return null;
    completar(e);
    const l = ordenar(e.l), ind = l.find((x) => !!x.s === !!shiny) || l[0]; if (!ind) return null;
    const antes = nivelDe(ind, num); ind.lv = antes; ind.xp = (ind.xp || 0) + xp;
    while (ind.lv < 100 && ind.xp >= custoNivel(ind.lv)) { ind.xp -= custoNivel(ind.lv); ind.lv++; }
    if (ind.lv >= 100) { ind.lv = 100; ind.xp = 0; }
    gravar("usum_caixa", todos);
    return { antes, lv: ind.lv, xp: ind.xp, prox: custoNivel(ind.lv) };
  }
  /* ---- EVs (treino no Dojo do rancho): até 252 por atributo e 510 no total, como nos jogos ---- */
  const EV_NOMES = { hp: "HP", at: "Ataque", df: "Defesa", sa: "Ataque Esp.", sd: "Defesa Esp.", ve: "Velocidade" };
  const evTotal = (ev) => Object.values(ev || {}).reduce((a, b) => a + (b || 0), 0);
  function treinarEV(login, num, shiny, stat, qtd) {
    if (!EV_NOMES[stat]) return null;
    const todos = ler("usum_caixa", {}), u = todos[login], e = u && u.p && u.p[num];
    if (!e) return null;
    completar(e);
    const l = ordenar(e.l), ind = l.find((x) => !!x.s === !!shiny) || l[0]; if (!ind) return null;
    const ev = ind.ev = ind.ev || {}, livre = Math.max(0, 510 - evTotal(ev)), add = Math.min(qtd, 252 - (ev[stat] || 0), livre);
    if (add <= 0) return { add: 0, ev: Object.assign({}, ev), cheio: true };
    ev[stat] = (ev[stat] || 0) + add; gravar("usum_caixa", todos);
    return { add, ev: Object.assign({}, ev) };
  }
  // item de segurar (ind.hi): troca o item que o Pokémon segura. Devolve o item que ele segurava antes (ou "")
  function segurarItem(login, num, ind, item) {
    const todos = ler("usum_caixa", {}), e = todos[login] && todos[login].p[num]; if (!e) return null;
    const alvo = (e.l || []).find((i) => i.t === ind.t && String(i.iv) === String(ind.iv)); if (!alvo) return null;
    const antes = alvo.hi || ""; if (item) alvo.hi = item; else delete alvo.hi;
    gravar("usum_caixa", todos); return { antes };
  }
  function nivelParaEvoluir(alvo) { const v = (window.USUM_NIVEL_EVO || {})[alvo]; return v == null ? 20 : v; }

  /* ---- golpes: cada Pokémon tem 1 golpe de dano, sorteado entre os que ele aprende no USUM (learnsets do Pokémon Showdown).
     Se a lista não carregar (sem internet), sorteia um golpe do tipo dele. ---- */
  let LEARN = null;
  const paraID = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/♀/g, "f").replace(/♂/g, "m").toLowerCase().replace(/[^a-z0-9]/g, "");
  /* ---------- Day Care como no jogo: grupo de ovo e sexo (dados do Showdown, baixados na hora) ---------- */
  let DEXI = null;   // { num: { g: ["Field", ...], r: chance de ser macho (0..1) ou -1 sem sexo } }
  function carregarDex() {
    if (carregarDex.p) return carregarDex.p;
    carregarDex.p = fetch("https://play.pokemonshowdown.com/data/pokedex.json").then((r) => r.json()).then((j) => {
      const D = {};
      Object.values(j).forEach((e) => {
        if (!e || !e.num || e.num < 1 || e.num > 807 || e.forme || D[e.num]) return;
        const r = e.gender === "M" ? 1 : e.gender === "F" ? 0 : e.gender === "N" ? -1 : e.genderRatio ? e.genderRatio.M : 0.5;
        D[e.num] = { g: e.eggGroups || [], r };
      });
      DEXI = D; return D;
    }).catch(() => { carregarDex.p = null; return null; });
    return carregarDex.p;
  }
  const gruposOvo = (n) => (DEXI && DEXI[n] ? DEXI[n].g : null);
  // sexo fixo de cada Pokémon (como no jogo, sai do "DNA" dele): ♂, ♀ ou "" (sem sexo)
  function sexoDe(ind, num) {
    if (ind && ind.sx) return ind.sx;
    const r = DEXI && DEXI[num] ? DEXI[num].r : 0.5;
    if (r < 0) return ""; if (r >= 1) return "♂"; if (r <= 0) return "♀";
    const h = (((ind && ind.iv) || []).reduce((a, b, i) => (a * 33 + b * 7 + i) >>> 0, 11) + Math.round(((ind && ind.t) || 0) / 1000)) % 1000;
    return h / 1000 < r ? "♂" : "♀";
  }
  // escolhe o melhor casal possível entre as espécies A e B da caixa. Devolve { a, b } (indivíduos) ou { erro }
  function casalDaycare(login, A, B) {
    const la = individuos(login, A), lb = individuos(login, B);
    if (!la.length || !lb.length) return { erro: "naotem" };
    if (A === B && la.length < 2) return { erro: "sozinho" };
    if (A === 132 && B === 132) return { erro: "dittos" };
    const ga = gruposOvo(A), gb = gruposOvo(B);
    if (ga && gb) {
      if (ga.includes("Undiscovered") || gb.includes("Undiscovered")) return { erro: "naobota", n: ga.includes("Undiscovered") ? A : B };
      const ditto = A === 132 || B === 132;
      if (!ditto && !ga.some((g) => gb.includes(g))) return { erro: "grupo", ga, gb };
    }
    const pares = [];
    la.forEach((x) => lb.forEach((y) => {
      if (x === y) return;   // o mesmo Pokémon não pode ser os dois pais
      const ditto = A === 132 || B === 132, sx = sexoDe(x, A), sy = sexoDe(y, B);
      if (!ditto && (!sx || !sy || sx === sy)) return;
      pares.push([x, y, forcaIV(x.iv) + forcaIV(y.iv)]);
    }));
    if (!pares.length) {
      const semSexo = (A !== 132 && !sexoDe(la[0], A)) || (B !== 132 && !sexoDe(lb[0], B));
      return { erro: semSexo ? "semsexo" : "mesmosexo", sx: sexoDe(la[0], A) };
    }
    pares.sort((p, q) => q[2] - p[2]);
    return { a: pares[0][0], b: pares[0][1] };
  }
  /* ---------- Equipes Sol × Lua: quem entra no time menor ganha bônus ---------- */
  function timesHoje() {
    const hoje = (ler("pk_sessao", {}) || {}).dia || new Date().toLocaleDateString("sv");
    const t = ler("usum_times", {}), d = ler("usum_times_dia", {}), c = { sol: 0, lua: 0 };
    Object.keys(d).forEach((l) => { if (d[l] === hoje && (t[l] === "sol" || t[l] === "lua")) c[t[l]]++; });
    return c;
  }
  // o time com menos gente nesta live (diferença de 2 ou mais); null se está equilibrado
  function timeMenor(c) { c = c || timesHoje(); return c.sol + 2 <= c.lua ? "sol" : c.lua + 2 <= c.sol ? "lua" : null; }
  function carregarGolpes() {
    carregarDex();
    if (carregarGolpes.p) return carregarGolpes.p;
    carregarGolpes.p = fetch("https://play.pokemonshowdown.com/data/learnsets.json").then((r) => r.json()).then((j) => {
      const G = window.USUM_GOLPES || {}, porId = {}; Object.keys(G).forEach((n) => (porId[paraID(n)] = n));
      const L = {};
      for (let n = 1; n <= 807; n++) {
        const ls = ((j[paraID(USUM.nomeDe ? USUM.nomeDe(n) : "")] || {}).learnset) || {};
        L[n] = Object.keys(ls).filter((k) => porId[k] && (ls[k] || []).some((s) => /^7/.test(s))).map((k) => porId[k]);
      }
      LEARN = L; return L;
    }).catch(() => null);
    return carregarGolpes.p;
  }
  function sortearGolpe(num) {
    const G = window.USUM_GOLPES || {};
    let l = LEARN && LEARN[num];
    if (!l || !l.length) { const tps = (USUM.rancho && USUM.rancho.tiposDe ? USUM.rancho.tiposDe(num) : []); l = Object.keys(G).filter((k) => G[k][1] >= 40 && G[k][1] <= 90 && (tps.includes(G[k][0]) || (!tps.length && G[k][0] === "normal"))); }
    if (!l.length) l = ["Tackle"];
    return l[Math.floor(Math.random() * l.length)];
  }
  // dá um golpe a quem ainda não tem (os Pokémon que já estavam na caixa). Só com a lista carregada, para ser um golpe que ele aprende
  function garantirGolpes(login) {
    if (!LEARN) return 0;
    const todos = ler("usum_caixa", {}), u = todos[login]; if (!u) return 0;
    let n = 0;
    Object.entries(u.p || {}).forEach(([num, e]) => { completar(e); e.l.forEach((x) => { if (!x.m || !(window.USUM_GOLPES || {})[x.m]) { x.m = sortearGolpe(+num); n++; } }); });
    if (n) gravar("usum_caixa", todos);
    return n;
  }
  // TM: troca um golpe por outro aleatório que ele aprende. qual: 1 ou 2. Slot: dá um 2º golpe aleatório
  function sortearOutro(num, fora) { let g = ""; for (let i = 0; i < 12; i++) { g = sortearGolpe(num); if (!fora.includes(g)) return g; } return g; }
  function mexerGolpe(login, num, ind, acao, qual) {
    const todos = ler("usum_caixa", {}), e = todos[login] && todos[login].p[num]; if (!e) return { erro: "naotem" };
    const alvo = (e.l || []).find((i) => i.t === ind.t && String(i.iv) === String(ind.iv)); if (!alvo) return { erro: "naotem" };
    if (!alvo.m) alvo.m = sortearGolpe(num);
    if (acao === "slot") {
      if (alvo.m2) return { erro: "jatem2", m: alvo.m, m2: alvo.m2 };
      alvo.m2 = sortearOutro(num, [alvo.m]); gravar("usum_caixa", todos); return { ok: 1, novo: alvo.m2, m: alvo.m, m2: alvo.m2 };
    }
    const k = qual === 2 && alvo.m2 ? "m2" : "m", antes = alvo[k];
    alvo[k] = sortearOutro(num, [alvo.m, alvo.m2 || ""]); gravar("usum_caixa", todos);
    return { ok: 1, antes, novo: alvo[k], m: alvo.m, m2: alvo.m2 || "" };
  }
  function golpeDe(ind, num) { return (ind && ind.m && (window.USUM_GOLPES || {})[ind.m]) ? ind.m : null; }
  function individuos(login, num) { const e = caixa(login).p[num]; return e ? ordenar(completar(e).l) : []; }
  // escolhe qual: número (1 = mais forte), "todos", ou o mais fraco (padrão)
  function escolher(l, qual, shiny) {
    const ok = l.filter((x) => !shiny || x.s);
    if (!ok.length) return null;
    if (typeof qual === "number") return l[qual - 1] && (!shiny || l[qual - 1].s) ? l[qual - 1] : null;
    return ok[ok.length - 1];
  }

  /* ---- Pokédex de verdade: toda espécie que a pessoa já teve fica registrada, mesmo se evoluiu, trocou ou soltou ----
     usum_registro = { login: [num, num...] } */
  /* Pokédex "vistos": espécies que a pessoa tentou capturar (pegou ou escapou) · usum_vistos = { login: [num...] } */
  function verPokemon(login, num) {
    if (!login || !num) return;
    const r = ler("usum_vistos", {}), l = r[login] || (r[login] = []);
    if (!l.includes(+num)) { l.push(+num); gravar("usum_vistos", r); }
  }
  function registrar(login, num) {
    const r = ler("usum_registro", {}), l = r[login] || (r[login] = []);
    if (!l.includes(+num)) { l.push(+num); gravar("usum_registro", r); }
  }
  (function migrarRegistro() {
    const r = ler("usum_registro", {}); let mudou = false;
    Object.entries(ler("usum_caixa", {})).forEach(([login, u]) => Object.keys(u.p || {}).forEach((n) => {
      const l = r[login] || (r[login] = []); if (!l.includes(+n)) { l.push(+n); mudou = true; } }));
    if (mudou) gravar("usum_registro", r);
  })();
  function guardar(login, nome, num, shiny, iv, apelido, natureza, forma, extra) {
    const todos = ler("usum_caixa", {});
    const u = todos[login] || (todos[login] = { nome, p: {} });
    u.nome = nome || u.nome;
    const e = completar(u.p[num] || (u.p[num] = { q: 0, s: 0, t: Date.now(), l: [] }));
    const ind = { iv: iv ? iv.slice() : novoIV(), s: shiny ? 1 : 0, t: Date.now(), n: natureza != null ? natureza : novaNatureza() };
    if (apelido) ind.a = String(apelido).slice(0, 12);
    if (forma && USUM.urlFormaHome && USUM.urlFormaHome(num, forma, false)) ind.f = forma;   // forma não regional (Oricorio Pom-Pom...)
    // nível e golpe: quem evolui leva os do Pokémon de antes; selvagem novo ganha nível conforme o estágio e um golpe que ele aprende
    ind.lv = (extra && extra.lv) || nivelInicial(num);
    if (extra && extra.xp) ind.xp = extra.xp;
    const g = (extra && extra.m) || (LEARN ? sortearGolpe(num) : ""); if (g) ind.m = g;
    e.q++; if (shiny) e.s++; e.l.push(ind);
    u.ultimo = num;
    gravar("usum_caixa", todos);
    registrar(login, num);
    if (USUM.conferirColecao) USUM.conferirColecao(login, u.nome, u);
    return ind;
  }
  function tirarInd(u, num, ind) {
    const e = u.p[num];
    e.l = e.l.filter((x) => x !== ind); e.q--; if (ind.s) e.s--;
    if (e.s > e.q) e.s = e.q;
    const acabou = e.q <= 0;
    if (acabou) { delete u.p[num]; if (u.ultimo == num) u.ultimo = 0; }
    return acabou;
  }
  // troca: tira 1 Pokémon (qual = número na lista, senão o mais fraco; o shiny, se pedir)
  function tirarUm(login, num, shiny, qual) {
    const todos = ler("usum_caixa", {}), u = todos[login], e = u && u.p[num];
    if (!e) return null;
    const ind = escolher(ordenar(completar(e).l), qual, shiny);
    if (!ind) return null;
    const pos = ordenar(e.l).indexOf(ind);
    e.l = e.l.slice(); const acabou = tirarInd(u, num, ind);
    gravar("usum_caixa", todos);
    return { acabou, ind, pos };
  }
  // release: qual = "todos", número da lista, ou o mais fraco
  function soltar(login, num, qual) {
    const todos = ler("usum_caixa", {}), u = todos[login];
    if (!u || !u.p[num]) return null;
    if (qual === "todos") { delete u.p[num]; if (u.ultimo == num) u.ultimo = 0; gravar("usum_caixa", todos); return { acabou: true }; }
    const e = completar(u.p[num]), ind = escolher(ordenar(e.l), qual, false);
    if (!ind) return null;
    const acabou = tirarInd(u, num, ind);
    gravar("usum_caixa", todos);
    return { acabou, ind };
  }
  // apelido de um Pokémon capturado: pos = número na lista (1 = mais forte); apelido vazio apaga
  function apelidar(login, num, pos, apelido) {
    const todos = ler("usum_caixa", {}), u = todos[login], e = u && u.p[num];
    if (!e) return null;
    const ind = ordenar(completar(e).l)[pos - 1];
    if (!ind) return null;
    if (apelido) ind.a = String(apelido).slice(0, 12); else delete ind.a;
    gravar("usum_caixa", todos);
    return ind;
  }
  // apelido do parceiro do chat: o primeiro da espécie (do mesmo tipo, shiny ou não) que tiver apelido
  function apelidoDe(login, num, shiny) {
    const l = individuos(login, num), x = l.find((i) => i.a && !!i.s === !!shiny) || l.find((i) => i.a);
    return x ? x.a : "";
  }
  /* ---- bordas da fotinha do chat por espécie (o parceiro tem que ser essa espécie):
     capturou 5 = Bronze · 10 = Prata · 15 = Ouro · 20 = Esmeralda · capturou um com força 100% = Arco-íris neon ---- */
  const BORDAS = [[20, "esmeralda", "Esmeralda"], [15, "ouro", "Ouro"], [10, "prata", "Prata"], [5, "bronze", "Bronze"]];
  /* Cada borda é exclusiva do Pokémon em que a pessoa cumpriu o critério:
     · Bronze/Prata/Ouro/Esmeralda: capturou ESSA espécie 5/10/15/20 vezes na grama (troca, evolução e inicial não contam)
     · Shiny: capturou um shiny dessa espécie na grama E o parceiro é esse shiny
     · Arco-íris neon: capturou um com força 100% dessa espécie E ele ainda está na caixa, e o parceiro é ele (mesmo shiny ou não)
     shiny = como o parceiro está (true/false). Sem informar (aviso de borda nova), vale a espécie. */
  function bordasLiberadas(login, num, shiny) {
    const e = (ler("usum_capturas", {})[login] || {})[num] || {}, n = e.n || 0;
    const l = BORDAS.slice().reverse().filter(([min]) => n >= min).map(([, id, nome]) => ({ id, nome }));
    if (USUM.rancho && USUM.rancho.temBordaRancho(login, num)) l.push({ id: "rancho", nome: "Rancho" });   // amizade cheia no rancho
    if (USUM.rancho && USUM.rancho.bordaRaid && USUM.rancho.bordaRaid(login) === +num) l.push({ id: "raid", nome: "Raid" });   // o Pokémon que ela mais usou em Raids
    if (USUM.rancho && USUM.rancho.bitsDe && USUM.rancho.bitsDe(login) >= 100) l.push({ id: "bits", nome: "Bits" });   // mandou 100 bits (vale para todos)
    if (individuos(login, num).some((x) => evTotal(x.ev) >= 510 && (shiny == null || !!x.s === !!shiny))) l.push({ id: "dojo", nome: "Dojo" });   // treino máximo no dojo (510 EVs)
    const confere = shiny === undefined || shiny === null;
    if (e.sh && (confere || shiny)) l.push({ id: "shiny", nome: "Shiny" });
    if (e.p) {
      const perfeito = individuos(login, num).some((x) => forcaIV(x.iv) >= 100 && (confere || !!x.s === !!shiny));
      if (perfeito) l.push({ id: "arcoiris", nome: "Arco-íris neon" });
    }
    return l;
  }
  // a mais rara liberada
  function bordaDe(login, num, shiny) {
    const n = ((ler("usum_capturas", {})[login] || {})[num] || {}).n || 0, l = bordasLiberadas(login, num, shiny), b = l[l.length - 1];
    return b ? Object.assign({ n }, b) : { id: "", nome: "", n };
  }
  // a borda que aparece: a escolhida com !borda (se liberada para esse parceiro), "nenhuma", ou a mais rara
  function bordaUsada(login, num, shiny) {
    const esc = (((ler("usum_perfil", {})[login] || {}).bordas) || {})[num];
    if (esc === "nenhuma") return { id: "", nome: "" };
    const l = bordasLiberadas(login, num, shiny), achou = l.find((b) => b.id === esc);
    return achou || bordaDe(login, num, shiny);
  }
  // conta cada captura (na grama) e devolve a borda nova, se liberou uma agora
  function registrarCaptura(login, num, forcaPct, shiny) {
    const antes = bordaDe(login, num).id;
    const c = ler("usum_capturas", {}), u = c[login] = c[login] || {}, e = u[num] = u[num] || { n: 0 };
    e.n = (e.n || 0) + 1;                       // só captura na grama conta
    if (forcaPct >= 100) e.p = 1;
    if (shiny) e.sh = 1;
    gravar("usum_capturas", c);
    const depois = bordaDe(login, num);
    return depois.id && depois.id !== antes ? depois : null;
  }
  // limite: no máximo N de cada espécie por pessoa
  const totalDe = (login) => Object.values(caixa(login).p || {}).reduce((t, e) => t + (e.q || 0), 0);
  const cheio = (login, num) => C.limitePorEspecie > 0 && ((caixa(login).p[num] || {}).q || 0) >= C.limitePorEspecie;
  function pode(login, num, shiny) {
    const e = caixa(login).p[num];
    if (shiny) return !!(e && e.s);
    return INICIAIS.has(num) || !!e;
  }
  function resumoCaixa(login) {
    const p = caixa(login).p, ks = Object.keys(p);
    return { especies: ks.length, total: ks.reduce((a, k) => a + p[k].q, 0), shiny: ks.filter((k) => p[k].s).length,
      lendarios: ks.filter((k) => ehLendario.has(+k)).length, ultimo: caixa(login).ultimo || 0 };
  }

  /* ---- mochila: usum_mochila = { login: { great: 2, master: 1 } } ---- */
  function mochila(login) { return ler("usum_mochila", {})[login] || {}; }
  function darBola(login, bola, n) {
    const todos = ler("usum_mochila", {}); const u = todos[login] || (todos[login] = {});
    u[bola] = Math.max(0, (u[bola] || 0) + n); gravar("usum_mochila", todos);
    return u[bola];
  }
  // bola que a pessoa vai jogar: a equipada (!ball) se tiver; compráveis só com estoque; senão Poké Ball
  // o streamer e os ajudantes (config.js) começam com algumas bolas de cada (uma vez só); depois gastam como todo mundo
  (function estoqueInicial() {
    const cfg = window.USUM_CONFIG || {}, n = cfg.bolasIniciaisEquipe == null ? 10 : +cfg.bolasIniciaisEquipe;
    const nMaster = cfg.masterInicialEquipe == null ? n : +cfg.masterInicialEquipe;
    const versao = String(cfg.estoqueEquipeVersao || 1);   // mudou a versão no config.js -> a equipe ganha de novo (uma vez)
    if (!n && !nMaster) return;
    const quem = [cfg.canal].concat(cfg.ajudantes || []).filter(Boolean).map((x) => String(x).toLowerCase());
    const feito = ler("usum_estoque_inicial", {}), todos = ler("usum_mochila", {});
    let mudou = false;
    quem.forEach((l) => {
      if (String(feito[l]) === versao || (versao === "1" && feito[l])) return;
      const u = todos[l] || (todos[l] = {});
      // "no mínimo": rodar em várias telas não duplica
      COMPRAVEIS.forEach((b) => { u[b] = Math.max(u[b] || 0, b === "master" ? nMaster : n); });
      feito[l] = versao; mudou = true;
    });
    if (mudou) { gravar("usum_mochila", todos); gravar("usum_estoque_inicial", feito); }
  })();
  function bolaDe(login) {
    const eq = ler("usum_bolas", {})[login] || "poke";
    if (eq === "premier") return "premier";
    if (COMPRAVEIS.includes(eq)) return (mochila(login)[eq] || 0) > 0 ? eq : "poke";
    return eq;
  }
  function gastarBola(login, bola) {
    if (bola === "premier" || JOHTO.includes(bola)) { if ((mochila(login)[bola] || 0) > 0) darBola(login, bola, -1); return; }   // brinde / forjada no rancho: gasta se tiver
    if (!COMPRAVEIS.includes(bola)) return;
    if (darBola(login, bola, -1) <= 0) { const b = ler("usum_bolas", {}); b[login] = "poke"; gravar("usum_bolas", b); }
  }
  const evolucoes = (num) => EVOLUI[num] || [];

  /* ---- convívio: minutos em que a pessoa conversou no chat com esse Pokémon como parceiro ----
     usum_convivio = { login: { num: { m: minutos, u: último minuto contado } } }. Cada minuto com mensagem conta 1.
     Para evoluir: 10 min (1ª evolução) e 15 min para a forma final. */
  function anotarConversa(login, num) {
    if (!login || !num) return;
    const todos = ler("usum_convivio", {}), u = todos[login] || (todos[login] = {}), e = u[num] || (u[num] = { m: 0, u: 0 });
    const agora = Math.floor(Date.now() / 60000);
    if (e.u === agora) return;
    e.u = agora; e.m++; gravar("usum_convivio", todos);
  }
  const minutosCom = (login, num) => ((((ler("usum_convivio", {})[login]) || {})[num]) || {}).m || 0;
  // minutos que precisa para evoluir de num para alvo (forma final = 30, as outras = 10)
  function minutosParaEvoluir(alvo) {
    const r = (window.USUM_CONFIG || {}).selvagens || {};
    const esp = Object.assign({ 462: 30 }, r.minutosEspeciais || {});   // Magnezone: 30 min
    if (esp[alvo] != null) return esp[alvo];
    return evolucoes(alvo).length ? (r.minutosEvoluir ?? 10) : (r.minutosEvoluirFinal ?? 15);
  }

  USUM.selvagens = { C, registrar, verPokemon, anotarConversa, minutosCom, minutosParaEvoluir, bordaDe, bordasLiberadas, bordaUsada, registrarCaptura, NATUREZAS, novoIV, novaNatureza, nomeNatureza, estagio, deAlola, surto, rota, anotarRota, acharRegiao, REGIOES, sortear, chance, caixa, guardar, apelidar, apelidoDe, soltar, tirarUm, individuos, escolher, forcaIV, nota, totalDe, cheio, pode, resumoCaixa, mochila, darBola, bolaDe, gastarBola, evolucoes,
    forca, EFEITO, COMPRAVEIS, JOHTO, BEBES, DEX_ALOLA, nivelInicial, nivelDe, custoNivel, ganharXP, nivelParaEvoluir, timesHoje, timeMenor, segurarItem, EV_NOMES, evTotal, treinarEV, estagio, mexerGolpe, carregarGolpes, carregarDex, temDex: () => !!DEXI, gruposOvo, sexoDe, casalDaycare, sortearGolpe, garantirGolpes, golpeDe, temGolpes: () => !!LEARN, pai: (n) => PAI[n] || 0, ler, gravar, ehLendario: (n) => ehLendario.has(n), iniciais: INICIAIS,
    // em Alola, quem tem forma de Alola aparece (e é guardado) na forma de Alola
    urlHome: (num, shiny) => {
      const id = USUM.homeId && USUM.formaRegional ? USUM.homeId(num, USUM.formaRegional(num)) : num;
      return (((window.USUM_CONFIG || {}).imagens || {}).pastaHOME || "../../Pokemon Assets/pokemon/other/home/") + (shiny ? "shiny/" : "") + id + ".png";
    } };
})();
