# valda.cloud

Sbírka her, knih a drobných webových experimentů.

🌐 Živě na **[valda.cloud](https://valda.cloud)**

## Hry

| | Hra | Popis |
|---|---|---|
| 🧠 | **[Neuronová laboratoř](web/games/neural-ocr.html)** | Výuková neuronová síť pro číslice 0–9. Skutečné učení, vizualizace vah a kreslení myší i prstem. |
| 🎯 | **[Tank Duel 3D](web/games/tank-duel-3d.html)** | Texturovaný tankový souboj v 3D městě na vlastním WebGL enginu. |
| 👾 | **[3D Tank Duel — ZX Spectrum](web/games/3d-tank-duel-zx-spectrum.html)** | Vektorová, drátěná pocta osmibitové klasice ze ZX Spectra. |
| ⚙️ | **[Bobby Bearing](web/games/bobby-bearing.html)** | Izometrický hlavolam — kutálej kuličku po nakloněných plošinách. Pocta The Edge z roku 1986. |
| 🚀 | **[Zaxxon](web/games/zaxxon.html)** | Izometrická vesmírná střílečka nad pevností. Pocta arkádové klasice SEGA z roku 1982. |
| 🛩️ | **[H.A.T.E!](web/games/hate.html)** | Hostile All-Terrain Encounter — vektorový remake diagonální izometrické střílečky ze ZX Spectra (1989). |
| 💣 | **[Commando](web/games/commando.html)** | Vertikální válečná střílečka přes zákopy a kulometná hnízda. Pocta arkádové klasice z roku 1985. |
| 🏰 | **[Wolfenstein 3D](web/games/wolfenstein-3d.html)** | Raycastingová střílečka z vlastního pohledu. Pocta klasice id Software z roku 1992. |
| 🃏 | **[Sedma](web/games/sedma.html)** | Hospodská karetní klasika proti počítači. |
| 🤡 | **[Žolík](web/games/zolik.html)** | Rodinná karetní legenda proti počítači — postupky, trojice, volitelná pravidla. |

## Knihy

| | Kniha | Popis |
|---|---|---|
| 📕 | **[Za dva dny to nahodíme](web/book/za-dva-dny-to-nahodime/)** | O úsudku, odpovědnosti a dodávce softwaru. Zdarma v PDF a EPUB. |

Přehled všech knih je na [/book/](web/book/).

## Ostatní

- **[Kurník + králíkárna](web/kurnik-kralikarna-plan.html)** — stavební plán a kusovník.
- **[Park Zahrádky](web/park-zahradky-redesign/)** — návrh redesignu webu spolku Rokytka žije.

## Struktura

Čistě statický web bez buildu. Všechno, co se nasazuje, je ve složce [web/](web/), která se kopíruje na nginx server.

```
web/
├── index.html        rozcestník
├── games/            hry a experimenty (HTML, případně lokální JS/CSS)
├── book/             knihy ke stažení
└── assets/           sdílené CSS a fonty
```

CSS se odkazuje s `?v=<prvních 12 znaků sha256>` kvůli cache — po změně CSS hash přepočítej.

## Neuronová laboratoř

Podrobný popis ovládání a modelu: [průvodce laboratoří](docs/guides/neural-ocr.md).

Síť **256 → 24 → 10** zpracovává obrázky **16 × 16 pixelů** a učí se přímo v prohlížeči.
Učební sada obsahuje **pět variant každé číslice 0–9**, celkem 50 vzorů.
Izometrický graf zobrazuje vstupní mřížku, neurony jako kuličky a deset výstupů.
Kliknutím na neuron zobrazíš propojenou mapu všech jeho 256 vstupních vah, aktivaci a bias.
Pod sítí je úzká pixelová mapa všech **6 384 vah a 34 biasů**; jeden pixel odpovídá jedné hodnotě.
Kliknutím na řádek vybereš neuron, najetím nebo klepnutím zobrazíš konkrétní hodnotu. Fungují také šipky na klávesnici.
Na mobilu se izometrická síť posouvá do stran.
Přepínač **FP64 — plná přesnost / FP8 — simulovaná** mění váhy a biasy použité pro rozpoznávání i jejich barevné mapy.
FP8 simuluje E4M3 bez škálování. Původní hodnoty zachová; učení, statistiky tréninku i samotné výpočty zůstávají ve FP64.
U výsledku uvidíš největší změnu skóre proti FP64. Stejná barevná škála umožňuje srovnat oba režimy.
Tlačítko **Nauč se** spustí učení, **Jeden krok** zpracuje jeden obrázek.
Po 100 průchodech (5 000 krocích) se učení samo zastaví; testování zůstane dostupné.
Výběr vzoru nebo kreslení trénink pozastaví. **Začít od nuly** resetuje váhy a statistiky, **Vymazat** jen kresbu.
Úspěšnost se měří na trénovacích vzorech; nepředstavuje přesnost na neznámém rukopisu.
Síť porovnává pouze číslice a nerozpozná spolehlivě, že vstup je písmeno.
Kresby ani model se neodesílají a po obnovení stránky se stav ztratí.

Lokální spuštění: `python3 -m http.server 8765 --directory web`, potom otevři [náhled laboratoře](http://localhost:8765/games/neural-ocr.html).
Numerické testy bez závislostí: `node --test tests/*.test.mjs` (Node.js 22.18+).
Testy prohlížeče vyžadují Playwright a Chrome: `node tests/neural-ocr.browser.cjs` při běžícím serveru na portu 8765.
Test FP8 a map parametrů: `node tests/neural-ocr-precision.browser.cjs` (Chrome a WebKit).
Test izometrického pohledu: `node tests/neural-ocr-view.browser.cjs` (Chrome a WebKit).
Regresní test pauzy v Chromu a WebKitu (engine Safari): `node tests/neural-ocr-pause.browser.cjs`. Vyžaduje také WebKit z Playwright (`npx playwright install webkit`).
Pokud Playwright není v lokálním `node_modules`, nastav `PLAYWRIGHT_PATH` na jeho adresář.

## Licence

Viz [LICENSE](LICENSE).
