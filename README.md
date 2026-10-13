# valda.cloud

Sbírka her, knih a drobných webových experimentů.

🌐 Živě na **[valda.cloud](https://valda.cloud)**

## Hry

| | Hra | Popis |
|---|---|---|
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
├── games/            hry (každá je jeden HTML soubor)
├── book/             knihy ke stažení
└── assets/           sdílené CSS a fonty
```

CSS se odkazuje s `?v=<prvních 12 znaků sha256>` kvůli cache — po změně CSS hash přepočítej.

## Licence

Viz [LICENSE](LICENSE).
